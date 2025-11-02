import { Link, useRouterState } from "@tanstack/react-router";
import useNavLinks from "./hooks/useNavLinks";

export default function MobileBottomNav() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { navLinks, loading } = useNavLinks();

	return (
		<nav
			aria-label="Mobile navigation"
			className="fixed bottom-0 inset-x-0 md:hidden z-40 border-t bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-16"
		>
			{!loading && (
				<div
					className={`mx-auto max-w-6xl grid`}
					style={{
						gridTemplateColumns: `repeat(${navLinks.length}, minmax(0, 1fr))`,
					}}
				>
					{navLinks.map(({ to, label, icon: Icon }) => {
						const isActive = pathname === to || pathname.startsWith(`${to}/`);
						return (
							<Link
								key={to}
								to={to as unknown as any}
								aria-current={isActive ? "page" : undefined}
								className={`flex flex-col items-center justify-center gap-1.5 py-3 transition-colors transition-transform ${
									isActive ? "text-primary" : "text-muted-foreground"
								} hover:text-foreground active:scale-[0.98]`}
							>
								<Icon size={22} />
								<span className="text-xs leading-tight">{label}</span>
							</Link>
						);
					})}
				</div>
			)}
		</nav>
	);
}
