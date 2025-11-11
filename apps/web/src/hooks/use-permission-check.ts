import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";

type PermissionType = "dictionary" | "entry" | "comment" | "user";
type PermissionAction = "create" | "update" | "delete" | "verify" | "list" | "ban";

interface PermissionCheck {
  [key: string]: PermissionAction[];
}

export function usePermissionCheck(permissions: PermissionCheck) {
  const { data: session } = authClient.useSession();

  const { data: hasPermission, isLoading } = useQuery({
    queryKey: ["permission-check", permissions],
    queryFn: async () => {
      if (!session?.user?.id) {
        return false;
      }

      try {
        const { data } = await authClient.admin.hasPermission({
          userId: session.user.id,
          permission: permissions,
        });

        if (!data || data.error || !data.success) {
          return false;
        }

        return data.success;
      } catch (error) {
        console.error("Error checking permissions:", error);
        return false;
      }
    },
    enabled: !!session?.user?.id,
    retry: 0,
  });

  return {
    hasPermission: !!hasPermission,
    isLoading,
    userRole: session?.user?.role,
  };
}

