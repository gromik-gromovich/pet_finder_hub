import os
import vk_api
from vk_api.bot_longpoll import VkBotLongPoll, VkBotEventType
import requests
import json

# =============== ВАШИ ДАННЫЕ ===============
VK_TOKEN = os.getenv('VK_GROUP_TOKEN', '')
GROUP_ID = 237844372
AI_SERVER_URL = "http://127.0.0.1:8000/search_similar"


# ===========================================

def download_photo(photo_url):
    """Скачивает фото по URL"""
    response = requests.get(photo_url)
    return response.content


# Авторизация
vk_session = vk_api.VkApi(token=VK_TOKEN)
vk = vk_session.get_api()
longpoll = VkBotLongPoll(vk_session, GROUP_ID)

print("Бот запущен и слушает сообщения...")

for event in longpoll.listen():
    if event.type == VkBotEventType.MESSAGE_NEW:
        msg = event.obj.message
        peer_id = msg['peer_id']
        attachments = msg.get('attachments', [])

        found_photo = False
        for attachment in attachments:
            if attachment['type'] == 'photo':
                photo = attachment['photo']
                photo_url = photo['sizes'][-1]['url']
                found_photo = True
                print(f"Получено фото от {peer_id}")

                try:
                    image_data = download_photo(photo_url)
                    files = {'file': ('photo.jpg', image_data)}
                    response = requests.post(AI_SERVER_URL, files=files)

                    print(f"Статус ответа сервера: {response.status_code}")
                    print(f"Ответ сервера: {response.text}")

                    if response.status_code == 200:
                        result = response.json()
                        # Проверяем, есть ли поле message в ответе
                        if 'message' in result:
                            answer = result['message']
                        elif 'found' in result and not result['found']:
                            answer = f"❌ Животное не найдено. Схожесть: {result.get('similarity', 0)}%"
                        else:
                            answer = f"🔍 Найдено: {result.get('match', 'неизвестно')} ({result.get('similarity', 0)}%)"
                    else:
                        answer = f"❌ Ошибка на сервере поиска (код: {response.status_code})"
                except Exception as e:
                    print(f"Ошибка при отправке на сервер: {e}")
                    answer = "❌ Не удалось обработать фото"

                vk.messages.send(
                    peer_id=peer_id,
                    message=answer,
                    random_id=0
                )
                break

        if not found_photo:
            vk.messages.send(
                peer_id=peer_id,
                message="📸 Пожалуйста, отправьте фото животного",
                random_id=0
            )