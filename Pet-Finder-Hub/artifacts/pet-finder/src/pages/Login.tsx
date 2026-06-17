import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // reg step 2
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [verifyCode, setVerifyCode] = useState("");

  const { login, user } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    setLocation("/profile");
    return null;
  }

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setRegStep(1);
    setVerifyCode("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      setLocation("/profile");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Неверный логин или пароль");
    }
    setLoading(false);
  };

  const handleRegisterRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Введите email"); return; }
    setLoading(true);
    try {
      const r = await fetch("http://127.0.0.1:8000/api/auth/register/request/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Ошибка"); setLoading(false); return; }
      setRegStep(2);
    } catch {
      setError("Ошибка соединения");
    }
    setLoading(false);
  };

  const handleRegisterVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch("http://127.0.0.1:8000/api/auth/register/verify/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode.trim() }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Неверный код"); setLoading(false); return; }
      localStorage.setItem("auth_token", data.token);
      const userWithRole = { ...data.user, role: data.user.is_staff ? "admin" : "user" };
      localStorage.setItem("user", JSON.stringify(userWithRole));
      window.location.href = "/profile";
    } catch {
      setError("Ошибка соединения");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-muted/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-[2rem] p-8 shadow-xl border border-border"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🐾</span>
          </div>
          <h1 className="text-2xl font-display font-bold">
            {isLogin ? "Вход" : regStep === 1 ? "Регистрация" : "Подтверждение email"}
          </h1>
          {!isLogin && regStep === 2 && (
            <p className="text-sm text-muted-foreground mt-2">
              Код отправлен на <span className="font-semibold text-foreground">{email}</span>
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isLogin && (
            <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Имя пользователя"
                className="w-full px-4 py-3 bg-secondary border-2 border-transparent focus:border-primary rounded-xl transition-all outline-none"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Пароль"
                className="w-full px-4 py-3 bg-secondary border-2 border-transparent focus:border-primary rounded-xl transition-all outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50">
                {loading ? "Вход..." : "Войти"}
              </button>
            </motion.form>
          )}

          {!isLogin && regStep === 1 && (
            <motion.form key="reg1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handleRegisterRequest} className="space-y-4">
              <input
                type="text"
                placeholder="Имя пользователя"
                className="w-full px-4 py-3 bg-secondary border-2 border-transparent focus:border-primary rounded-xl transition-all outline-none"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 bg-secondary border-2 border-transparent focus:border-primary rounded-xl transition-all outline-none"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Пароль"
                className="w-full px-4 py-3 bg-secondary border-2 border-transparent focus:border-primary rounded-xl transition-all outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50">
                {loading ? "Отправка..." : "Получить код на email"}
              </button>
            </motion.form>
          )}

          {!isLogin && regStep === 2 && (
            <motion.form key="reg2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              onSubmit={handleRegisterVerify} className="space-y-4">
              <input
                type="text"
                placeholder="Введите 6-значный код"
                className="w-full px-4 py-3 bg-secondary border-2 border-transparent focus:border-primary rounded-xl transition-all outline-none text-center text-2xl tracking-widest font-mono"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value)}
                maxLength={6}
                autoFocus
                required
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading || verifyCode.length !== 6}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50">
                {loading ? "Проверка..." : "Подтвердить и создать аккаунт"}
              </button>
              <button type="button" onClick={() => { setRegStep(1); setError(""); setVerifyCode(""); }}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Ввести другой email
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="text-center mt-6">
          <button onClick={switchMode} className="text-sm text-primary hover:underline">
            {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
