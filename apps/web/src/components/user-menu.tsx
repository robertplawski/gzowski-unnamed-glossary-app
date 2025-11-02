import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {authClient} from "@/lib/auth-client";
import {useNavigate} from "@tanstack/react-router";
import {Button} from "./ui/button";
import {Skeleton} from "./ui/skeleton";
import {Link} from "@tanstack/react-router";
import {
	LucideUser,
	LucideUserCheck,
	LucideMessageCircleQuestion,
} from "lucide-react";

export default function UserMenu() {
	const navigate = useNavigate();
	const {data: session, isPending} = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-11 md:w-23" />;
	}

	if (!session) {
		return (
			<Button variant="outline" asChild>
				<Link to="/login">Sign In</Link>
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">
					{session.user.role === "user" ? (
						<LucideUser />
					) : session.user.role === "moderator" ? (
						<LucideUserCheck />
					) : session.user.role === "admin" ? (
						// Because shield-user doesn't work
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							className="lucide lucide-shield-user-icon lucide-shield-user">
							<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
							<path d="M6.376 18.91a6 6 0 0 1 11.249.003" />
							<circle cx="12" cy="11" r="4" />
						</svg>
					) : (
						<LucideMessageCircleQuestion />
					)}
					<p className="hidden md:block">{session.user.name}</p>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card">
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem>{session.user.email}</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Button
						variant="destructive"
						className="w-full"
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										navigate({
											to: "/",
										});
									},
								},
							});
						}}>
						Sign Out
					</Button>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
