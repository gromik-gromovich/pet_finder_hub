import { z } from "zod";

export type Role = "user" | "admin";
export type AdType = "lost" | "found";
export type AnimalType = "cat" | "dog" | "other";
export type AdStatus = "pending" | "approved" | "rejected";
export type District = "Октябрьский" | "Ленинский" | "Фрунзенский";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Ad {
  id: string;
  type: AdType;
  animalType: AnimalType;
  title: string;
  breed: string;
  color: string;
  district: District;
  description: string;
  date: string;
  lat: number;
  lng: number;
  status: AdStatus;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export const createAdSchema = z.object({
  type: z.enum(["lost", "found"]),
  animalType: z.enum(["cat", "dog", "other"]),
  title: z.string().min(5, "Слишком короткий заголовок").max(100),
  breed: z.string().min(2, "Укажите породу или 'Без породы'"),
  color: z.string().min(2, "Укажите окрас"),
  district: z.enum(["Октябрьский", "Ленинский", "Фрунзенский"]),
  description: z.string().min(10, "Добавьте больше деталей в описание"),
  date: z.string(),
  lat: z.number(),
  lng: z.number(),
  phone: z.string().optional(),
});

export type CreateAdInput = z.infer<typeof createAdSchema>;
