import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth";
import {
	ac,
	admin,
	user,
	moderator,
} from "@gzowski-unnamed-glossary-app/auth/lib/permissions";
import getServerUrl from "@/utils/getServerUrl";

export const authClient = createAuthClient({
	baseURL: getServerUrl(),
	plugins: [
		polarClient(),
		adminClient({
			ac,
			roles: {
				admin,
				user,
				moderator,
			},
		}),
	],
});
