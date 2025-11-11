import type { ReactNode } from "react";
import { usePermissionCheck } from "@/hooks/use-permission-check";

interface PermissionWrapperProps {
  children: ReactNode;
  permissions: Record<string, string[]>;
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have all permissions. If false, having any of the permissions is enough
}

export function PermissionWrapper({
  children,
  permissions,
  fallback = null,
  requireAll = true,
}: PermissionWrapperProps) {
  const { hasPermission, isLoading } = usePermissionCheck(permissions);

  if (isLoading) {
    return null; // Or return a loading spinner if preferred
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
