import { Link } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { useScrollPosition } from "./hooks/useScrollPosition"; // adjust path as needed
import GUGAIcon from "../../public/union-jack.svg";
import useNavLinks from "./hooks/useNavLinks";
import { Button } from "./ui/button";
import { LucideMenu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Header() {
  const { isScrolled } = useScrollPosition();
  const { quickNavLinks, otherNavLinks, loading } = useNavLinks(4);

  return (
    <header
      className={`z-100 transition-all flex justify-center md:sticky md:top-0 ${isScrolled
          ? "border-b border-outline backdrop-blur-sm bg-background/60 px-4 py-2"
          : "px-4 py-3 md:px-6 md:py-4"
        }`}
    >
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
        {!loading && (
          <nav className="hidden md:flex gap-2 md:gap-4 items-center justify-center flex-1">
            {quickNavLinks.map(({ to, label, icon: Icon }) => {
              return (
                <Link
                  key={to}
                  to={to as unknown as any}
                  className="flex p-2 flex-row cursor-pointer gap-2 items-center hover:text-foreground transition-colors"
                >
                  <Icon size={20} />
                  <p className="hidden lg:block">{label}</p>
                </Link>
              );
            })}
          </nav>
        )}
        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {otherNavLinks.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden md:block" asChild>
                <Button variant="outline">
                  <LucideMenu />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card">
                <DropdownMenuLabel>More</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {otherNavLinks.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to as unknown as any}>
                    <DropdownMenuItem>
                      <Icon size={20} /> {label}
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
