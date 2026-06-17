import { useEffect } from "react";
import { useLocation } from "wouter";

export default function VkCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const userId = params.get("user_id");

    if (!accessToken || !userId) {
      navigate("/login");
      return;
    }

    fetch("http://127.0.0.1:8000/api/auth/vk/callback/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken, user_id: userId }),
      mode: "cors",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
          const userWithRole = {
            ...data.user,
            role: data.user.is_staff ? "admin" : "user",
          };
          localStorage.setItem("user", JSON.stringify(userWithRole));
          window.location.href = window.location.origin + "/";
        } else {
          navigate("/login");
        }
      })
      .catch(() => navigate("/login"));
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#0077FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Авторизация через VK...</p>
      </div>
    </div>
  );
}
