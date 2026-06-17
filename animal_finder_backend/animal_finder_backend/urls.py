from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from users.views import RegisterView, LoginView, LogoutView, MeView, VKAuthCallbackView, VKGenerateCodeView, VKVerifyCodeView, RegisterRequestView, RegisterVerifyView, AdminUsersView, AdminAnalyticsView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('ads.urls')),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/auth/me/', MeView.as_view(), name='me'),
    path('api/auth/vk/callback/', VKAuthCallbackView.as_view(), name='vk-callback'),
    path('api/auth/vk/generate_code/', VKGenerateCodeView.as_view(), name='vk-generate-code'),
    path('api/auth/vk/verify_code/', VKVerifyCodeView.as_view(), name='vk-verify-code'),
    path('api/auth/register/request/', RegisterRequestView.as_view(), name='register-request'),
    path('api/auth/register/verify/', RegisterVerifyView.as_view(), name='register-verify'),
    path('api/admin/users/', AdminUsersView.as_view(), name='admin-users'),
    path('api/admin/users/<int:user_id>/', AdminUsersView.as_view(), name='admin-user-toggle'),
    path('api/admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)