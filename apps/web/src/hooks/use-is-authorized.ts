import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";

export function useIsAuthorized() {
  const { data: session } = authClient.useSession();
  
  const { data: hasPermission, isLoading } = useQuery({
    queryKey: ["admin-permission"],
    queryFn: async () => {
      if (!session?.user?.id) {
        return false;
      }

      const { data } = await authClient.admin.hasPermission({
        userId: session.user.id,
        permission: {
          dictionary: ["create", "update", "delete"],
          entry: ["update", "create", "delete"],
        },
      });

      if (!data || data.error || !data.success) {
        return false;
      }

      return data.success;
    },
    enabled: !!session?.user?.id,
    retry: 0,
  });

  return {
    isAuthorized: !!hasPermission,
    isLoading,
    isAuthenticated: !!session?.user,
  };
}