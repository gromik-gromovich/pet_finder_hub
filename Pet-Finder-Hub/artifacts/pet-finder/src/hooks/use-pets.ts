import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAd, createAd, Ad, Notification, getToken } from "@/lib/api";

export function useAds(filters?: { type?: string; animalType?: string; district?: string; search?: string }) {
  return useQuery<Ad[]>({
    queryKey: ["ads", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters?.animalType && filters.animalType !== 'all') params.append('animal_type', filters.animalType);
      if (filters?.district && filters.district !== 'all') params.append('district', filters.district);
      
      const response = await fetch(`http://127.0.0.1:8000/api/ads/?${params.toString()}`);
      if (!response.ok) throw new Error('Ошибка загрузки');
      const ads = await response.json();
      return ads.filter((ad: Ad) => ad.status === 'approved');
    },
  });
}

export function useAd(id: number) {
  return useQuery<Ad>({
    queryKey: ["ads", id],
    queryFn: () => getAd(id),
    enabled: !!id,
  });
}

export function useMyAds() {
  const token = getToken();
  return useQuery<Ad[]>({
    queryKey: ["my-ads"],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch('http://127.0.0.1:8000/api/ads/my_ads/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (!response.ok) throw new Error('Ошибка загрузки');
      return response.json();
    },
  });
}

export function usePendingAds() {
  const token = getToken();
  return useQuery<Ad[]>({
    queryKey: ["pending-ads"],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch('http://127.0.0.1:8000/api/ads/pending/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (!response.ok) throw new Error('Ошибка загрузки');
      return response.json();
    },
  });
}

export function useCreateAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = getToken();
      if (!token) throw new Error("Не авторизован");
      return createAd(formData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
  });
}

export function useUpdateAdStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "approved" | "rejected" }) => {
      const token = getToken();
      if (!token) throw new Error("Не авторизован");
      const endpoint = status === 'approved' ? 'approve' : 'reject';
      const response = await fetch(`http://127.0.0.1:8000/api/ads/${id}/${endpoint}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (!response.ok) throw new Error('Ошибка обновления статуса');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["pending-ads"] });
      queryClient.invalidateQueries({ queryKey: ["my-ads"] });
    },
  });
}

export function useDeleteAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const token = getToken();
      if (!token) throw new Error("Не авторизован");
      const response = await fetch(`http://127.0.0.1:8000/api/ads/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (!response.ok) throw new Error('Ошибка удаления');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["my-ads"] });
    },
  });
}

export function useRecordView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Token ${token}`;
      await fetch(`http://127.0.0.1:8000/api/ads/${id}/record_view/`, {
        method: 'POST',
        headers,
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["ads", id] });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const token = getToken();
      if (!token) throw new Error("Не авторизован");
      const response = await fetch(`http://127.0.0.1:8000/api/ads/${id}/toggle_favorite/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (!response.ok) throw new Error('Ошибка');
      return response.json() as Promise<{ is_favorited: boolean }>;
    },
    onSuccess: (data, id) => {
      queryClient.setQueryData(["ads", id], (old: any) =>
        old ? { ...old, is_favorited: data.is_favorited } : old
      );
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useFavorites() {
  const token = getToken();
  return useQuery<Ad[]>({
    queryKey: ["favorites"],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch('http://127.0.0.1:8000/api/ads/favorites/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (!response.ok) throw new Error('Ошибка загрузки');
      return response.json();
    },
  });
}

export function useNotifications() {
  const token = getToken();
  return useQuery<{ notifications: Notification[]; unread_count: number }>({
    queryKey: ["notifications"],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch('http://127.0.0.1:8000/api/notifications/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (!response.ok) throw new Error('Ошибка');
      return response.json();
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = getToken();
      if (!token) throw new Error("Не авторизован");
      await fetch('http://127.0.0.1:8000/api/notifications/', {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}