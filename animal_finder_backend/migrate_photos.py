import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'animal_finder_backend.settings')
import django
django.setup()

from ads.models import Ad
from django.contrib.auth.models import User
from django.core.files import File

DB_FOLDER = r'C:\Users\Grisha\Desktop\Godot_Sila\vk_animal_bot\pythonProject6\animal_db'

admin_user = User.objects.filter(is_superuser=True).first()

for img_file in Path(DB_FOLDER).glob('*.jpg'):
    with open(img_file, 'rb') as f:
        ad = Ad(
            type='lost',
            animal_type='other',
            title=f"Фото из базы: {img_file.name}",
            breed='Неизвестно',
            color='Неизвестно',
            district='Центральный',
            description='Автоматически импортированное фото',
            date='2024-01-01',
            lat=56.1280,
            lng=40.4070,
            status='approved',
            author=admin_user,
        )
        ad.photo.save(img_file.name, File(f), save=True)
        print(f"✅ Импортировано: {img_file.name}")

print("Готово!")