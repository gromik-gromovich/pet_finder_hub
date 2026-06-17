import { useState } from "react";
import { useLocation } from "wouter";
import { useAds } from "@/hooks/use-pets";
import { useAuth } from "@/hooks/use-auth";
import { PetCard } from "@/components/pet/PetCard";
import { PhotoSearchModal } from "@/components/pet/PhotoSearchModal";
import { Search, Filter, Camera } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [filters, setFilters] = useState({
    type: "all",
    animalType: "all",
    district: "all",
    search: ""
  });
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isPhotoSearchOpen, setIsPhotoSearchOpen] = useState(false);

  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handlePhotoSearchClick = () => {
    if (!user) {
      setLocation("/login");
      return;
    }
    setIsPhotoSearchOpen(true);
  };

  const { data: ads = [], isLoading } = useAds(filters);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8 md:mb-12 text-center max-w-2xl mx-auto pt-4 md:pt-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-display font-bold text-foreground mb-3 md:mb-4"
        >
          Поможем <span className="text-primary">питомцам</span><br/> вернуться домой
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base md:text-lg text-muted-foreground px-2"
        >
          Единая база потерянных и найденных животных. Если вы потеряли друга или нашли чьего-то питомца — разместите объявление здесь.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <button
            onClick={handlePhotoSearchClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
          >
            <Camera className="w-5 h-5" />
            Найти по фото
          </button>
        </motion.div>
      </div>

      {isPhotoSearchOpen && <PhotoSearchModal onClose={() => setIsPhotoSearchOpen(false)} />}

      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-card border border-border rounded-xl font-bold shadow-sm"
        >
          <Filter className="w-5 h-5 text-primary" />
          {isFiltersOpen ? "Скрыть фильтры" : "Показать фильтры"}
          <span className="text-xs text-muted-foreground">
            ({Object.values(filters).filter(v => v !== "all" && v !== "").length})
          </span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        
        {/* Sidebar Filters */}
        <div className={`
          w-full lg:w-72 flex-shrink-0 space-y-6 bg-card p-6 rounded-3xl border border-border shadow-sm
          ${isFiltersOpen ? 'block' : 'hidden lg:block'}
        `}>
          <div className="flex items-center gap-2 font-display font-bold text-lg border-b border-border pb-4">
            <Filter className="w-5 h-5 text-primary" />
            Фильтры
          </div>

          <div className="space-y-5">
            {/* Search */}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Поиск</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Порода, окрас..." 
                  className="w-full pl-9 pr-4 py-2.5 bg-secondary border-transparent focus:bg-background border focus:border-primary rounded-xl text-sm transition-all outline-none"
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Статус</label>
              <select 
                className="w-full p-2.5 bg-secondary border-transparent focus:bg-background border focus:border-primary rounded-xl text-sm transition-all outline-none appearance-none"
                value={filters.type}
                onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
              >
                <option value="all">Все объявления</option>
                <option value="lost">Потерялся</option>
                <option value="found">Найден</option>
              </select>
            </div>

            {/* Animal Type */}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Вид животного</label>
              <div className="flex gap-2">
                {[
                  { id: "all", label: "Все" },
                  { id: "cat", label: "Кошки 🐱" },
                  { id: "dog", label: "Собаки 🐶" },
                  { id: "other", label: "Другие 🐾" }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setFilters(f => ({ ...f, animalType: type.id }))}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      filters.animalType === type.id 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {type.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* District */}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Район</label>
              <select 
                className="w-full p-2.5 bg-secondary border-transparent focus:bg-background border focus:border-primary rounded-xl text-sm transition-all outline-none appearance-none"
                value={filters.district}
                onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}
              >
                <option value="all">Все районы</option>
                <option value="Октябрьский">Октябрьский</option>
                <option value="Ленинский">Ленинский</option>
                <option value="Фрунзенский">Фрунзенский</option>
              </select>
            </div>
            
            {/* Reset */}
            <button 
              onClick={() => setFilters({ type: "all", animalType: "all", district: "all", search: "" })}
              className="w-full py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>

        {/* Main Feed */}
        <div className="flex-1 w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-card rounded-2xl md:rounded-3xl h-[320px] md:h-[340px] animate-pulse">
                  <div className="h-[180px] md:h-[200px] bg-secondary rounded-t-2xl md:rounded-t-3xl"></div>
                  <div className="p-4 md:p-5 space-y-3">
                    <div className="h-5 bg-secondary rounded w-3/4"></div>
                    <div className="h-4 bg-secondary rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : ads.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {ads.map(ad => (
                <PetCard key={ad.id} ad={ad} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center bg-card rounded-2xl md:rounded-3xl border border-border border-dashed">
              <span className="text-5xl md:text-6xl mb-3 md:mb-4 opacity-50">🔍</span>
              <h3 className="text-lg md:text-xl font-bold mb-2">Ничего не найдено</h3>
              <p className="text-muted-foreground text-sm md:text-base max-w-sm px-4">
                Попробуйте изменить параметры поиска или сбросить фильтры.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}