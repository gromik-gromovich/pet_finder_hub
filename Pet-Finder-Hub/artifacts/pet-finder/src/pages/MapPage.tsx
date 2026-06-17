import { useAds } from "@/hooks/use-pets";
import { MapComponent } from "@/components/pet/MapComponent";
import { useState } from "react";

export default function MapPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const { data: ads = [], isLoading } = useAds();

  const filteredAds = filterType === "all" ? ads : ads.filter(a => a.type === filterType);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="bg-background border-b border-border p-4 shadow-sm z-10">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="font-display font-bold text-2xl flex items-center gap-2">
            Карта объявлений
          </h1>
          
          <div className="flex bg-secondary p-1 rounded-xl">
            <button 
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Все
            </button>
            <button 
              onClick={() => setFilterType("lost")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === "lost" ? "bg-destructive text-white shadow-sm" : "text-muted-foreground hover:text-destructive"}`}
            >
              Потерялись
            </button>
            <button 
              onClick={() => setFilterType("found")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === "found" ? "bg-success text-white shadow-sm" : "text-muted-foreground hover:text-success"}`}
            >
              Найдены
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <MapComponent ads={filteredAds} />
        )}
      </div>
    </div>
  );
}
