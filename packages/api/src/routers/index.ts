import { publicProcedure } from "../index";
import { commentRouter } from "./comment";
import { dictionaryRouter } from "./dictionary";
import type { RouterClient } from "@orpc/server";
import { entryVoteRouter } from "./entryVote";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),

	...entryVoteRouter,
	...commentRouter,
	...dictionaryRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
