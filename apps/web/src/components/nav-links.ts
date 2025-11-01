import {
  LucideBookA,
  LucideCalendar,
  LucideClover,
  LucideTrophy,
  LucideLayoutDashboard,
} from "lucide-react";

export const baseNavLinks = [
  {
    to: "/glossary",
    label: "Glossary",
    icon: LucideBookA,
  },
  {
    to: "/wotd",
    label: "Wotd",
    icon: LucideCalendar,
  },
  {
    to: "/random",
    label: "Random",
    icon: LucideClover,
  },
  {
    to: "/challenging",
    label: "Challenging",
    icon: LucideTrophy,
  },
] as const;

export const dashboardLink = {
  to: "/dashboard",
  label: "Dashboard",
  icon: LucideLayoutDashboard,
  requiresAuth: true,
} as const;

export const getNavLinks = (isAuthorized: boolean) => {
  if (isAuthorized) {
    return [...baseNavLinks, dashboardLink];
  }
  return baseNavLinks;
};