import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAds, getAd, createAd, Ad, getToken } from "@/lib/api";

export function useAdsApi() {
  return useQuery<Ad[]>({
    queryKey: ["ads-api"],
    queryFn: getAds,
  });
}

export function useAdApi(id: number) {
  return useQuery<Ad>({
    queryKey: ["ads-api", id],
    queryFn: () => getAd(id),
    enabled: !!id,
  });
}

export function useCreateAdApi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = getToken();
      if (!token) throw new Error("Не авторизован");
      return createAd(formData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads-api"] });
    },
  });
}