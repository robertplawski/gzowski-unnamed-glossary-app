import {Link} from "@tanstack/react-router";
import {ModeToggle} from "./mode-toggle";
import UserMenu from "./user-menu";
import {useScrollPosition} from "./hooks/useScrollPosition"; // adjust path as needed
import GUGAIcon from "../../public/union-jack.svg";
import {navLinks as links} from "./nav-links";

export default function Header() {
	const {isScrolled} = useScrollPosition();

	return (
		<header
			className={`transition-all flex justify-center md:sticky md:top-0 ${
				isScrolled
					? "border-b border-outline backdrop-blur-sm bg-background/60 px-4 py-2"
					: "px-4 py-3 md:px-6 md:py-4"
			}`}>
			<div className="max-w-6xl w-full flex items-center justify-between">
				{/* Left: Logo + Title */}
				<Link className="flex flex-row gap-3 items-center" to={"/"}>
					<img
						width={40}
						height={40}
						src={GUGAIcon}
						alt="GUGA logo, union jack"
					/>
					<p className="font-bold text-xl">GUGA</p>
				</Link>

				{/* Center: Top navigation (desktop only) */}
				<nav className="hidden md:flex gap-2 md:gap-4 items-center justify-center flex-1">
					{links.map(({to, label, icon: Icon}) => {
						return (
							<Link
								key={to}
								to={to as unknown as any}
								className="flex p-2 flex-row cursor-pointer gap-2 items-center hover:text-foreground transition-colors">
								<Icon size={20} />
								<p className="hidden lg:block">{label}</p>
							</Link>
						);
					})}
				</nav>

				{/* Right: Controls */}
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
