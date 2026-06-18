import { useParams, Link } from "wouter";
import { useAd, useToggleFavorite, useRecordView } from "@/hooks/use-pets";
import { useAuth } from "@/hooks/use-auth";
import { MapComponent } from "@/components/pet/MapComponent";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowLeft, MapPin, Calendar, Info, AlertCircle, Share2, User, Phone, Mail, ChevronLeft, ChevronRight, Heart, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EMOJIS = {
  cat: "🐱",
  dog: "🐶",
  other: "🐾"
};

const COLORS = {
  cat: "from-blue-200 to-indigo-200",
  dog: "from-amber-200 to-orange-200",
  other: "from-emerald-200 to-teal-200"
};

export default function PetDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: ad, isLoading, error } = useAd(Number(id));
  const { user } = useAuth();
  const [showContact, setShowContact] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const toggleFavorite = useToggleFavorite();
  const recordView = useRecordView();

  useEffect(() => {
    if (id) recordView.mutate(Number(id));
  }, [id]);

  useEffect(() => {
    if (ad) setIsFavorited(ad.is_favorited);
  }, [ad?.is_favorited]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: ad?.title || "Объявление",
        text: `${ad?.type === 'lost' ? 'Потерялся' : 'Найден'} питомец: ${ad?.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Ссылка скопирована в буфер обмена');
    }
  };

  if (isLoading) return (
    <div className="container mx-auto px-4 py-8 flex justify-center mt-20">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !ad) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold text-destructive mb-2">Объявление не найдено</h2>
      <Link href="/" className="text-primary hover:underline">Вернуться на главную</Link>
    </div>
  );

  const isLost = ad.type === "lost";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" /> Назад к списку
      </Link>

      <div className="bg-card rounded-[2rem] overflow-hidden shadow-lg border border-border/50">
        <div className="flex flex-col md:flex-row">
          
          {/* Image/Carousel Area */}
          {(() => {
            const photos = [ad.photo, ad.photo2, ad.photo3].filter(Boolean) as string[];
            const hasPhotos = photos.length > 0;
            return (
              <div className={`md:w-2/5 aspect-square md:aspect-auto ${hasPhotos ? 'bg-black' : `bg-gradient-to-br ${COLORS[ad.animal_type]}`} flex flex-col items-center justify-center relative overflow-hidden rounded-l-[2rem]`}>
                <div className={`absolute top-6 left-6 z-10 px-4 py-1.5 rounded-full text-sm font-bold shadow-md ${isLost ? 'bg-destructive text-white' : 'bg-success text-white'}`}>
                  {isLost ? "ПРОПАЛ" : "НАЙДЕН"}
                </div>

                {hasPhotos ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={photoIndex}
                        src={photos[photoIndex]}
                        alt={ad.title}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </AnimatePresence>

                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                          {photos.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setPhotoIndex(i)}
                              className={`w-2 h-2 rounded-full transition-all ${i === photoIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-48 h-48 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl border-4 border-white/50"
                  >
                    <span className="text-8xl drop-shadow-sm">{EMOJIS[ad.animal_type]}</span>
                  </motion.div>
                )}
              </div>
            );
          })()}

          {/* Details Area */}
          <div className="md:w-3/5 p-8 md:p-10 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight">
                {ad.title}
              </h1>
            </div>

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg text-sm font-medium text-secondary-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {format(new Date(ad.date), "d MMMM yyyy", { locale: ru })}
              </div>
              <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg text-sm font-medium text-secondary-foreground">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {ad.district} район
              </div>
              <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg text-sm font-medium text-secondary-foreground">
                <Info className="w-4 h-4 text-muted-foreground" />
                № {ad.id}
              </div>
              {ad.views_count > 0 && (
                <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg text-sm font-medium text-secondary-foreground">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  {ad.views_count} просмотр{ad.views_count === 1 ? '' : ad.views_count < 5 ? 'а' : 'ов'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Порода</p>
                <p className="font-bold text-foreground">{ad.breed}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Окрас</p>
                <p className="font-bold text-foreground">{ad.color}</p>
              </div>
            </div>

            <div className="mb-8 flex-grow">
              <p className="text-sm text-muted-foreground mb-2">Описание</p>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap bg-secondary/30 p-4 rounded-2xl">
                {ad.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-auto">
              {!user ? (
                <div className="lg:col-span-3 bg-secondary rounded-2xl p-4 flex items-center gap-4 text-sm">
                  <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center flex-shrink-0 text-muted-foreground">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-muted-foreground">
                    Войдите, чтобы увидеть контакты автора и откликнуться на объявление.
                  </p>
                </div>
              ) : showContact ? (
                <div className="sm:col-span-2 lg:col-span-3 bg-primary/10 rounded-2xl p-4 border border-primary/20 min-w-0">
                  <p className="text-xs text-muted-foreground mb-3">Автор объявления</p>
                  <div className="flex items-center gap-3 mb-4">
                    {ad.author_vk_photo ? (
                      <img src={ad.author_vk_photo} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-[#0077FF]/30" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-foreground">{ad.author_name}</p>
                      {ad.author_vk_id && (
                        <p className="text-xs text-muted-foreground">VK профиль</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {ad.phone && (
                      <a
                        href={`tel:${ad.phone}`}
                        className="flex items-center gap-3 w-full px-4 py-2.5 bg-secondary rounded-xl font-bold text-sm hover:bg-secondary/70 transition-colors min-w-0"
                      >
                        <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="truncate">{ad.phone}</span>
                      </a>
                    )}
                    {ad.author_email && (
                      <a
                        href={`mailto:${ad.author_email}`}
                        className="flex items-center gap-3 w-full px-4 py-2.5 bg-secondary rounded-xl font-bold text-sm hover:bg-secondary/70 transition-colors min-w-0"
                      >
                        <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="truncate">{ad.author_email}</span>
                      </a>
                    )}
                    {ad.author_vk_id && (
                      <div className="flex gap-2">
                        <a
                          href={`https://vk.com/im?sel=${ad.author_vk_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0077FF] text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors"
                        >
                          <span className="font-bold">VK</span>
                          Написать сообщение
                        </a>
                        <a
                          href={`https://vk.com/id${ad.author_vk_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 border-2 border-[#0077FF]/30 text-[#0077FF] rounded-xl font-bold text-sm hover:border-[#0077FF] transition-colors"
                        >
                          Профиль
                        </a>
                      </div>
                    )}
                    {!ad.phone && !ad.author_email && !ad.author_vk_id && (
                      <p className="text-sm text-muted-foreground">Контакты не указаны</p>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowContact(true)}
                  className="min-h-[74px] px-8 py-4 bg-accent text-white rounded-2xl font-bold text-lg shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-1 transition-all cursor-pointer"
                >
                  Откликнуться
                </button>
              )}
              
              {user && (
                <button
                  onClick={() => {
                    setIsFavorited(v => !v);
                    toggleFavorite.mutate(ad.id);
                  }}
                  className={`min-h-[74px] px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isFavorited
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  <Heart className="w-5 h-5" fill={isFavorited ? "currentColor" : "none"} strokeWidth={2} />
                  {isFavorited ? "В избранном" : "В избранное"}
                </button>
              )}
              <button
                onClick={handleShare}
                className="min-h-[74px] px-6 py-4 bg-secondary text-foreground rounded-2xl font-bold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-5 h-5" />
                Поделиться
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-8 bg-card rounded-[2rem] p-6 shadow-sm border border-border">
        <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
          <MapPin className="text-primary" />
          Примерное местоположение
        </h3>
        <div className="h-[300px] rounded-2xl overflow-hidden">
          <MapComponent 
            ads={[ad]} 
            center={[ad.lat, ad.lng]} 
            zoom={15} 
            interactive={false}
            disablePopup={true}
          />
        </div>
      </div>
    </div>
  );
}
