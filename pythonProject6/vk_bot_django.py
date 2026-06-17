import sys
from pathlib import Path
django_path = Path(__file__).parent.parent / 'animal_finder_backend'
sys.path.append(str(django_path))
import os
import django
import requests
import vk_api
from vk_api.bot_longpoll import VkBotLongPoll, VkBotEventType

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'animal_finder_backend.settings')
django.setup()

from ads.models import Ad
from django.contrib.auth.models import User

# ============= НАСТРОЙКИ =============
VK_TOKEN = os.getenv('VK_GROUP_TOKEN', '')
GROUP_ID = 237844372
AI_SERVER_URL = "http://127.0.0.1:8001/search_similar"
# =====================================

def download_photo(photo_url):
    response = requests.get(photo_url)
    return response.content

def find_similar_ads_from_db(photo_url):
    """Отправляет фото на ИИ-сервер и ищет похожие объявления в БД"""
    try:
        # 1. Отправляем фото на ИИ-сервер
        image_data = download_photo(photo_url)
        files = {'file': ('photo.jpg', image_data)}
        response = requests.post(AI_SERVER_URL, files=files)
        
        if response.status_code != 200:
            return []
        
        # 2. Получаем имена похожих файлов от ИИ
        similar_files = response.json().get('matches', [])
        
        # 3. Ищем объявления в БД, у которых photo содержит эти имена
        similar_ads = []
        for file_name in similar_files:
            # Ищем объявления, где photo содержит имя файла
            ad = Ad.objects.filter(photo__icontains=file_name, status='approved').first()
            if ad and ad not in similar_ads:
                similar_ads.append(ad)
        
        return similar_ads[:5]  # максимум 5 объявлений
        
    except Exception as e:
        print(f"Ошибка ИИ-поиска: {e}")
        return []

def main():
    vk_session = vk_api.VkApi(token=VK_TOKEN)
    vk = vk_session.get_api()
    longpoll = VkBotLongPoll(vk_session, GROUP_ID)
    
    print("🐶 Бот Django запущен и слушает сообщения...")
    print(f"ИИ-сервер: {AI_SERVER_URL}")
    
    for event in longpoll.listen():
        if event.type == VkBotEventType.MESSAGE_NEW:
            msg = event.obj.message
            peer_id = msg['peer_id']
            attachments = msg.get('attachments', [])
            
            if attachments and attachments[0]['type'] == 'photo':
                photo = attachments[0]['photo']
                photo_url = photo['sizes'][-1]['url']
                print(f"📸 Получено фото от {peer_id}")
                
                similar_ads = find_similar_ads_from_db(photo_url)
                
                if similar_ads:
                    answer = "🔍 Найдены похожие объявления:\n\n"
                    for ad in similar_ads:
                        answer += f"🐾 {ad.title}\n"
                        answer += f"   Статус: {'Пропал' if ad.type == 'lost' else 'Найден'}\n"
                        answer += f"   Район: {ad.district}\n"
                        answer += f"   ID объявления: {ad.id}\n\n"
                    answer += "👉 Зайдите на сайт для подробностей: http://127.0.0.1:5173"
                else:
                    answer = "❌ Похожих объявлений не найдено.\n\nВы можете создать объявление на нашем сайте: http://127.0.0.1:5173"
                
                vk.messages.send(peer_id=peer_id, message=answer, random_id=0)
            else:
                vk.messages.send(
                    peer_id=peer_id,
                    message="📸 Отправьте фотографию животного, и я поищу похожие объявления в нашей базе!",
                    random_id=0
                )

if __name__ == "__main__":
    main()