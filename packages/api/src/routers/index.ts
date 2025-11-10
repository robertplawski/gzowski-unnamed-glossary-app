import { publicProcedure } from "../index";
import { commentRouter } from "./comment";
import { dictionaryRouter } from "./dictionary";
import type { RouterClient } from "@orpc/server";
import { entryVoteRouter } from "./entryVote";
import { entryRouter } from "./entry";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	...entryRouter,
	...entryVoteRouter,
	...commentRouter,
	...dictionaryRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
