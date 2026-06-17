import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdSchema, CreateAdInput } from "@/lib/types";
import { useCreateAd } from "@/hooks/use-pets";
import { useAuth } from "@/hooks/use-auth";
import { MapComponent } from "@/components/pet/MapComponent";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { MapPin, ImagePlus, CheckCircle, X } from "lucide-react";
import { motion } from "framer-motion";

export default function CreateAd() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const createMutation = useCreateAd();
  const [mapCenter] = useState<[number, number]>([56.1280, 40.4070]);
  const [success, setSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newFiles = [...selectedFiles, ...filesArray].slice(0, 3);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      
      setSelectedFiles(newFiles);
      setPreviewUrls(newPreviews);
    }
  };

  const removePhoto = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const form = useForm<CreateAdInput>({
    resolver: zodResolver(createAdSchema),
    defaultValues: {
      type: "lost",
      animalType: "cat",
      district: "Октябрьский",
      date: new Date().toISOString().split('T')[0],
      lat: 56.1280,
      lng: 40.4070,
    }
  });

  const onSubmit = async (data: CreateAdInput) => {
    try {
      const formData = new FormData();
      formData.append('type', data.type);
      formData.append('animal_type', data.animalType);
      formData.append('title', data.title);
      formData.append('breed', data.breed);
      formData.append('color', data.color);
      formData.append('district', data.district);
      formData.append('description', data.description);
      formData.append('date', data.date);
      formData.append('lat', String(data.lat));
      formData.append('lng', String(data.lng));
      if (data.phone) formData.append('phone', data.phone);

      if (selectedFiles.length > 0) formData.append('photo', selectedFiles[0]);
      if (selectedFiles.length > 1) formData.append('photo2', selectedFiles[1]);
      if (selectedFiles.length > 2) formData.append('photo3', selectedFiles[2]);
      
      await createMutation.mutateAsync(formData);
      setSuccess(true);
      setTimeout(() => {
        setLocation("/profile");
      }, 2000);
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  if (success) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-lg text-center">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-24 h-24 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12" />
        </motion.div>
        <h2 className="text-3xl font-display font-bold mb-4">Объявление отправлено!</h2>
        <p className="text-muted-foreground">
          Оно появится в общей ленте после проверки модератором. Перенаправляем в профиль...
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-display font-bold mb-8">Создать объявление</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <h3 className="font-bold mb-4 text-lg">Основная информация</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold mb-2 block">Тип объявления</label>
              <div className="flex gap-2">
                <label className={`flex-1 flex items-center justify-center py-3 rounded-xl cursor-pointer border-2 transition-all ${form.watch("type") === "lost" ? "border-destructive bg-destructive/10 text-destructive font-bold" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                  <input type="radio" value="lost" {...form.register("type")} className="hidden" />
                  Я потерял
                </label>
                <label className={`flex-1 flex items-center justify-center py-3 rounded-xl cursor-pointer border-2 transition-all ${form.watch("type") === "found" ? "border-success bg-success/10 text-success font-bold" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                  <input type="radio" value="found" {...form.register("type")} className="hidden" />
                  Я нашел
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Кого ищем?</label>
              <div className="flex gap-2">
                {[
                  { val: "cat", label: "Кошка", icon: "🐱" },
                  { val: "dog", label: "Собака", icon: "🐶" },
                  { val: "other", label: "Другое", icon: "🐾" }
                ].map(opt => (
                  <label key={opt.val} className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl cursor-pointer border-2 transition-all ${form.watch("animalType") === opt.val ? "border-primary bg-primary/10 text-primary font-bold" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                    <input type="radio" value={opt.val} {...form.register("animalType")} className="hidden" />
                    <span className="text-xl mb-1">{opt.icon}</span>
                    <span className="text-xs">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-5">
          <h3 className="font-bold mb-2 text-lg">Детали</h3>
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Краткий заголовок</label>
            <input 
              {...form.register("title")} 
              placeholder="Например: Пропала рыжая кошка в ошейнике"
              className="w-full px-4 py-3 bg-background border-2 border-border focus:border-primary rounded-xl transition-colors outline-none"
            />
            {form.formState.errors.title && <p className="text-destructive text-xs mt-1">{form.formState.errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-semibold mb-2 block">Порода</label>
              <input 
                {...form.register("breed")} 
                placeholder="Или 'Без породы'"
                className="w-full px-4 py-3 bg-background border-2 border-border focus:border-primary rounded-xl transition-colors outline-none"
              />
              {form.formState.errors.breed && <p className="text-destructive text-xs mt-1">{form.formState.errors.breed.message}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Окрас</label>
              <input 
                {...form.register("color")} 
                placeholder="Черный, рыжий, пятнистый..."
                className="w-full px-4 py-3 bg-background border-2 border-border focus:border-primary rounded-xl transition-colors outline-none"
              />
              {form.formState.errors.color && <p className="text-destructive text-xs mt-1">{form.formState.errors.color.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Подробное описание</label>
            <textarea
              {...form.register("description")}
              rows={4}
              placeholder="Особые приметы, обстоятельства пропажи/находки, характер..."
              className="w-full px-4 py-3 bg-background border-2 border-border focus:border-primary rounded-xl transition-colors outline-none resize-none"
            />
            {form.formState.errors.description && <p className="text-destructive text-xs mt-1">{form.formState.errors.description.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Телефон для связи <span className="text-muted-foreground font-normal">(необязательно)</span></label>
            <input
              {...form.register("phone")}
              type="tel"
              placeholder="+7 (___) ___-__-__"
              className="w-full px-4 py-3 bg-background border-2 border-border focus:border-primary rounded-xl transition-colors outline-none"
            />
            <p className="text-xs text-muted-foreground mt-1">Будет показан только зарегистрированным пользователям при отклике</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <h3 className="font-bold mb-4 text-lg">Фотографии (до 3 шт)</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative w-32 h-32 flex-shrink-0">
                <img src={url} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {selectedFiles.length < 3 && (
              <label className="w-32 h-32 flex-shrink-0 bg-secondary border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <ImagePlus className="w-6 h-6 mb-2" />
                <span className="text-xs font-semibold">Добавить</span>
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Загрузите до 3 фотографий животного
          </p>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <h3 className="font-bold mb-4 text-lg">Где это произошло?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="text-sm font-semibold mb-2 block">Район</label>
              <select
                {...form.register("district")}
                className="w-full px-4 py-3 bg-background border-2 border-border focus:border-primary rounded-xl transition-colors outline-none appearance-none"
              >
                <option value="Октябрьский">Октябрьский</option>
                <option value="Ленинский">Ленинский</option>
                <option value="Фрунзенский">Фрунзенский</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Дата</label>
              <input 
                type="date"
                {...form.register("date")}
                className="w-full px-4 py-3 bg-background border-2 border-border focus:border-primary rounded-xl transition-colors outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Отметьте точку на карте (кликните)
            </label>
            <div className="h-[300px] rounded-xl overflow-hidden border-2 border-border">
              <MapComponent 
                ads={[]} 
                center={mapCenter}
                interactive={true}
                selectedLocation={[form.watch("lat"), form.watch("lng")]}
                onLocationSelect={(lat, lng) => {
                  form.setValue("lat", lat);
                  form.setValue("lng", lng);
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Выбранные координаты: {form.watch("lat")}, {form.watch("lng")}
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={createMutation.isPending}
          className="w-full py-4 bg-accent text-white rounded-2xl font-bold text-lg shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {createMutation.isPending ? "Отправка..." : "Опубликовать объявление"}
        </button>

      </form>
    </div>
  );
}