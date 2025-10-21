import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";
import { db } from "@gzowski-unnamed-glossary-app/db";
import { eq } from "drizzle-orm";
import { user } from "@gzowski-unnamed-glossary-app/db/schema/auth";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({
		context: {
			session: context.session,
		},
	});
});

export const protectedProcedure = publicProcedure.use(requireAuth);

const requireElevatedAccess = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}

	// Fetch user from database to get the role
	const userResult = await db
		.select({ role: user.role })
		.from(user)
		.where(eq(user.id, context.session.user.id))
		.get();

	if (!userResult || !userResult.role) {
		throw new ORPCError("UNAUTHORIZED");
	}

	const userRole = userResult.role;

	if (userRole !== "admin" && userRole !== "moderator") {
		throw new ORPCError("FORBIDDEN");
	}

	return next({
		context: {
			session: context.session,
		},
	});
});

export const elevatedProcedure = protectedProcedure.use(requireElevatedAccess);
