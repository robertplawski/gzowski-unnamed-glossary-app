import { Link } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { useScrollPosition } from "./hooks/useScrollPosition"; // adjust path as needed
import GUGAIcon from "../../public/union-jack.svg";
import {
	LayoutDashboard,
	LucideBookA,
	LucideCalendar,
	LucideClover,
	LucideTrophy,
} from "lucide-react";

export default function Header() {
	const { isScrolled } = useScrollPosition();
	const links = [
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
		{
			to: "/dashboard",
			label: "Dashboard",
			icon: LayoutDashboard,
		},
	] as const;

	return (
		<header
			className={`transition-all sticky top-0 flex justify-center ${isScrolled ? "border-b border-outline backdrop-blur-sm bg-background/60 px-4 py-2" : "px-6 py-4"}`}
		>
			<div className="max-w-6xl w-full flex flex-row items-center justify-between">
				<div className="flex flex-col sm:flex-row sm:gap-8 items-center flex-1 gap-2">
					<Link className="flex flex-row gap-4" to={"/"}>
						<img width={40} src={GUGAIcon} alt="GUGA logo, union jack" />
						<p className="font-bold text-xl">GUGA</p>
					</Link>
					<nav className="flex gap-2 md:gap-4 items-center justify-center flex-1  ">
						{links.map(({ to, label, icon: Icon }) => {
							return (
								<Link
									key={to}
									to={to as unknown as any}
									className="flex p-2 flex-row cursor-pointer gap-2 items-center"
								>
									<Icon size={20} />
									<p className="hidden lg:block">{label}</p>
								</Link>
							);
						})}
					</nav>
					<div className="flex items-center gap-2">
						<ModeToggle />
						<UserMenu />
					</div>
				</div>
			</div>
		</header>
	);
}
