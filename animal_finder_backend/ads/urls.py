from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdViewSet, BotCreateAdView, BotMyAdsView, NotificationListView

router = DefaultRouter()
router.register(r'ads', AdViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('bot/create_ad/', BotCreateAdView.as_view(), name='bot-create-ad'),
    path('bot/my_ads/', BotMyAdsView.as_view(), name='bot-my-ads'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
]
