import { Ad, User } from "./types";

const ADS_KEY = "petfinder_ads";
const USERS_KEY = "petfinder_users";

const INITIAL_USERS: User[] = [
  { id: "u1", name: "Админ", email: "admin@pet.ru", role: "admin" },
  { id: "u2", name: "Пользователь 1", email: "user1@pet.ru", role: "user" },
];

const INITIAL_ADS: Ad[] = [
  { id: "1", type: "lost", animalType: "cat", title: "Пропала рыжая кошка Луна", breed: "Британская", color: "Рыжий", district: "Октябрьский", description: "Пропала в районе Золотых ворот. Ласковая, откликается на имя.", date: "2026-03-15", lat: 56.1280, lng: 40.4070, status: "approved", authorId: "u2", authorName: "Пользователь 1", createdAt: new Date().toISOString() },
  { id: "2", type: "found", animalType: "dog", title: "Найдена собака лабрадор", breed: "Лабрадор", color: "Золотистый", district: "Ленинский", description: "Найдена в парке у Успенского собора. Дружелюбная, без ошейника.", date: "2026-03-17", lat: 56.1261, lng: 40.4062, status: "approved", authorId: "u2", authorName: "Пользователь 1", createdAt: new Date().toISOString() },
  { id: "3", type: "lost", animalType: "dog", title: "Пропал пес Дружок", breed: "Дворняжка", color: "Коричневый", district: "Фрунзенский", description: "Убежал со двора на ул. Балакирева. Привит, есть ошейник с телефоном.", date: "2026-03-14", lat: 56.1350, lng: 40.3950, status: "approved", authorId: "u2", authorName: "Пользователь 1", createdAt: new Date().toISOString() },
  { id: "4", type: "found", animalType: "cat", title: "Найден серый котик", breed: "Шотландская", color: "Серый", district: "Октябрьский", description: "Нашли у ТЦ Октябрь, очень пугливый. Сейчас у нас дома.", date: "2026-03-16", lat: 56.1220, lng: 40.4150, status: "approved", authorId: "u2", authorName: "Пользователь 1", createdAt: new Date().toISOString() },
  { id: "5", type: "lost", animalType: "other", title: "Пропал попугай Кеша", breed: "Волнистый попугай", color: "Зеленый", district: "Ленинский", description: "Улетел из открытого окна на ул. Мира. Говорит свое имя.", date: "2026-03-13", lat: 56.1290, lng: 40.4010, status: "approved", authorId: "u2", authorName: "Пользователь 1", createdAt: new Date().toISOString() },
  { id: "6", type: "lost", animalType: "cat", title: "Пропала черная кошка Багира", breed: "Беспородная", color: "Черный", district: "Фрунзенский", description: "Пропала ночью в районе Фрунзе. Кастрирована, есть чип.", date: "2026-03-18", lat: 56.1380, lng: 40.3880, status: "approved", authorId: "u2", authorName: "Пользователь 1", createdAt: new Date().toISOString() },
  { id: "7", type: "found", animalType: "dog", title: "Найден щенок хаски", breed: "Хаски", color: "Серо-белый", district: "Октябрьский", description: "Найден у вокзала. Молодой пес, около 1 года.", date: "2026-03-19", lat: 56.1190, lng: 40.4230, status: "approved", authorId: "u2", authorName: "Пользователь 1", createdAt: new Date().toISOString() },
  { id: "8", type: "lost", animalType: "dog", title: "Пропала собака Белла", breed: "Пудель", color: "Белый", district: "Ленинский", description: "Выскочила на прогулке у Соборной площади. Носит красный ошейник.", date: "2026-03-12", lat: 56.1270, lng: 40.4080, status: "approved", authorId: "u2", authorName: "Пользователь 1", createdAt: new Date().toISOString() },
  { id: "9", type: "found", animalType: "cat", title: "Найдена кошка трехцветная", breed: "Беспородная", color: "Трехцветная", district: "Фрунзенский", description: "Пришла во двор на Суздальском проспекте, очень голодная. Стерилизована.", date: "2026-03-11", lat: 56.1420, lng: 40.3820, status: "approved", authorId: "u2", authorName: "Пользователь 1", createdAt: new Date().toISOString() },
  { id: "10", type: "lost", animalType: "other", title: "Пропал кролик Снежок", breed: "Карликовый кролик", color: "Белый", district: "Октябрьский", description: "Убежал с балкона на пр. Строителей. Очень пушистый, белый.", date: "2026-03-10", lat: 56.1170, lng: 40.4310, status: "approved", authorId: "u2", authorName: "Пользователь 1", createdAt: new Date().toISOString() },
  { id: "11", type: "lost", animalType: "cat", title: "Сбежал сфинкс", breed: "Сфинкс", color: "Розовый", district: "Ленинский", description: "Испугался шума у Дмитриевского собора. Без ошейника.", date: "2026-03-20", lat: 56.1255, lng: 40.4055, status: "pending", authorId: "u2", authorName: "Пользователь 1", createdAt: new Date().toISOString() },
  { id: "12", type: "found", animalType: "dog", title: "Найден той-терьер", breed: "Той-терьер", color: "Черно-подпалый", district: "Фрунзенский", description: "Дрожал у магазина на ул. Добросельская. Забрали домой.", date: "2026-03-20", lat: 56.1360, lng: 40.3910, status: "pending", authorId: "u2", authorName: "Пользователь 1", createdAt: new Date().toISOString() },
];

export function initDb() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(ADS_KEY)) {
    localStorage.setItem(ADS_KEY, JSON.stringify(INITIAL_ADS));
  }
}

export const db = {
  getAds: (): Ad[] => JSON.parse(localStorage.getItem(ADS_KEY) || "[]"),
  saveAds: (ads: Ad[]) => localStorage.setItem(ADS_KEY, JSON.stringify(ads)),
  getUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || "[]"),
};
