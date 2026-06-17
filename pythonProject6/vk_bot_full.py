import os
from datetime import date

import requests
import vk_api
from vk_api.bot_longpoll import VkBotLongPoll, VkBotEventType
from vk_api.keyboard import VkKeyboard, VkKeyboardColor
from dotenv import load_dotenv

load_dotenv()

VK_TOKEN = os.getenv('VK_GROUP_TOKEN', '')
GROUP_ID = int(os.getenv('VK_GROUP_ID', '237844372'))
BACKEND_URL = os.getenv('BACKEND_URL', 'http://backend:8000')
BACKEND_API_URL = f"{BACKEND_URL}/api"
AI_SERVER_URL = os.getenv('AI_SERVER_URL', 'http://ai-server:8001/search_similar')
BOT_API_KEY = os.getenv('BOT_API_KEY', 'secret-bot-key-123')
SITE_URL = os.getenv('SITE_URL', 'http://localhost:8080')

user_data = {}


def get_main_keyboard():
    keyboard = VkKeyboard(one_time=False)
    keyboard.add_button('📝 Создать объявление', color=VkKeyboardColor.PRIMARY)
    keyboard.add_button('📋 Мои заявки', color=VkKeyboardColor.SECONDARY)
    keyboard.add_line()
    keyboard.add_button('🔍 Поиск по фото', color=VkKeyboardColor.SECONDARY)
    keyboard.add_button('ℹ️ Помощь', color=VkKeyboardColor.SECONDARY)
    keyboard.add_line()
    keyboard.add_button('🔐 Войти на сайт', color=VkKeyboardColor.POSITIVE)
    return keyboard


def download_photo(photo_url):
    response = requests.get(photo_url, timeout=15)
    return response.content


def search_similar_ads(photo_url):
    try:
        image_data = download_photo(photo_url)
        files = {'file': ('photo.jpg', image_data, 'image/jpeg')}
        response = requests.post(AI_SERVER_URL, files=files, timeout=30)

        if response.status_code != 200:
            print(f"AI server returned {response.status_code}")
            return []

        result = response.json()
        print(f"AI server response: {result}")

        if result.get('found'):
            ad_id = result.get('ad_id')
            if ad_id:
                ad_resp = requests.get(f"{BACKEND_API_URL}/ads/{ad_id}/", timeout=10)
                if ad_resp.status_code == 200:
                    return [ad_resp.json()]
        return []
    except Exception as e:
        print(f"Search error: {e}")
        return []


def create_ad_via_api(user_id, data):
    form_data = {
        'type': data['type'],
        'animal_type': data['animal_type'],
        'title': data['title'],
        'breed': data['breed'],
        'color': data['color'],
        'district': data['district'],
        'description': data['description'],
        'date': str(date.today()),
        'lat': '56.1280',
        'lng': '40.4070',
        'vk_user_id': str(user_id),
    }
    files = None
    if data.get('photo_url'):
        try:
            photo_response = requests.get(data['photo_url'], timeout=15)
            if photo_response.status_code == 200:
                files = {'photo': (f'vk_photo_{user_id}.jpg', photo_response.content, 'image/jpeg')}
        except Exception as e:
            print(f"Photo download error: {e}")

    response = requests.post(
        f"{BACKEND_API_URL}/bot/create_ad/",
        data=form_data,
        files=files,
        headers={'X-Bot-Key': BOT_API_KEY},
        timeout=20,
    )
    return response


def get_cancel_keyboard():
    keyboard = VkKeyboard(one_time=False)
    keyboard.add_button('❌ Отмена', color=VkKeyboardColor.NEGATIVE)
    return keyboard


