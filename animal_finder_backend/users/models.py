from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    """Расширение модели пользователя (дополнительные поля)"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name='Пользователь')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Телефон')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='Аватар')
    vk_id = models.CharField(max_length=20, blank=True, default='')
    vk_photo = models.URLField(max_length=500, blank=True, default='')

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = 'Профиль'
        verbose_name_plural = 'Профили'