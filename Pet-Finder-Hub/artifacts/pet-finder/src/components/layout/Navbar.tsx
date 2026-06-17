import { Link, useLocation } from "wouter";
import { Search, Map as MapIcon, PlusCircle, User, LogOut, LayoutDashboard, Menu, X, MessageCircle, Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications, useMarkNotificationsRead } from "@/hooks/use-pets";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

function VkLoginModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("http://127.0.0.1:8000/api/auth/vk/verify_code/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await r.json();
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        const userWithRole = { ...data.user, role: data.user.is_staff ? "admin" : "user" };
        localStorage.setItem("user", JSON.stringify(userWithRole));
        window.location.reload();
      } else {
        setError(data.error || "Неверный код");
      }
    } catch {
      setError("Ошибка соединения");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-1">Вход через VK</h2>
        <p className="text-sm text-gray-500 mb-3">
          Нажмите кнопку — откроется бот. Там нажмите <span className="font-semibold">«🔐 Войти на сайт»</span> и введите полученный код:
        </p>
        <a
          href="https://vk.com/im?sel=-237844372&message=логин"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center bg-[#0077FF] text-white rounded-lg py-2 mb-4 font-medium hover:bg-blue-600"
        >
          🔐 Открыть бот и запросить код
        </a>
        <input
          type="text"
          placeholder="Введите 6-значный код"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          className="w-full border rounded-lg px-3 py-2 text-center text-xl tracking-widest mb-2 outline-none focus:border-blue-500"
          maxLength={6}
          autoFocus
        />
        {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading || code.length !== 6}
          className="w-full bg-[#0077FF] text-white rounded-lg py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Проверка..." : "Войти"}
        </button>
      </div>
    </div>
  );
}


const VK_BOT_URL = "https://vk.me/club237844372";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showVkModal, setShowVkModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: notifData } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const unreadCount = notifData?.unread_count ?? 0;

  const handleBellClick = () => {
    setShowNotifications(v => !v);
    if (!showNotifications && unreadCount > 0) {
      markRead.mutate();
    }
  };

  const navLinks = [
    { href: "/", label: "Главная", icon: Search },
    { href: "/map", label: "Карта", icon: MapIcon },
  ];

  return (
  <>
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <span className="text-xl">🐾</span>
          </div>
          <span className="font-display font-bold text-xl text-foreground tracking-tight hidden sm:block">
            ПитомецДома
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${location === link.href ? "text-primary" : "text-muted-foreground"}`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
          
          <Link href="/create" className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-full text-sm font-bold shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-0.5 transition-all">
            <PlusCircle className="w-4 h-4" />
            Создать объявление
          </Link>
          
          {/* Кнопка VK Бота */}
          <a 
            href={VK_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4680C2] to-[#2C5F8A] text-white rounded-full text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Бот ВК
          </a>
        </nav>


        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === "admin" && (
                <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1">
                  <LayoutDashboard className="w-4 h-4" />
                  Админ
                </Link>
              )}
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={handleBellClick}
                  className="relative p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-border z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex justify-between items-center">
                      <span className="font-bold text-sm">Уведомления</span>
                      <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {!notifData?.notifications?.length ? (
                        <p className="text-center text-muted-foreground text-sm py-6">Уведомлений нет</p>
                      ) : (
                        notifData.notifications.slice(0, 10).map(n => (
                          <div key={n.id} className={`px-4 py-3 border-b border-border/50 last:border-0 ${n.is_read ? '' : 'bg-primary/5'}`}>
                            <p className="text-sm text-foreground leading-snug">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(n.created_at), "d MMM, HH:mm", { locale: ru })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Link href="/profile" className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center overflow-hidden">
                  {user?.vk_photo
                    ? <img src={user.vk_photo} alt="avatar" className="w-full h-full object-cover" />
                    : (user?.first_name?.charAt(0) || user?.name?.charAt(0) || '?')
                  }
                </div>
                {user?.first_name || user?.name || user?.username}
              </Link>
              <button onClick={logout} className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVkModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0077FF] text-white rounded-full text-sm font-bold shadow-md hover:bg-blue-600 hover:-translate-y-0.5 transition-all"
              >
                <span className="font-bold">VK</span>
                Войти через VK
              </button>
              <Link href="/login" className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-2 px-4 py-2 rounded-full border-2 border-primary/20 hover:border-primary/50 transition-all">
                <User className="w-4 h-4" />
                Войти
              </Link>
            </div>
          )}
        </div>


        <button 
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="flex flex-col p-4 space-y-4">
              {navLinks.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl ${location === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              
              <Link 
                href="/create" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 p-3 bg-accent text-accent-foreground rounded-xl font-bold shadow-md"
              >
                <PlusCircle className="w-5 h-5" />
                Создать объявление
              </Link>
              
              <a 
                href={VK_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-[#4680C2] to-[#2C5F8A] text-white rounded-xl font-bold"
              >
                <MessageCircle className="w-5 h-5" />
                Бот ВКонтакте
              </a>

              <div className="h-px w-full bg-border my-2"></div>

              {user ? (
                <>
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 text-foreground hover:bg-secondary rounded-xl font-medium">
                    <User className="w-5 h-5 text-primary" />
                    Мой профиль
                  </Link>
                  {user.role === "admin" && (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 text-foreground hover:bg-secondary rounded-xl font-medium">
                      <LayoutDashboard className="w-5 h-5 text-primary" />
                      Модерация
                    </Link>
                  )}
                  <button 
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="flex items-center gap-3 p-3 text-destructive hover:bg-destructive/10 rounded-xl font-medium text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setShowVkModal(true); setIsMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 p-3 bg-[#0077FF] text-white rounded-xl font-bold"
                  >
                    <span className="font-bold">VK</span> Войти через VK
                  </button>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 p-3 border-2 border-primary/30 text-primary rounded-xl font-bold"
                  >
                    Войти
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    {showVkModal && <VkLoginModal onClose={() => setShowVkModal(false)} />}
  </>
  );
}