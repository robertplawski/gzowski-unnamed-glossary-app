import type { Context as HonoContext } from "hono";
import { auth } from "@gzowski-unnamed-glossary-app/auth";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	return {
		env: context.env,
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
