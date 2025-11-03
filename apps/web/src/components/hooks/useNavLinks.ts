import { useEffect, useMemo, useState } from "react";
import { redirect, Route, RouteApi } from "@tanstack/react-router";
import type { StatementType } from "@gzowski-unnamed-glossary-app/auth/lib/permissions";

import {
	LucideBookA,
	LucideCalendar,
	LucideClover,
	LucideTrophy,
	LucideLayoutDashboard,
	LucideShieldCheck,
	LucideSettings,
	LucidePlusCircle,
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
		to: "/glossary",
		label: "Glossary",
		icon: LucideBookA,
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
		to: "/add-entry",
		label: "Create",
		icon: LucidePlusCircle,
		permissions: {
			entry: ["create"],
		},
	},
	{
		to: "/moderation-dashboard",
		label: "Moderation",
		icon: LucideShieldCheck,
		permissions: {
			entry: ["verify"],
			comment: ["verify"],
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

export const checkRoutePermissions = async (route: { route: any }) => {
	const session = await authClient.getSession();
	if (!session.data) {
		redirect({
			to: "/login",
			throw: true,
		});
	}

	if (
		!(await checkNavLinkPermissions(getNavLinkForRoute(route.location.href)))
	) {
		redirect({ to: "/login", throw: true });
		return { session };
	}
};
export const getNavLinkForRoute = (route: string) => {
	return baseNavLinks.filter((v) => v.to === route)[0];
};
export const checkNavLinkPermissions = async (link: NavLink) => {
	const session = await authClient.getSession();
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
};

export const getNavLinks = async () => {
	const filteredNavLinks = await Promise.all(
		baseNavLinks.map(checkNavLinkPermissions),
	);

	const result = filteredNavLinks.filter(
		(link): link is typeof link => link !== null,
	);
	return result;
};
export default function useNavLinks(quickLinkSize = 4) {
	const [loading, setLoading] = useState(true);
	const [navLinks, setNavLinks] = useState<NavLink[]>();
	const { data } = authClient.useSession();

	useEffect(() => {
		getNavLinks()
			.then((v) => setNavLinks(v))
			.finally(() => setLoading(false));
	}, [data?.session.id]);
	const quickNavLinks = useMemo(
		() => navLinks?.filter((_, i) => i < quickLinkSize) || [],
		[navLinks],
	);
	const otherNavLinks = useMemo(
		() => navLinks?.filter((_, i) => i >= quickLinkSize) || [],
		[navLinks],
	);

	return { navLinks, loading, quickNavLinks, otherNavLinks };
}