def create_ad_flow(vk, user_id, step, text, photo_url=None):
    if user_id not in user_data:
        user_data[user_id] = {'step': 0, 'data': {}}

    data = user_data[user_id]

    if step == 0:
        keyboard = VkKeyboard(one_time=True)
        keyboard.add_button('🐾 Пропал(а)', color=VkKeyboardColor.PRIMARY)
        keyboard.add_button('🐾 Найден(а)', color=VkKeyboardColor.POSITIVE)
        keyboard.add_line()
        keyboard.add_button('❌ Отмена', color=VkKeyboardColor.NEGATIVE)
        vk.messages.send(
            user_id=user_id,
            message="📝 Выберите тип объявления:",
            random_id=0,
            keyboard=keyboard.get_keyboard()
        )
        data['step'] = 1

    elif step == 1:
        data['data']['type'] = 'lost' if 'Пропал' in text else 'found'
        keyboard = VkKeyboard(one_time=True)
        keyboard.add_button('🐱 Кошка', color=VkKeyboardColor.PRIMARY)
        keyboard.add_button('🐶 Собака', color=VkKeyboardColor.PRIMARY)
        keyboard.add_button('🐾 Другое', color=VkKeyboardColor.PRIMARY)
        keyboard.add_line()
        keyboard.add_button('❌ Отмена', color=VkKeyboardColor.NEGATIVE)
        vk.messages.send(
            user_id=user_id,
            message="🐕 Какое это животное?",
            random_id=0,
            keyboard=keyboard.get_keyboard()
        )
        data['step'] = 2

    elif step == 2:
        clean_text = text.replace('🐱', '').replace('🐶', '').replace('🐾', '').strip()
        animal_map = {'Кошка': 'cat', 'Собака': 'dog', 'Другое': 'other'}
        data['data']['animal_type'] = animal_map.get(clean_text, 'other')
        vk.messages.send(
            user_id=user_id,
            message="📝 Введите ЗАГОЛОВОК объявления (например: Пропал рыжий кот)",
            random_id=0,
            keyboard=get_cancel_keyboard().get_keyboard()
        )
        data['step'] = 3

    elif step == 3:
        data['data']['title'] = text
        vk.messages.send(
            user_id=user_id,
            message="🐕 Введите ПОРОДУ (или 'Неизвестно')",
            random_id=0,
            keyboard=get_cancel_keyboard().get_keyboard()
        )
        data['step'] = 4

    elif step == 4:
        data['data']['breed'] = text
        vk.messages.send(
            user_id=user_id,
            message="🎨 Введите ОКРАС (например: рыжий, чёрный, белый)",
            random_id=0,
            keyboard=get_cancel_keyboard().get_keyboard()
        )
        data['step'] = 5

    elif step == 5:
        data['data']['color'] = text
        vk.messages.send(
            user_id=user_id,
            message="📝 Введите ОПИСАНИЕ (особые приметы, обстоятельства)",
            random_id=0,
            keyboard=get_cancel_keyboard().get_keyboard()
        )
        data['step'] = 6

    elif step == 6:
        data['data']['description'] = text
        keyboard = VkKeyboard(one_time=True)
        keyboard.add_button('Пропустить', color=VkKeyboardColor.SECONDARY)
        keyboard.add_line()
        keyboard.add_button('❌ Отмена', color=VkKeyboardColor.NEGATIVE)
        vk.messages.send(
            user_id=user_id,
            message="📸 Отправьте ФОТО животного (или нажмите 'Пропустить')",
            random_id=0,
            keyboard=keyboard.get_keyboard()
        )
        data['step'] = 7

    elif step == 7:
        if photo_url:
            data['data']['photo_url'] = photo_url
        elif text.lower() in ['пропустить', 'пропустить']:
            data['data']['photo_url'] = None
        else:
            keyboard = VkKeyboard(one_time=True)
            keyboard.add_button('Пропустить', color=VkKeyboardColor.SECONDARY)
            keyboard.add_line()
            keyboard.add_button('❌ Отмена', color=VkKeyboardColor.NEGATIVE)
            vk.messages.send(
                user_id=user_id,
                message="📸 Пожалуйста, отправьте фото или нажмите 'Пропустить'",
                random_id=0,
                keyboard=keyboard.get_keyboard()
            )
            return

        keyboard = VkKeyboard(one_time=True)
        for d in ['Октябрьский', 'Ленинский', 'Фрунзенский']:
            keyboard.add_button(d)
        keyboard.add_line()
        keyboard.add_button('❌ Отмена', color=VkKeyboardColor.NEGATIVE)
        vk.messages.send(
            user_id=user_id,
            message="📍 Выберите РАЙОН:",
            random_id=0,
            keyboard=keyboard.get_keyboard()
        )
        data['step'] = 8

    elif step == 8:
        data['data']['district'] = text

        try:
            response = create_ad_via_api(user_id, data['data'])
            if response.status_code == 201:
                result = response.json()
                vk.messages.send(
                    user_id=user_id,
                    message=f"✅ Объявление отправлено на модерацию!\n\nID: {result['id']}\nСтатус: На проверке\n\nВы получите уведомление после решения модератора.",
                    random_id=0,
                    keyboard=get_main_keyboard().get_keyboard()
                )
            else:
                vk.messages.send(
                    user_id=user_id,
                    message=f"❌ Ошибка при создании объявления: {response.text}",
                    random_id=0
                )
        except Exception as e:
            vk.messages.send(
                user_id=user_id,
                message=f"❌ Ошибка при создании объявления: {e}",
                random_id=0
            )

        del user_data[user_id]


