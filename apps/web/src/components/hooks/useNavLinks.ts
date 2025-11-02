import { useEffect, useState } from "react";
import { getNavLinks, type NavLink } from "../nav-links";

import { authClient } from "@/lib/auth-client";

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
