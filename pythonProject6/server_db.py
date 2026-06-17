from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import os
import numpy as np
import traceback
import requests
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

SIMILARITY_THRESHOLD = 0.70
BACKEND_URL = os.getenv('BACKEND_URL', 'http://backend:8000')
BACKEND_API_URL = f"{BACKEND_URL}/api"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

try:
    import torch.hub as _hub
    _hub._validate_not_a_forked_repo = lambda *a, **kw: None
    model = torch.hub.load('facebookresearch/dinov2', 'dinov2_vits14', trust_repo=True)
    model.to(device)
    model.eval()
    print("DINOv2 model loaded")
except Exception as e:
    print(f"Model load error: {e}")
    traceback.print_exc()
    model = None

transform = transforms.Compose([
    transforms.Resize((224, 224), interpolation=transforms.InterpolationMode.BICUBIC),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

db_embeddings = []
db_ad_ids = []
db_ad_titles = []


def load_embeddings_from_api():
    global db_embeddings, db_ad_ids, db_ad_titles
    db_embeddings = []
    db_ad_ids = []
    db_ad_titles = []

    resp = None
    for attempt in range(12):
        try:
            resp = requests.get(f'{BACKEND_API_URL}/ads/?status=approved', timeout=10)
            if resp.status_code == 200:
                break
        except Exception:
            pass
        print(f"Backend not ready, retry {attempt + 1}/12...")
        time.sleep(5)

    if resp is None or resp.status_code != 200:
        print("Backend unavailable, skipping embedding load")
        return

    ads_data = resp.json()
    if isinstance(ads_data, dict):
        ads_data = ads_data.get('results', [])

    count = 0
    for ad in ads_data:
        photos = [ad.get('photo'), ad.get('photo2'), ad.get('photo3')]
        photos = [p for p in photos if p]
        for photo_path in photos:
            photo_url = photo_path if photo_path.startswith('http') else f"{BACKEND_URL}{photo_path}"
            try:
                r = requests.get(photo_url, timeout=10)
                if r.status_code != 200:
                    continue
                img = Image.open(io.BytesIO(r.content)).convert('RGB')
                img_tensor = transform(img).unsqueeze(0).to(device)
                with torch.no_grad():
                    emb = model(img_tensor).cpu().numpy().flatten()
                    emb = emb / np.linalg.norm(emb)
                db_embeddings.append(emb)
                db_ad_ids.append(ad['id'])
                db_ad_titles.append(ad['title'])
                count += 1
            except Exception as e:
                print(f"Error processing ad {ad.get('id')} photo {photo_path}: {e}")

    print(f"Loaded {count} embeddings from {len(ads_data)} approved ads")


def get_embedding(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img_tensor = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        emb = model(img_tensor).cpu().numpy().flatten()
        emb = emb / np.linalg.norm(emb)
    return emb


def find_best_match(query_embedding):
    if not db_embeddings:
        return None, None, 0.0
    similarities = [float(np.dot(query_embedding, e)) for e in db_embeddings]
    best_idx = int(np.argmax(similarities))
    best_sim = similarities[best_idx]
    percent = round(best_sim * 100, 1)
    if best_sim >= SIMILARITY_THRESHOLD:
        return db_ad_ids[best_idx], db_ad_titles[best_idx], percent
    return None, None, percent


load_embeddings_from_api()


@app.post("/search_similar")
async def search_similar(file: UploadFile = File(...)):
    try:
        if model is None:
            return JSONResponse(status_code=500, content={"message": "Модель не загружена"})
        image_bytes = await file.read()
        query_emb = get_embedding(image_bytes)
        ad_id, ad_title, percent = find_best_match(query_emb)
        if ad_id:
            return {
                "found": True,
                "match": ad_title,
                "ad_id": ad_id,
                "similarity": percent,
                "message": f"Найдено: {ad_title} ({percent}%)"
            }
        return {
            "found": False,
            "similarity": percent,
            "message": f"Не найдено (макс. схожесть: {percent}%)"
        }
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"message": str(e)})


@app.post("/reload_embeddings")
async def reload_embeddings():
    load_embeddings_from_api()
    return {"loaded": len(db_embeddings)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