def main():
    vk_session = vk_api.VkApi(token=VK_TOKEN)
    vk = vk_session.get_api()
    longpoll = VkBotLongPoll(vk_session, GROUP_ID)

    print("🐶 Бот запущен и слушает сообщения...")

    for event in longpoll.listen():
        if event.type == VkBotEventType.MESSAGE_NEW:
            msg = event.obj.message
            peer_id = msg['peer_id']
            text = msg.get('text', '')
            attachments = msg.get('attachments', [])

            photo_url = None
            if attachments:
                for attach in attachments:
                    if attach['type'] == 'photo':
                        photo_url = attach['photo']['sizes'][-1]['url']
                        break

            if text == '❌ Отмена' and peer_id in user_data:
                del user_data[peer_id]
                vk.messages.send(
                    peer_id=peer_id,
                    message='❌ Создание объявления отменено.',
                    random_id=0,
                    keyboard=get_main_keyboard().get_keyboard()
                )
                continue

            if peer_id in user_data:
                step = user_data[peer_id]['step']
                create_ad_flow(vk, peer_id, step, text, photo_url)
                continue

            if text == '📝 Создать объявление':
                create_ad_flow(vk, peer_id, 0, None)

            elif text == '🔍 Поиск по фото':
                vk.messages.send(
                    peer_id=peer_id,
                    message="📸 Отправьте фото животного, и я найду похожие объявления в базе!",
                    random_id=0
                )

            elif photo_url:
                similar_ads = search_similar_ads(photo_url)

                if similar_ads:
                    answer = "🔍 Найдены похожие объявления:\n\n"
                    for ad in similar_ads:
                        answer += f"🐾 {ad['title']}\n"
                        answer += f"   Статус: {'Пропал' if ad['type'] == 'lost' else 'Найден'}\n"
                        answer += f"   Район: {ad['district']}\n"
                        answer += f"   Ссылка: {SITE_URL}/card/{ad['id']}\n\n"
                    answer += "👉 Если это ваше животное, свяжитесь с автором через сайт!"
                else:
                    answer = "❌ Похожих объявлений не найдено.\n\n📝 Вы можете создать объявление через кнопку 'Создать объявление'"

                vk.messages.send(peer_id=peer_id, message=answer, random_id=0)

            elif text.lower() in ['логин', '/логин', 'login', '/login', '🔐 войти на сайт']:
                try:
                    resp = requests.post(
                        f'{BACKEND_URL}/api/auth/vk/generate_code/',
                        json={'vk_user_id': peer_id},
                        headers={'X-Bot-Key': BOT_API_KEY},
                        timeout=10
                    )
                    if resp.status_code == 200:
                        code = resp.json().get('code', '')
                        vk.messages.send(
                            peer_id=peer_id,
                            message=f'🔐 Ваш код для входа на сайт:\n\n{code}\n\nВведите его на сайте в поле "Код из бота". Код действует 5 минут.',
                            random_id=0
                        )
                    else:
                        vk.messages.send(peer_id=peer_id, message='Ошибка. Попробуйте позже.', random_id=0)
                except Exception as e:
                    print(f"Login code error: {e}")
                    vk.messages.send(peer_id=peer_id, message='Ошибка. Попробуйте позже.', random_id=0)

            elif text == '📋 Мои заявки':
                try:
                    resp = requests.get(
                        f'{BACKEND_API_URL}/bot/my_ads/',
                        params={'vk_user_id': peer_id},
                        headers={'X-Bot-Key': BOT_API_KEY},
                        timeout=10
                    )
                    if resp.status_code == 200:
                        ads = resp.json()
                        if ads:
                            STATUS_MAP = {
                                'pending': '🕐 На проверке',
                                'approved': '✅ Опубликовано',
                                'rejected': '❌ Отклонено',
                            }
                            TYPE_MAP = {'lost': 'Пропал', 'found': 'Найден'}
                            lines = ['📋 Ваши объявления:\n']
                            for ad in ads:
                                lines.append(
                                    f"• {ad['title']}\n"
                                    f"  {TYPE_MAP.get(ad['type'], '')} | {ad['district']}\n"
                                    f"  {STATUS_MAP.get(ad['status'], ad['status'])}\n"
                                    f"  Ссылка: {SITE_URL}/card/{ad['id']}\n"
                                )
                            answer = '\n'.join(lines)
                        else:
                            answer = '📋 У вас пока нет объявлений.\n\nСоздайте первое через кнопку «📝 Создать объявление».'
                    else:
                        answer = '❌ Не удалось загрузить заявки. Попробуйте позже.'
                except Exception as e:
                    print(f"My ads error: {e}")
                    answer = '❌ Ошибка. Попробуйте позже.'
                vk.messages.send(peer_id=peer_id, message=answer, random_id=0)

            elif text == 'ℹ️ Помощь':
                help_text = f"""🐾 Помощь

📝 Создать объявление — заполните форму, объявление отправится на модерацию

📋 Мои заявки — посмотреть список ваших объявлений и их статус

🔍 Поиск по фото — отправьте фото животного, я найду похожие объявления

🔐 Войти на сайт / логин — получите код для входа на сайт через VK

После модерации вы получите уведомление о результате

Сайт: {SITE_URL}"""

                vk.messages.send(
                    peer_id=peer_id,
                    message=help_text,
                    random_id=0
                )

            else:
                vk.messages.send(
                    peer_id=peer_id,
                    message="🐾 Привет! Я помогу найти пропавшее животное.\n\nИспользуйте кнопки ниже:",
                    random_id=0,
                    keyboard=get_main_keyboard().get_keyboard()
                )


if __name__ == "__main__":
    main()
