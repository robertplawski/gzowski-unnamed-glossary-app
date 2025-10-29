import { Link, useRouterState } from "@tanstack/react-router";
import { navLinks } from "./nav-links";

export default function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 inset-x-0 md:hidden z-50 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl grid grid-cols-5">
        {navLinks.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to as unknown as any}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 py-2 transition-colors transition-transform min-h-12 ${
                isActive ? "text-primary" : "text-muted-foreground"
              } hover:text-foreground active:scale-[0.98]`}
            >
              <Icon size={20} />
              <span className="text-xs leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}