import { useAuth } from "@/hooks/use-auth";
import { usePendingAds, useUpdateAdStatus } from "@/hooks/use-pets";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PetCard } from "@/components/pet/PetCard";
import { ShieldCheck, CheckCircle, Users, BarChart3, ClipboardList, Eye, Heart, UserX, UserCheck } from "lucide-react";
import { getToken } from "@/lib/api";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const API = "http://127.0.0.1:8000";

function useAdminUsers() {
  const token = getToken();
  return useQuery({
    queryKey: ["admin-users"],
    enabled: !!token,
    queryFn: async () => {
      const r = await fetch(`${API}/api/admin/users/`, { headers: { Authorization: `Token ${token}` } });
      if (!r.ok) throw new Error("Ошибка");
      return r.json() as Promise<any[]>;
    },
  });
}

function useToggleUserActive() {
  const queryClient = useQueryClient();
  const token = getToken();
  return useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/api/admin/users/${id}/`, {
        method: "PATCH",
        headers: { Authorization: `Token ${token}` },
      });
      if (!r.ok) throw new Error("Ошибка");
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

function useAnalytics() {
  const token = getToken();
  return useQuery({
    queryKey: ["admin-analytics"],
    enabled: !!token,
    queryFn: async () => {
      const r = await fetch(`${API}/api/admin/analytics/`, { headers: { Authorization: `Token ${token}` } });
      if (!r.ok) throw new Error("Ошибка");
      return r.json() as Promise<any>;
    },
  });
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-28 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 bg-secondary rounded-full h-5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold w-6 text-right">{value}</span>
    </div>
  );
}

type Tab = "moderation" | "users" | "analytics";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("moderation");

  const { data: pendingAds = [], isLoading: adsLoading } = usePendingAds();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const updateMutation = useUpdateAdStatus();
  const toggleActive = useToggleUserActive();

  useEffect(() => {
    if (!user || user.role !== "admin") setLocation("/");
  }, [user, setLocation]);

  if (!user || user.role !== "admin") return null;

  const tabs = [
    { id: "moderation" as Tab, label: "Модерация", icon: ClipboardList, badge: pendingAds.length },
    { id: "users" as Tab, label: "Пользователи", icon: Users, badge: 0 },
    { id: "analytics" as Tab, label: "Аналитика", icon: BarChart3, badge: 0 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Панель администратора</h1>
          <p className="text-muted-foreground">Управление системой ПитомецДома</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-colors relative ${
              tab === t.id ? "text-primary border-b-2 border-primary -mb-px" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.badge > 0 && (
              <span className="bg-destructive/10 text-destructive text-xs px-1.5 py-0.5 rounded-full font-bold">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Moderation Tab */}
      {tab === "moderation" && (
        <>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            Ожидают проверки
            <span className="bg-destructive/10 text-destructive text-sm px-2 py-0.5 rounded-full">{pendingAds.length}</span>
          </h2>
          {adsLoading ? (
            <div className="text-center py-20 text-muted-foreground">Загрузка...</div>
          ) : pendingAds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {pendingAds.map(ad => (
                <PetCard
                  key={ad.id}
                  ad={ad}
                  adminMode={true}
                  onApprove={(id) => updateMutation.mutate({ id: Number(id), status: "approved" })}
                  onReject={(id) => updateMutation.mutate({ id: Number(id), status: "rejected" })}
                />
              ))}
            </div>
          ) : (
            <div className="bg-success/5 rounded-3xl py-16 text-center border border-success/20">
              <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-success-foreground mb-2">Все объявления проверены!</h3>
              <p className="text-success/80">Новых заявок на модерацию нет.</p>
            </div>
          )}
        </>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <>
          <h2 className="text-xl font-bold mb-6">Пользователи ({users.length})</h2>
          {usersLoading ? (
            <div className="text-center py-20 text-muted-foreground">Загрузка...</div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Пользователь</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Email</th>
                    <th className="text-center px-4 py-3 font-bold text-muted-foreground">VK</th>
                    <th className="text-center px-4 py-3 font-bold text-muted-foreground">Объявлений</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Дата регистрации</th>
                    <th className="text-center px-4 py-3 font-bold text-muted-foreground">Статус</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className={`border-b border-border/50 last:border-0 ${!u.is_active ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {u.vk_photo ? (
                            <img src={u.vk_photo} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                              {(u.first_name || u.username || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{u.first_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}</p>
                            <p className="text-xs text-muted-foreground">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {u.vk_id ? <span className="bg-[#0077FF]/10 text-[#0077FF] text-xs font-bold px-2 py-0.5 rounded-full">VK</span> : "—"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">{u.ads_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(u.date_joined), "d MMM yyyy", { locale: ru })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.is_staff ? (
                          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">Админ</span>
                        ) : u.is_active ? (
                          <span className="bg-success/10 text-success text-xs font-bold px-2 py-0.5 rounded-full">Активен</span>
                        ) : (
                          <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-0.5 rounded-full">Заблокирован</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!u.is_staff && (
                          <button
                            onClick={() => toggleActive.mutate(u.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.is_active
                                ? "text-destructive hover:bg-destructive/10"
                                : "text-success hover:bg-success/10"
                            }`}
                            title={u.is_active ? "Заблокировать" : "Разблокировать"}
                          >
                            {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Analytics Tab */}
      {tab === "analytics" && (
        <>
          <h2 className="text-xl font-bold mb-6">Аналитика</h2>
          {analyticsLoading ? (
            <div className="text-center py-20 text-muted-foreground">Загрузка...</div>
          ) : analytics && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Объявлений", value: analytics.total_ads, icon: ClipboardList, color: "text-primary bg-primary/10" },
                  { label: "Пользователей", value: analytics.total_users, icon: Users, color: "text-blue-500 bg-blue-50" },
                  { label: "Просмотров", value: analytics.total_views, icon: Eye, color: "text-violet-500 bg-violet-50" },
                  { label: "В избранном", value: analytics.total_favorites, icon: Heart, color: "text-red-500 bg-red-50" },
                ].map(card => (
                  <div key={card.label} className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                      <card.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-3xl font-display font-bold">{card.value}</p>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* By status */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold mb-4">По статусу</h3>
                  <div className="space-y-3">
                    <Bar label="На проверке" value={analytics.ads_by_status.pending} max={analytics.total_ads} color="bg-yellow-400" />
                    <Bar label="Опубликовано" value={analytics.ads_by_status.approved} max={analytics.total_ads} color="bg-green-500" />
                    <Bar label="Отклонено" value={analytics.ads_by_status.rejected} max={analytics.total_ads} color="bg-red-400" />
                  </div>
                </div>

                {/* By type */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold mb-4">Пропал / Найден</h3>
                  <div className="space-y-3">
                    <Bar label="Пропал" value={analytics.ads_by_type.lost} max={analytics.total_ads} color="bg-destructive" />
                    <Bar label="Найден" value={analytics.ads_by_type.found} max={analytics.total_ads} color="bg-success" />
                  </div>
                </div>

                {/* By animal */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold mb-4">По виду животного</h3>
                  <div className="space-y-3">
                    <Bar label="🐱 Кошки" value={analytics.ads_by_animal.cat} max={analytics.total_ads} color="bg-indigo-400" />
                    <Bar label="🐶 Собаки" value={analytics.ads_by_animal.dog} max={analytics.total_ads} color="bg-orange-400" />
                    <Bar label="🐾 Другие" value={analytics.ads_by_animal.other} max={analytics.total_ads} color="bg-teal-400" />
                  </div>
                </div>

                {/* By district */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold mb-4">По районам</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.ads_by_district).map(([district, count]: [string, any]) => (
                      <Bar key={district} label={district} value={count} max={analytics.total_ads} color="bg-primary" />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
