from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
import os
import time
import random
import threading
import requests as req
from .serializers import RegisterSerializer, UserSerializer
from .models import Profile

_codes_lock = threading.Lock()
_login_codes = {}      # code -> {vk_user_id, expires_at}
_reg_codes = {}        # code -> {username, email, password, expires_at}

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        })

class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = User.objects.filter(username=username).first()
        if user and user.check_password(password):
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            })
        return Response({'error': 'Неверные учетные данные'}, status=400)

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        request.user.auth_token.delete()
        return Response({'message': 'Выход выполнен'})

class MeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class VKGenerateCodeView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        expected_key = os.getenv('BOT_API_KEY', 'secret-bot-key-123')
        if request.headers.get('X-Bot-Key') != expected_key:
            return Response({'error': 'Unauthorized'}, status=403)
        vk_user_id = str(request.data.get('vk_user_id', ''))
        if not vk_user_id:
            return Response({'error': 'vk_user_id required'}, status=400)
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        expires_at = time.time() + 300
        with _codes_lock:
            to_del = [k for k, v in _login_codes.items()
                      if v['vk_user_id'] == vk_user_id or v['expires_at'] < time.time()]
            for k in to_del:
                del _login_codes[k]
            _login_codes[code] = {'vk_user_id': vk_user_id, 'expires_at': expires_at}
        return Response({'code': code})


class VKVerifyCodeView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        code = str(request.data.get('code', '')).strip()
        if not code:
            return Response({'error': 'Введите код'}, status=400)
        with _codes_lock:
            entry = _login_codes.get(code)
            if not entry:
                return Response({'error': 'Неверный код'}, status=400)
            if entry['expires_at'] < time.time():
                del _login_codes[code]
                return Response({'error': 'Код истёк, запросите новый'}, status=400)
            vk_user_id = entry['vk_user_id']
            del _login_codes[code]
        username = f"vk_{vk_user_id}"
        user, created = User.objects.get_or_create(username=username)
        if created:
            user.set_unusable_password()

        # Fetch VK profile info
        vk_token = os.getenv('VK_GROUP_TOKEN', '')
        vk_first = ''
        vk_last = ''
        vk_photo = ''
        if vk_token:
            try:
                vk_resp = req.get('https://api.vk.com/method/users.get', params={
                    'user_ids': vk_user_id,
                    'fields': 'photo_200,first_name,last_name',
                    'access_token': vk_token,
                    'v': '5.131',
                }, timeout=5)
                vk_data = vk_resp.json().get('response', [{}])[0]
                vk_first = vk_data.get('first_name', '')
                vk_last = vk_data.get('last_name', '')
                vk_photo = vk_data.get('photo_200', '')
            except Exception:
                pass

        if vk_first:
            user.first_name = vk_first
        if vk_last:
            user.last_name = vk_last
        user.save()

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.vk_id = str(vk_user_id)
        if vk_photo:
            profile.vk_photo = vk_photo
        profile.save()

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})


def _send_code_email(email, code):
    try:
        send_mail(
            subject='Подтверждение регистрации — ПитомецДома',
            message=f'Ваш код подтверждения: {code}\n\nКод действует 10 минут.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )
        print(f"Email sent to {email}, code: {code}")
    except Exception as e:
        print(f"Email send error: {e}")


class RegisterRequestView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not username or not email or not password:
            return Response({'error': 'Заполните все поля'}, status=400)
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Это имя пользователя уже занято'}, status=400)
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Этот email уже используется'}, status=400)

        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        expires_at = time.time() + 600

        with _codes_lock:
            to_del = [k for k, v in _reg_codes.items()
                      if v['email'] == email or v['expires_at'] < time.time()]
            for k in to_del:
                del _reg_codes[k]
            _reg_codes[code] = {
                'username': username,
                'email': email,
                'password': password,
                'expires_at': expires_at,
            }

        t = threading.Thread(target=_send_code_email, args=(email, code), daemon=True)
        t.start()

        return Response({'message': 'Код отправлен на почту'})


class RegisterVerifyView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        code = str(request.data.get('code', '')).strip()
        if not code:
            return Response({'error': 'Введите код'}, status=400)

        with _codes_lock:
            entry = _reg_codes.get(code)
            if not entry:
                return Response({'error': 'Неверный код'}, status=400)
            if entry['expires_at'] < time.time():
                del _reg_codes[code]
                return Response({'error': 'Код истёк, зарегистрируйтесь заново'}, status=400)
            data = dict(entry)
            del _reg_codes[code]

        if User.objects.filter(username=data['username']).exists():
            return Response({'error': 'Имя пользователя уже занято'}, status=400)

        user = User.objects.create(
            username=data['username'],
            email=data['email'],
        )
        user.set_password(data['password'])
        user.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})


