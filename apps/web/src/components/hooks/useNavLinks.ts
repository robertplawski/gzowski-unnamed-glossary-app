import { useEffect, useState } from "react";
import type { StatementType } from "@gzowski-unnamed-glossary-app/auth/lib/permissions";

import {
	LucideBookA,
	LucideCalendar,
	LucideClover,
	LucideTrophy,
	LucideLayoutDashboard,
	LucideShieldCheck,
	LucideSettings,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

export interface NavLink {
	to: string;
	label: string;
	icon: typeof LucideBookA;
	permissions?: StatementType;
}

export const baseNavLinks: NavLink[] = [
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
		to: "/user-dashboard",
		label: "User Dashboard",
		icon: LucideLayoutDashboard,
		permissions: {
			entry: ["read"],
		},
	},
	{
		to: "/moderation-dashboard",
		label: "Moderation",
		icon: LucideShieldCheck,
		permissions: {
			entry: ["verify"],
		},
	},
	{
		to: "/admin-dashboard",
		label: "Admin",
		icon: LucideSettings,
		permissions: {
			dictionary: ["create"],
		},
	},
];

export const getNavLinks = async () => {
	const session = await authClient.getSession();

	const filteredNavLinks = await Promise.all(
		baseNavLinks.map(async (link) => {
			if (!link.permissions) {
				return link;
			}

			try {
				if (!session.data) {
					return null;
				}
				const { data } = await authClient.admin.hasPermission({
					userId: session.data.user.id,
					permission: link.permissions,
				});

				if (!data) {
					return null;
				}
				return data.success ? link : null;
			} catch (error) {
				return null;
			}
		}),
	);

	const result = filteredNavLinks.filter(
		(link): link is typeof link => link !== null,
	);
	return result;
};
export default function useNavLinks() {
	const [loading, setLoading] = useState(true);
	const [navLinks, setNavLinks] = useState<NavLink[]>();
	const { data } = authClient.useSession();

	useEffect(() => {
		getNavLinks()
			.then((v) => setNavLinks(v))
			.finally(() => setLoading(false));
	}, [data?.session.id]);

	return { navLinks, loading };
}
