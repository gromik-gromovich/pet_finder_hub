from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import requests
import os


class Ad(models.Model):
    """Модель объявления о пропавшем/найденном животном"""

    class Type(models.TextChoices):
        LOST = 'lost', 'Пропал'
        FOUND = 'found', 'Найден'

    class AnimalType(models.TextChoices):
        CAT = 'cat', 'Кошка'
        DOG = 'dog', 'Собака'
        OTHER = 'other', 'Другое'

    class Status(models.TextChoices):
        PENDING = 'pending', 'На проверке'
        APPROVED = 'approved', 'Опубликовано'
        REJECTED = 'rejected', 'Отклонено'

    class District(models.TextChoices):
        OKTYABRSKY = 'Октябрьский', 'Октябрьский'
        LENINSKY = 'Ленинский', 'Ленинский'
        FRUNZENSKY = 'Фрунзенский', 'Фрунзенский'

    type = models.CharField(max_length=10, choices=Type.choices, verbose_name='Тип')
    animal_type = models.CharField(max_length=10, choices=AnimalType.choices, verbose_name='Вид животного')
    title = models.CharField(max_length=100, verbose_name='Заголовок')
    breed = models.CharField(max_length=100, verbose_name='Порода')
    color = models.CharField(max_length=100, verbose_name='Окрас')
    district = models.CharField(max_length=20, choices=District.choices, verbose_name='Район')
    description = models.TextField(verbose_name='Описание')
    date = models.DateField(verbose_name='Дата пропажи/находки')
    lat = models.FloatField(verbose_name='Широта')
    lng = models.FloatField(verbose_name='Долгота')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, verbose_name='Статус')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ads', verbose_name='Автор')
    photo = models.ImageField(upload_to='pet_photos/', blank=True, null=True, verbose_name='Фото')
    photo2 = models.ImageField(upload_to='pet_photos/', blank=True, null=True, verbose_name='Фото 2')
    photo3 = models.ImageField(upload_to='pet_photos/', blank=True, null=True, verbose_name='Фото 3')
    phone = models.CharField(max_length=20, blank=True, default='', verbose_name='Телефон для связи')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    def __str__(self):
        return f"{self.title} - {self.author.username}"

    class Meta:
        verbose_name = 'Объявление'
        verbose_name_plural = 'Объявления'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status'], name='ads_ad_status_idx'),
            models.Index(fields=['type'], name='ads_ad_type_idx'),
            models.Index(fields=['animal_type'], name='ads_ad_animal_type_idx'),
            models.Index(fields=['district'], name='ads_ad_district_idx'),
            models.Index(fields=['author'], name='ads_ad_author_idx'),
            models.Index(fields=['status', 'type'], name='ads_ad_status_type_idx'),
            models.Index(fields=['lat', 'lng'], name='ad_coords_idx'),
            models.Index(fields=['created_at'], name='ad_created_idx'),
        ]


class AdView(models.Model):
    ad = models.ForeignKey(Ad, on_delete=models.CASCADE, related_name='views', verbose_name='Объявление')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ad_views')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP адрес')
    viewed_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата просмотра')

    class Meta:
        verbose_name = 'Просмотр'
        verbose_name_plural = 'Просмотры'


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites', verbose_name='Пользователь')
    ad = models.ForeignKey(Ad, on_delete=models.CASCADE, related_name='favorites', verbose_name='Объявление')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата добавления')

    class Meta:
        unique_together = ('user', 'ad')
        verbose_name = 'Избранное'
        verbose_name_plural = 'Избранное'


class Notification(models.Model):
    class Type(models.TextChoices):
        AD_APPROVED = 'approved', 'Объявление одобрено'
        AD_REJECTED = 'rejected', 'Объявление отклонено'
        AD_FOUND = 'found_match', 'Найдено похожее'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', verbose_name='Пользователь')
    ad = models.ForeignKey(Ad, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    type = models.CharField(max_length=20, choices=Type.choices, verbose_name='Тип')
    message = models.TextField(verbose_name='Сообщение')
    is_read = models.BooleanField(default=False, verbose_name='Прочитано')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата')

    class Meta:
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'
        ordering = ['-created_at']


@receiver(post_save, sender=Ad)
def send_vk_notification(sender, instance, **kwargs):
    if instance.status in ['approved', 'rejected'] and instance.author.username.startswith('vk_'):
        vk_id = instance.author.username.replace('vk_', '')
        status_text = "одобрено" if instance.status == 'approved' else "отклонено"
        message = f"🐾 Ваше объявление \"{instance.title}\" {status_text}!\n\nСсылка: http://localhost:5173/card/{instance.id}"

        notif_type = 'approved' if instance.status == 'approved' else 'rejected'
        Notification.objects.create(
            user=instance.author,
            ad=instance,
            type=notif_type,
            message=f'Ваше объявление «{instance.title}» {status_text}.',
        )

        vk_token = os.getenv('VK_GROUP_TOKEN', '')
        if not vk_token:
            return
        try:
            requests.post(
                'https://api.vk.com/method/messages.send',
                data={
                    'user_id': vk_id,
                    'message': message,
                    'access_token': vk_token,
                    'v': '5.131',
                    'random_id': 0
                }
            )
            print(f"✅ Уведомление отправлено пользователю {vk_id}")
        except Exception as e:
            print(f"❌ Ошибка отправки уведомления: {e}")