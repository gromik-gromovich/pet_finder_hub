from django.contrib import admin
from .models import Ad, AdView, Favorite, Notification

@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'type', 'animal_type', 'district', 'status', 'author', 'created_at']
    list_filter = ['type', 'animal_type', 'district', 'status']
    search_fields = ['title', 'description', 'author__username']
    list_editable = ['status']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(AdView)
class AdViewAdmin(admin.ModelAdmin):
    list_display = ['id', 'ad', 'user', 'ip_address', 'viewed_at']
    list_filter = ['viewed_at']
    readonly_fields = ['viewed_at']

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'ad', 'created_at']
    readonly_fields = ['created_at']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'type', 'is_read', 'created_at']
    list_filter = ['type', 'is_read']
    readonly_fields = ['created_at']