class AdminUsersView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Forbidden'}, status=403)
        users = User.objects.all().select_related('profile').prefetch_related('ads').order_by('-date_joined')
        result = []
        for u in users:
            profile = getattr(u, 'profile', None)
            result.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'is_staff': u.is_staff,
                'is_active': u.is_active,
                'date_joined': u.date_joined,
                'vk_id': profile.vk_id if profile else '',
                'vk_photo': profile.vk_photo if profile else '',
                'ads_count': u.ads.count(),
            })
        return Response(result)

    def patch(self, request, user_id):
        if not request.user.is_staff:
            return Response({'error': 'Forbidden'}, status=403)
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        if target.is_superuser:
            return Response({'error': 'Нельзя изменить суперпользователя'}, status=400)
        target.is_active = not target.is_active
        target.save()
        return Response({'is_active': target.is_active})


class AdminAnalyticsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Forbidden'}, status=403)
        from ads.models import Ad, AdView, Favorite, Notification
        return Response({
            'total_ads': Ad.objects.count(),
            'total_users': User.objects.count(),
            'total_views': AdView.objects.count(),
            'total_favorites': Favorite.objects.count(),
            'ads_by_status': {
                'pending': Ad.objects.filter(status='pending').count(),
                'approved': Ad.objects.filter(status='approved').count(),
                'rejected': Ad.objects.filter(status='rejected').count(),
            },
            'ads_by_type': {
                'lost': Ad.objects.filter(type='lost').count(),
                'found': Ad.objects.filter(type='found').count(),
            },
            'ads_by_animal': {
                'cat': Ad.objects.filter(animal_type='cat').count(),
                'dog': Ad.objects.filter(animal_type='dog').count(),
                'other': Ad.objects.filter(animal_type='other').count(),
            },
            'ads_by_district': {
                'Октябрьский': Ad.objects.filter(district='Октябрьский').count(),
                'Ленинский': Ad.objects.filter(district='Ленинский').count(),
                'Фрунзенский': Ad.objects.filter(district='Фрунзенский').count(),
            },
        })


class VKAuthCallbackView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        vk_access_token = request.data.get('access_token')
        vk_user_id = request.data.get('user_id')

        if not vk_access_token or not vk_user_id:
            return Response({'error': 'access_token and user_id required'}, status=400)

        user_resp = req.get('https://api.vk.com/method/users.get', params={
            'user_ids': vk_user_id,
            'fields': 'first_name,last_name',
            'access_token': vk_access_token,
            'v': '5.131',
        }, timeout=10)
        resp_json = user_resp.json()

        if 'error' in resp_json:
            return Response({'error': resp_json['error'].get('error_msg', 'VK error')}, status=400)

        vk_user_data = resp_json.get('response', [{}])[0]
        first_name = vk_user_data.get('first_name', '')
        last_name = vk_user_data.get('last_name', '')

        username = f"vk_{vk_user_id}"
        user, created = User.objects.get_or_create(username=username)
        if created:
            user.first_name = first_name
            user.last_name = last_name
            user.set_unusable_password()
            user.save()

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        })