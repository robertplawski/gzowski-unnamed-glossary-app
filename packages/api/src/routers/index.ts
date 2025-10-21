import { protectedProcedure, publicProcedure } from "../index";
import { dictionaryRouter } from "./dictionary";
import type { RouterClient } from "@orpc/server";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	dictionaryRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
