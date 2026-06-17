import { Link } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MapPin, Calendar, Clock, Heart, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useToggleFavorite } from "@/hooks/use-pets";
import { useAuth } from "@/hooks/use-auth";
import { Ad } from "@/lib/api";

interface PetCardProps {
  ad: Ad;
  adminMode?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const EMOJIS = {
  cat: "🐱",
  dog: "🐶",
  other: "🐾"
};

const COLORS = {
  cat: "from-blue-100 to-indigo-100 text-indigo-500",
  dog: "from-amber-100 to-orange-100 text-orange-500",
  other: "from-emerald-100 to-teal-100 text-teal-500"
};

export function PetCard({ ad, adminMode, onApprove, onReject, onDelete }: PetCardProps) {
  const isLost = ad.type === "lost";
  const badgeClass = isLost
    ? "bg-destructive/10 text-destructive border-destructive/20"
    : "bg-success/10 text-success border-success/20";
  const badgeText = isLost ? "ПРОПАЛ" : "НАЙДЕН";

  const { user } = useAuth();
  const toggleFavorite = useToggleFavorite();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    toggleFavorite.mutate(ad.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <Link href={`/card/${ad.id}`} className="relative block aspect-[4/3] w-full overflow-hidden p-6 flex flex-col items-center justify-center cursor-pointer">
        <div className={`absolute inset-0 ${ad.photo ? 'bg-black/30' : `bg-gradient-to-br ${COLORS[ad.animal_type]}`} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>

        {ad.photo ? (
          <img
            src={ad.photo}
            alt={ad.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <span className="text-8xl relative z-10 group-hover:scale-110 transition-transform duration-500">
            {EMOJIS[ad.animal_type]}
          </span>
        )}

        {/* Status Badge */}
        <div className={`absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-xs font-bold border ${badgeClass} backdrop-blur-md`}>
          {badgeText}
        </div>

        {/* Moderation badge */}
        {ad.status === "pending" && (
          <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-yellow-500/20 text-yellow-700 border border-yellow-500/30 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-md">
            <Clock className="w-3 h-3" />
            НА МОДЕРАЦИИ
          </div>
        )}

        {/* Favorite button */}
        {user && ad.status !== "pending" && (
          <button
            onClick={handleFavoriteClick}
            className={`absolute bottom-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
              ad.is_favorited
                ? 'bg-red-500 text-white'
                : 'bg-black/40 text-white hover:bg-red-500'
            }`}
          >
            <Heart className="w-4 h-4" fill={ad.is_favorited ? "currentColor" : "none"} />
          </button>
        )}

        {/* View count */}
        {ad.views_count > 0 && (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full">
            <Eye className="w-3 h-3" />
            {ad.views_count}
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/card/${ad.id}`} className="block">
            <h3 className="font-display font-bold text-lg text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {ad.title}
            </h3>
          </Link>
        </div>

        <div className="space-y-2 mt-auto pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary/60" />
            <span className="truncate">{ad.district} район</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary/60" />
            <span>{format(new Date(ad.date), "d MMMM yyyy", { locale: ru })}</span>
          </div>
        </div>

        {/* Admin Controls */}
        {adminMode && ad.status === "pending" && (
          <div className="mt-4 pt-4 border-t border-border flex gap-2">
            <button
              onClick={(e) => { e.preventDefault(); onApprove?.(ad.id); }}
              className="flex-1 py-2 bg-success/10 text-success hover:bg-success hover:text-white rounded-xl text-sm font-bold transition-colors"
            >
              Одобрить
            </button>
            <button
              onClick={(e) => { e.preventDefault(); onReject?.(ad.id); }}
              className="flex-1 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-xl text-sm font-bold transition-colors"
            >
              Отклонить
            </button>
          </div>
        )}

        {(adminMode && ad.status === "approved" || onDelete) && (
          <div className="mt-4 pt-4 border-t border-border flex gap-2">
            <button
              onClick={(e) => { e.preventDefault(); onDelete?.(ad.id); }}
              className="w-full py-2 bg-secondary text-secondary-foreground hover:bg-destructive hover:text-white rounded-xl text-sm font-bold transition-colors"
            >
              Удалить
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
