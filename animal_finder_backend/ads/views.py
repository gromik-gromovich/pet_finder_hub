from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
import os
from .models import Ad, AdPhoto, AdView, Favorite, Notification
from .serializers import AdSerializer, NotificationSerializer


def _check_bot_key(request):
    expected_key = os.getenv('BOT_API_KEY', 'secret-bot-key-123')
    return request.headers.get('X-Bot-Key') == expected_key


def _sync_ad_photos(ad):
    for sort_order, image in enumerate([ad.photo, ad.photo2, ad.photo3]):
        if image:
            AdPhoto.objects.update_or_create(
                ad=ad,
                sort_order=sort_order,
                defaults={'image': image.name},
            )


class BotCreateAdView(APIView):
    permission_classes = []

    def post(self, request):
        if not _check_bot_key(request):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        vk_user_id = request.data.get('vk_user_id')
        if not vk_user_id:
            return Response({'error': 'vk_user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        user, _ = User.objects.get_or_create(username=f"vk_{vk_user_id}")
        serializer = AdSerializer(data=request.data)
        if serializer.is_valid():
            ad = serializer.save(author=user, status='pending')
            _sync_ad_photos(ad)
            return Response({'id': ad.id, 'status': ad.status}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BotMyAdsView(APIView):
    permission_classes = []

    def get(self, request):
        if not _check_bot_key(request):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        vk_user_id = request.query_params.get('vk_user_id')
        if not vk_user_id:
            return Response({'error': 'vk_user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        ads = Ad.objects.filter(author__username=f"vk_{vk_user_id}").order_by('-created_at')[:10]
        result = [
            {
                'id': ad.id,
                'title': ad.title,
                'status': ad.status,
                'type': ad.type,
                'animal_type': ad.animal_type,
                'district': ad.district,
                'date': str(ad.date),
            }
            for ad in ads
        ]
        return Response(result)


class AdViewSet(viewsets.ModelViewSet):
    queryset = Ad.objects.all()
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'breed', 'color']
    ordering_fields = ['created_at', 'date']

    def get_queryset(self):
        queryset = Ad.objects.all()

        ad_type = self.request.query_params.get('type')
        animal_type = self.request.query_params.get('animal_type')
        district = self.request.query_params.get('district')
        ad_status = self.request.query_params.get('status')

        if ad_type and ad_type != 'all':
            queryset = queryset.filter(type=ad_type)
        if animal_type and animal_type != 'all':
            queryset = queryset.filter(animal_type=animal_type)
        if district and district != 'all':
            queryset = queryset.filter(district=district)
        if ad_status:
            queryset = queryset.filter(status=ad_status)

        return queryset

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def record_view(self, request, pk=None):
        instance = self.get_object()
        user = request.user if request.user.is_authenticated else None
        ip = request.META.get('REMOTE_ADDR')
        AdView.objects.create(ad=instance, user=user, ip_address=ip)
        return Response({'views_count': instance.views.count() + 1})

    def perform_create(self, serializer):
        extra = {}
        if 'photo2' in self.request.FILES:
            extra['photo2'] = self.request.FILES['photo2']
        if 'photo3' in self.request.FILES:
            extra['photo3'] = self.request.FILES['photo3']
        ad = serializer.save(author=self.request.user, **extra)
        _sync_ad_photos(ad)

    @action(detail=False, methods=['get'])
    def my_ads(self, request):
        ads = Ad.objects.filter(author=request.user)
        serializer = self.get_serializer(ads, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Доступ запрещен'}, status=403)
        ads = Ad.objects.filter(status=Ad.Status.PENDING)
        serializer = self.get_serializer(ads, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Доступ запрещен'}, status=403)
        ad = self.get_object()
        ad._status_changed_by = request.user
        ad.status = Ad.Status.APPROVED
        ad.save()
        try:
            import requests as req
            ai_url = os.getenv('AI_SERVER_URL', 'http://ai-server:8001/search_similar')
            base_url = ai_url.replace('/search_similar', '')
            req.post(f'{base_url}/reload_embeddings', timeout=5)
        except Exception:
            pass
        return Response({'status': 'approved'})

    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Доступ запрещен'}, status=403)
        ad = self.get_object()
        ad._status_changed_by = request.user
        ad.status = Ad.Status.REJECTED
        ad.save()
        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_favorite(self, request, pk=None):
        ad = self.get_object()
        fav, created = Favorite.objects.get_or_create(user=request.user, ad=ad)
        if not created:
            fav.delete()
            return Response({'is_favorited': False})
        return Response({'is_favorited': True})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def favorites(self, request):
        fav_ad_ids = Favorite.objects.filter(user=request.user).values_list('ad_id', flat=True)
        ads = Ad.objects.filter(id__in=fav_ad_ids)
        serializer = self.get_serializer(ads, many=True)
        return Response(serializer.data)


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notifs, many=True)
        unread_count = notifs.filter(is_read=False).count()
        return Response({'notifications': serializer.data, 'unread_count': unread_count})

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'ok'})
