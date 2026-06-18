import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const AI_SERVER_URL = 'http://127.0.0.1:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Типы данных (должны совпадать с Django)
export interface Ad {
  id: number;
  type: 'lost' | 'found';
  animal_type: 'cat' | 'dog' | 'other';
  title: string;
  breed: string;
  color: string;
  district: 'Октябрьский' | 'Ленинский' | 'Фрунзенский';
  description: string;
  date: string;
  lat: number;
  lng: number;
  status: 'pending' | 'approved' | 'rejected';
  author: number;
  author_name: string;
  author_email?: string;
  author_vk_id?: string;
  author_vk_photo?: string;
  created_at: string;
  photo: string | null;
  photo2?: string | null;
  photo3?: string | null;
  phone?: string;
  views_count: number;
  is_favorited: boolean;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  ad_title: string;
  ad_id: number | null;
}

// Получить все объявления (только одобренные)
export async function getAds(): Promise<Ad[]> {
  const response = await api.get('/ads/');
  return response.data.filter((ad: Ad) => ad.status === 'approved');
}

// Получить одно объявление
export async function getAd(id: number): Promise<Ad> {
  const response = await api.get(`/ads/${id}/`);
  return response.data;
}

// Создать объявление (нужен токен авторизации)
export async function createAd(data: FormData, token: string): Promise<Ad> {
  const response = await api.post('/ads/', data, {
    headers: { 
      'Content-Type': 'multipart/form-data',
      Authorization: `Token ${token}` 
    },
  });
  return response.data;
}

// Поиск объявления по фотографии (AI-сервер DINOv2)
export interface PhotoSearchResult {
  found: boolean;
  match?: string;
  ad_id?: number;
  similarity: number;
  message: string;
}

export async function searchByPhoto(file: File): Promise<PhotoSearchResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${AI_SERVER_URL}/search_similar`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Сервис поиска недоступен');
  return response.json();
}

// Вход пользователя
export async function login(username: string, password: string): Promise<{ token: string; user: any }> {
  const response = await api.post('/auth/login/', { username, password });
  if (response.data.token) {
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
}

// Регистрация
export async function register(username: string, email: string, password: string): Promise<{ token: string; user: any }> {
  const response = await api.post('/auth/register/', { username, email, password, password2: password });
  if (response.data.token) {
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
}

// Выход
export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

// Получить текущего пользователя
export function getCurrentUser(): any {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Получить токен
export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}
