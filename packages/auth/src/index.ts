import { expo } from "@better-auth/expo";
import { ac, admin, user, moderator } from "./lib/permissions";
import { admin as adminPlugin } from "better-auth/plugins";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

/*import { polar, checkout, portal } from "@polar-sh/better-auth";
import { polarClient } from "./lib/payments";*/
import { db } from "@gzowski-unnamed-glossary-app/db";
import * as schema from "@gzowski-unnamed-glossary-app/db/schema/auth";
import { env } from "cloudflare:workers";
import { openAPI } from "better-auth/plugins";

const isProd = env.NODE_ENV === "production";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: schema,
	}),
	trustedOrigins: [
		"https://*.gzowski-unnamed-glossary-app-pages.dev",
		env.CORS_ORIGIN,
		"mybettertapp://",
		"exp://",
	],
	emailAndPassword: {
		enabled: true,
	},
	// uncomment cookieCache setting when ready to deploy to Cloudflare using *.workers.dev domains
	// session: {
	//   cookieCache: {
	//     enabled: true,
	//     maxAge: 60,
	//   },
	// },
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
		// uncomment crossSubDomainCookies setting when ready to deploy and replace <your-workers-subdomain> with your actual workers subdomain
		// https://developers.cloudflare.com/workers/wrangler/configuration/#workersdev
		crossSubDomainCookies: {
			enabled: true,
			domain: ".rp8.workers.dev",
		},
	},
	plugins: [
		adminPlugin({
			ac,
			roles: {
				admin,
				user,
				moderator,
			},
		}),
		openAPI(),
		/*polar({
			client: polarClient,
			createCustomerOnSignUp: true,
			enableCustomerPortal: true,
			use: [
				checkout({
					products: [
						{
							productId: "your-product-id",
							slug: "pro",
						},
					],
					successUrl: env.POLAR_SUCCESS_URL,
					authenticatedUsersOnly: true,
				}),
				portal(),
			],
		}),*/
		expo(),
	],
});
