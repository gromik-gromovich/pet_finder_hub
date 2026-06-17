import { useAuth } from "@/hooks/use-auth";
import { useMyAds, useDeleteAd, useFavorites, useNotifications, useMarkNotificationsRead } from "@/hooks/use-pets";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { PetCard } from "@/components/pet/PetCard";
import { User, PlusCircle, Heart, Bell, CheckCheck } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Tab = "ads" | "favorites" | "notifications";

const NOTIF_ICONS: Record<string, string> = {
  approved: "✅",
  rejected: "❌",
  found_match: "🔍",
};

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("ads");

  const { data: ads = [], isLoading: adsLoading } = useMyAds();
  const { data: favorites = [], isLoading: favsLoading } = useFavorites();
  const { data: notifData, isLoading: notifsLoading } = useNotifications();
  const deleteMutation = useDeleteAd();
  const markRead = useMarkNotificationsRead();

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user, setLocation]);

  useEffect(() => {
    if (activeTab === "notifications" && (notifData?.unread_count ?? 0) > 0) {
      markRead.mutate();
    }
  }, [activeTab]);

  if (!user) return null;

  const displayName = user.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : (user.name || user.username || '?');
  const avatarLetter = displayName.charAt(0).toUpperCase() || '?';

  const tabs = [
    { id: "ads" as Tab, label: "Мои объявления", icon: User, count: ads.length },
    { id: "favorites" as Tab, label: "Избранное", icon: Heart, count: favorites.length },
    { id: "notifications" as Tab, label: "Уведомления", icon: Bell, count: notifData?.unread_count ?? 0 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">

      {/* Profile Header */}
      <div className="bg-card rounded-[2rem] p-8 border border-border shadow-sm flex flex-col md:flex-row items-center gap-6 mb-8">
        <div className="relative flex-shrink-0">
          {user?.vk_photo ? (
            <img
              src={user.vk_photo}
              alt="VK avatar"
              className="w-24 h-24 rounded-full border-4 border-[#0077FF]/30 object-cover"
            />
          ) : (
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center text-4xl font-bold border-4 border-primary/20">
              {avatarLetter}
            </div>
          )}
          {user?.vk_id && (
            <span className="absolute -bottom-1 -right-1 bg-[#0077FF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">VK</span>
          )}
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-display font-bold">{displayName}</h1>
          {user?.vk_id ? (
            <a
              href={`https://vk.com/id${user.vk_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0077FF] hover:underline text-sm"
            >
              vk.com/id{user.vk_id}
            </a>
          ) : (
            <p className="text-muted-foreground">{user.email}</p>
          )}
          <div className="mt-2 inline-flex px-3 py-1 bg-secondary text-xs font-bold rounded-full">
            Роль: {user.role === "admin" ? "Администратор" : "Пользователь"}
          </div>
        </div>
        <div>
          <button
            onClick={() => { logout(); setLocation("/"); }}
            className="px-6 py-2 border-2 border-destructive/20 text-destructive hover:bg-destructive hover:text-white rounded-full font-bold transition-colors"
          >
            Выйти из аккаунта
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-colors relative ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : tab.id === "notifications"
                    ? 'bg-red-100 text-red-600'
                    : 'bg-secondary text-secondary-foreground'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: My Ads */}
      {activeTab === "ads" && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-display font-bold">Мои объявления</h2>
            <Link href="/create" className="flex items-center gap-2 text-sm font-bold text-accent hover:text-accent/80 transition-colors">
              <PlusCircle className="w-5 h-5" /> Создать новое
            </Link>
          </div>
          {adsLoading ? (
            <div className="text-center py-20 text-muted-foreground">Загрузка...</div>
          ) : ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {ads.map(ad => (
                <PetCard
                  key={ad.id}
                  ad={ad}
                  onDelete={(id) => {
                    if (confirm("Вы уверены, что хотите удалить объявление?")) {
                      deleteMutation.mutate(id);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-secondary/50 rounded-3xl py-16 text-center border border-border border-dashed">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">У вас пока нет объявлений</h3>
              <p className="text-muted-foreground mb-6">Создайте первое объявление, если потеряли или нашли питомца.</p>
              <Link href="/create" className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90">
                Создать объявление
              </Link>
            </div>
          )}
        </>
      )}

      {/* Tab: Favorites */}
      {activeTab === "favorites" && (
        <>
          <h2 className="text-2xl font-display font-bold mb-6">Избранное</h2>
          {favsLoading ? (
            <div className="text-center py-20 text-muted-foreground">Загрузка...</div>
          ) : favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {favorites.map(ad => (
                <PetCard key={ad.id} ad={ad} />
              ))}
            </div>
          ) : (
            <div className="bg-secondary/50 rounded-3xl py-16 text-center border border-border border-dashed">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">Нет избранных объявлений</h3>
              <p className="text-muted-foreground">Нажмите ❤️ на карточке объявления, чтобы добавить в избранное.</p>
            </div>
          )}
        </>
      )}

      {/* Tab: Notifications */}
      {activeTab === "notifications" && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-display font-bold">Уведомления</h2>
            {(notifData?.notifications?.length ?? 0) > 0 && (
              <button
                onClick={() => markRead.mutate()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Отметить все прочитанными
              </button>
            )}
          </div>
          {notifsLoading ? (
            <div className="text-center py-20 text-muted-foreground">Загрузка...</div>
          ) : (notifData?.notifications?.length ?? 0) > 0 ? (
            <div className="flex flex-col gap-3">
              {notifData!.notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-5 rounded-2xl border transition-colors ${
                    n.is_read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5">{NOTIF_ICONS[n.type] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground leading-snug">{n.message}</p>
                    {n.ad_id && (
                      <Link href={`/card/${n.ad_id}`} className="text-primary text-sm hover:underline mt-1 block">
                        Открыть объявление →
                      </Link>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {format(new Date(n.created_at), "d MMM, HH:mm", { locale: ru })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-secondary/50 rounded-3xl py-16 text-center border border-border border-dashed">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">Нет уведомлений</h3>
              <p className="text-muted-foreground">Здесь появятся уведомления о статусе ваших объявлений.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
