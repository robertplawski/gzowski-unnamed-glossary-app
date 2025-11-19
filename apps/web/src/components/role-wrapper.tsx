import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

interface RoleWrapperProps {
  children: ReactNode;
  allowedRoles: ("admin" | "moderator" | "user")[];
  fallback?: ReactNode;
}

export function RoleWrapper({
  children,
  allowedRoles,
  fallback = null,
}: RoleWrapperProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return null; // Or return a loading spinner if preferred
  }

  if (!session?.user) {
    return <>{fallback}</>;
  }

  if (allowedRoles.includes(session.user.role as any)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
