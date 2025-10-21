import { publicProcedure } from "../index";
import { dictionaryRouter } from "./dictionary";
import type { RouterClient } from "@orpc/server";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	dictionary: dictionaryRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
