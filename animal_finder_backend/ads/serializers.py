from rest_framework import serializers
from .models import Ad, Favorite, Notification


class AdSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_vk_id = serializers.SerializerMethodField()
    author_vk_photo = serializers.SerializerMethodField()
    views_count = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Ad
        fields = ['id', 'type', 'animal_type', 'title', 'breed', 'color',
                  'district', 'description', 'date', 'lat', 'lng', 'status',
                  'author', 'author_name', 'author_vk_id', 'author_vk_photo',
                  'phone', 'created_at', 'photo', 'photo2', 'photo3',
                  'views_count', 'is_favorited']
        read_only_fields = ['id', 'author', 'author_name', 'author_vk_id', 'author_vk_photo',
                            'created_at', 'views_count', 'is_favorited']

    def get_author_name(self, obj):
        first = obj.author.first_name
        last = obj.author.last_name
        if first:
            return f"{first} {last}".strip()
        return obj.author.username

    def get_author_vk_id(self, obj):
        try:
            return obj.author.profile.vk_id or ''
        except Exception:
            return ''

    def get_author_vk_photo(self, obj):
        try:
            return obj.author.profile.vk_photo or ''
        except Exception:
            return ''

    def get_views_count(self, obj):
        return obj.views.count()

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, ad=obj).exists()
        return False


class NotificationSerializer(serializers.ModelSerializer):
    ad_title = serializers.SerializerMethodField()
    ad_id = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'type', 'message', 'is_read', 'created_at', 'ad_title', 'ad_id']
        read_only_fields = ['id', 'type', 'message', 'created_at', 'ad_title', 'ad_id']

    def get_ad_title(self, obj):
        return obj.ad.title if obj.ad else ''

    def get_ad_id(self, obj):
        return obj.ad.id if obj.ad else None
