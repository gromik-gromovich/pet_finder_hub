import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUser, login as apiLogin, register as apiRegister, logout as apiLogout } from "@/lib/api";

interface AuthContextType {
  user: any | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const login = async (username: string, password: string) => {
  const data = await apiLogin(username, password);
  const userWithRole = {
    ...data.user,
    role: data.user.is_staff ? "admin" : "user"
  };
  setUser(userWithRole);
  localStorage.setItem("user", JSON.stringify(userWithRole));
};

  const register = async (username: string, email: string, password: string) => {
    const data = await apiRegister(username, email, password);
    setUser(data.user);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}