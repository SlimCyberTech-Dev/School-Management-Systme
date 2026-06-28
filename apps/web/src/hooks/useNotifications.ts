"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import type { NotificationItem, NotificationPreference, NotificationsListData } from "@/lib/notifications";
import { NOTIFICATIONS_POLL_MS, NOTIFICATIONS_STALE_MS, queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/store/authStore";

function tenantSlugFromAuth(): string {
  return useAuthStore.getState().tenantSlug ?? "default";
}

export function useNotificationUnreadCount() {
  const tenantSlug = useAuthStore((s) => s.tenantSlug) ?? "default";
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.notificationUnreadCount(tenantSlug),
    queryFn: async () => {
      const data = await apiGet<NotificationsListData>("/notifications?unread=true&limit=1");
      return data.unreadCount;
    },
    enabled: isAuthenticated,
    staleTime: NOTIFICATIONS_STALE_MS,
    refetchInterval: NOTIFICATIONS_POLL_MS,
  });
}

export function useNotificationsList(open: boolean) {
  const tenantSlug = useAuthStore((s) => s.tenantSlug) ?? "default";
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.notificationsList(tenantSlug),
    queryFn: () => apiGet<NotificationsListData>("/notifications?limit=20"),
    enabled: isAuthenticated && open,
    staleTime: NOTIFICATIONS_STALE_MS,
    refetchInterval: open ? NOTIFICATIONS_POLL_MS : false,
    placeholderData: (prev) => prev,
  });
}

export function useNotificationPreferences() {
  const tenantSlug = useAuthStore((s) => s.tenantSlug) ?? "default";
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.notificationPreferences(tenantSlug),
    queryFn: () => apiGet<NotificationPreference[]>("/notifications/preferences"),
    enabled: isAuthenticated,
    staleTime: NOTIFICATIONS_STALE_MS,
  });
}

function invalidateNotificationQueries(qc: ReturnType<typeof useQueryClient>) {
  const slug = tenantSlugFromAuth();
  void qc.invalidateQueries({ queryKey: ["notifications", slug] });
  void qc.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount(slug) });
  void qc.invalidateQueries({ queryKey: queryKeys.notificationsList(slug) });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiPatch<NotificationItem>(`/notifications/${id}/read`),
    onSuccess: () => invalidateNotificationQueries(qc),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => apiPatch<{ updated: number }>("/notifications/read-all"),
    onSuccess: () => invalidateNotificationQueries(qc),
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  const tenantSlug = useAuthStore((s) => s.tenantSlug) ?? "default";

  return useMutation({
    mutationFn: (preferences: Array<{
      category: string;
      emailEnabled?: boolean;
      inAppEnabled?: boolean;
    }>) => apiPatch<NotificationPreference[]>("/notifications/preferences", { preferences }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.notificationPreferences(tenantSlug), data);
    },
  });
}
