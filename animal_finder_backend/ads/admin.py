from django.contrib import admin
from .models import Ad, AdPhoto, AdStatusHistory, AdView, Favorite, Notification


class AdPhotoInline(admin.TabularInline):
    model = AdPhoto
    extra = 0
    readonly_fields = ['uploaded_at']


@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'type', 'animal_type', 'district', 'status', 'author', 'created_at']
    list_filter = ['type', 'animal_type', 'district', 'status']
    search_fields = ['title', 'description', 'author__username']
    list_editable = ['status']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [AdPhotoInline]


@admin.register(AdPhoto)
class AdPhotoAdmin(admin.ModelAdmin):
    list_display = ['id', 'ad', 'sort_order', 'uploaded_at']
    list_filter = ['uploaded_at']
    readonly_fields = ['uploaded_at']


@admin.register(AdStatusHistory)
class AdStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'ad', 'old_status', 'new_status', 'changed_by', 'changed_at']
    list_filter = ['old_status', 'new_status', 'changed_at']
    search_fields = ['ad__title', 'changed_by__username', 'comment']
    readonly_fields = ['changed_at']

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
