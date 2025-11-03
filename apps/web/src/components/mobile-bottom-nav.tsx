import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import useNavLinks from "./hooks/useNavLinks";
import { Button } from "./ui/button";
import { LucideArrowDown, LucideArrowUp } from "lucide-react";

export default function MobileBottomNav() {
	const [isOpened, setOpened] = useState(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { quickNavLinks, otherNavLinks, loading } = useNavLinks();
	// Move this to useNavlinks hook and please also incorporate into header

	return (
		<nav
			aria-label="Mobile navigation"
			className="overflow-hidden flex flex-col fixed bottom-0 left-0 inset-x-0 md:hidden z-40 border-t bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<div
				className={`w-full max-w-6xl grid overflow-hidden transition-[height] ${isOpened ? "h-16" : "h-0"}`}
				style={{
					gridTemplateColumns: `repeat(${otherNavLinks.length}, minmax(0, 1fr))`,
				}}
			>
				{otherNavLinks.map(({ to, label, icon: Icon }) => {
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
			{!loading && (
				<div
					className={"w-full max-w-6xl grid overflow-scroll"}
					style={{
						gridTemplateColumns: `repeat(${quickNavLinks.length + 1}, minmax(0, 1fr))`,
					}}
				>
					{quickNavLinks.map(({ to, label, icon: Icon }) => {
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
					<Button
						variant={"ghost"}
						onClick={() => setOpened((v) => !v)}
						className={`h-full flex flex-col items-center justify-center gap-1.5 py-3 transition-colors transition-transform ${
							isOpened ? "text-primary" : "text-muted-foreground"
						} hover:text-foreground active:scale-[0.98]`}
					>
						{isOpened ? (
							<LucideArrowDown size={22} />
						) : (
							<LucideArrowUp size={22} />
						)}
						<span>More</span>
					</Button>
				</div>
			)}
		</nav>
	);
}
