from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import os
import numpy as np
from pathlib import Path
import pickle
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= НАСТРОЙКИ =============
EMBEDDINGS_CACHE_FILE = "embeddings_cache.pkl"
SIMILARITY_THRESHOLD = 0.70

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Используется устройство: {device}")
print(f"Порог схожести: {SIMILARITY_THRESHOLD}")

# ============= ЗАГРУЗКА МОДЕЛИ =============
try:
    model = torch.hub.load('facebookresearch/dinov2', 'dinov2_vits14')
    model.to(device)
    model.eval()
    print("Модель DINOv2 загружена")
except Exception as e:
    print(f"ОШИБКА загрузки модели: {e}")
    traceback.print_exc()
    model = None

# Предобработка
transform = transforms.Compose([
    transforms.Resize((224, 224), interpolation=transforms.InterpolationMode.BICUBIC),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# ============= ЗАГРУЗКА БАЗЫ (С КЭШИРОВАНИЕМ) =============
db_paths = []
db_embeddings = []


def load_or_create_embeddings():
    global db_paths, db_embeddings

    if model is None:
        print("Модель не загружена, пропускаем загрузку базы")
        return

    if os.path.exists(EMBEDDINGS_CACHE_FILE):
        print("Найден кэш эмбеддингов. Загрузка...")
        try:
            with open(EMBEDDINGS_CACHE_FILE, 'rb') as f:
                cache = pickle.load(f)
                db_paths = cache['paths']
                db_embeddings = cache['embeddings']
            print(f"Загружено из кэша: {len(db_paths)} изображений")
            return
        except Exception as e:
            print(f"Ошибка загрузки кэша: {e}")

    print("Кэш не найден или поврежден. Индексация изображений...")
    db_folder = "animal_db"

    if os.path.exists(db_folder):
        files = list(Path(db_folder).glob("*.*"))
        total = len(files)
        print(f"Найдено файлов: {total}")

        for i, img_path in enumerate(files):
            if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                try:
                    img = Image.open(img_path).convert('RGB')
                    img_tensor = transform(img).unsqueeze(0).to(device)
                    with torch.no_grad():
                        embedding = model(img_tensor).cpu().numpy().flatten()
                        embedding = embedding / np.linalg.norm(embedding)
                    db_embeddings.append(embedding)
                    db_paths.append(img_path.name)

                    if (i + 1) % 100 == 0:
                        print(f"Обработано: {i + 1}/{total}")
                except Exception as e:
                    print(f"Ошибка {img_path.name}: {e}")

        print("Сохранение кэша...")
        try:
            with open(EMBEDDINGS_CACHE_FILE, 'wb') as f:
                pickle.dump({'paths': db_paths, 'embeddings': db_embeddings}, f)
            print(f"Кэш сохранен. Всего: {len(db_paths)} изображений")
        except Exception as e:
            print(f"Ошибка сохранения кэша: {e}")
    else:
        print(f"Папка {db_folder} не найдена")


load_or_create_embeddings()


# ============= ФУНКЦИИ ПОИСКА =============
def get_embedding(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img_tensor = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        embedding = model(img_tensor).cpu().numpy().flatten()
        embedding = embedding / np.linalg.norm(embedding)
    return embedding


def find_best_match(query_embedding):
    """Находит ОДНО самое похожее изображение"""
    if len(db_embeddings) == 0:
        return None, 0.0

    similarities = [np.dot(query_embedding, db_emb) for db_emb in db_embeddings]
    best_index = np.argmax(similarities)
    best_similarity = similarities[best_index]
    # Явно преобразуем в float и округляем
    best_percent = round(float(best_similarity) * 100, 1)

    if best_similarity >= SIMILARITY_THRESHOLD:
        return db_paths[best_index], best_percent
    else:
        return None, best_percent


@app.post("/search_similar")
async def search_similar(file: UploadFile = File(...)):
    try:
        print(f"\n=== НОВЫЙ ЗАПРОС ===")
        print(f"Имя файла: {file.filename}")

        if model is None:
            print("ОШИБКА: Модель не загружена")
            return JSONResponse(
                status_code=500,
                content={"message": "Модель не загружена"}
            )

        image_bytes = await file.read()
        print(f"Размер изображения: {len(image_bytes)} байт")

        query_embedding = get_embedding(image_bytes)
        print(f"Эмбеддинг получен, размер: {len(query_embedding)}")

        best_match, percent = find_best_match(query_embedding)
        # percent уже float, но на всякий случай
        percent = float(percent)
        print(f"Лучшее совпадение: {best_match}, схожесть: {percent}%")

        if best_match:
            return {
                "found": True,
                "match": best_match,
                "similarity": percent,
                "message": f"🔍 Найдено похожее животное: {best_match} (схожесть {percent}%)"
            }
        else:
            return {
                "found": False,
                "similarity": percent,
                "message": f"❌ Животное не найдено. Максимальная схожесть: {percent}% (ниже порога {int(SIMILARITY_THRESHOLD * 100)}%)"
            }
    except Exception as e:
        print(f"ОШИБКА в search_similar:")
        print(f"Тип ошибки: {type(e).__name__}")
        print(f"Сообщение: {e}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"message": f"Ошибка сервера: {str(e)}"}
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8001)