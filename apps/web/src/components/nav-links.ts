import {
  LucideBookA,
  LucideCalendar,
  LucideClover,
  LucideTrophy,
} from "lucide-react";

export const navLinks = [
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