import { db } from "@gzowski-unnamed-glossary-app/db";
import { eq, and, sql } from "drizzle-orm";
import { protectedProcedure, publicProcedure } from "../index";
import {
	entry,
	entryVote,
} from "@gzowski-unnamed-glossary-app/db/schema/dictionary";
import z from "zod";
import { randomUUID } from "crypto";
import type { RouterClient } from "@orpc/server";

// ===== Vote Schemas =====
const entryVoteSchema = z.object({
	entryId: z.string().uuid(),
	value: z
		.number()
		.int()
		.min(-1)
		.max(1)
		.refine((v) => v === 1 || v === -1, {
			message: "Vote value must be 1 or -1",
		}),
});

const entryVoteDeleteSchema = z.object({
	entryId: z.string().uuid(),
});
const getVoteOutputSchema = z.object({
	userVote: z.number().nullable(),
	totalVotes: z.number(),
	totalScore: z.number(),
});

export const entryVoteRouter = {
	entryVote: {
		resetVote: protectedProcedure
			.input(z.object({ entryId: z.string() }))
			.handler(async ({ input: { entryId }, context }) => {
				const userId = context.session.user.id;

				// Check if vote exists
				const existingVote = await db
					.select()
					.from(entryVote)
					.where(
						and(eq(entryVote.entryId, entryId), eq(entryVote.userId, userId)),
					)
					.get();

				if (!existingVote) {
					// No vote to reset
					return { success: true, message: "No vote found to reset" };
				}

				// Remove the vote value from entry score
				const currentEntry = await db
					.select({ score: entry.score })
					.from(entry)
					.where(eq(entry.id, entryId))
					.get();

				if (currentEntry) {
					await db
						.update(entry)
						.set({ score: currentEntry.score - existingVote.value })
						.where(eq(entry.id, entryId));
				}

				// Delete the vote record
				await db.delete(entryVote).where(eq(entryVote.id, existingVote.id));

				return { success: true, message: "Vote reset successfully" };
			}),
		vote: protectedProcedure
			.input(entryVoteSchema)
			.handler(async ({ input: { entryId, value }, context }) => {
				const userId = context.session.user.id;

				// Check if vote exists
				const existingVote = await db
					.select()
					.from(entryVote)
					.where(
						and(eq(entryVote.entryId, entryId), eq(entryVote.userId, userId)),
					)
					.get();

				const timestamp = new Date();

				if (existingVote) {
					const oldValue = existingVote.value;
					// Update existing vote
					await db
						.update(entryVote)
						.set({ value, updatedAt: timestamp })
						.where(eq(entryVote.id, existingVote.id));

					// Update entry score (remove old value, add new value)
					const scoreDiff = value - oldValue;
					if (scoreDiff !== 0) {
						const currentEntry = await db
							.select({ score: entry.score })
							.from(entry)
							.where(eq(entry.id, entryId))
							.get();

						if (currentEntry) {
							await db
								.update(entry)
								.set({ score: currentEntry.score + scoreDiff })
								.where(eq(entry.id, entryId));
						}
					}
				} else {
					// Create new vote
					const id = randomUUID();
					await db.insert(entryVote).values({
						id,
						entryId,
						userId,
						value,
						createdAt: timestamp,
						updatedAt: timestamp,
					});

					// Update entry score
					const currentEntry = await db
						.select({ score: entry.score })
						.from(entry)
						.where(eq(entry.id, entryId))
						.get();

					if (currentEntry) {
						await db
							.update(entry)
							.set({ score: currentEntry.score + value })
							.where(eq(entry.id, entryId));
					}
				}

				return { success: true };
			}),
		getVote: publicProcedure
			.input(
				z.object({
					entryId: z.string().uuid(),
				}),
			)
			.output(getVoteOutputSchema)
			.handler(async ({ input: { entryId }, context }) => {
				// Get total vote count and score for the entry
				const voteStats = await db
					.select({
						totalVotes: db.$count(entryVote),
						totalScore: sql<number>`SUM(${entryVote.value})`.as("totalScore"),
					})
					.from(entryVote)
					.where(eq(entryVote.entryId, entryId))
					.get();

				// Get entry information
				const entryInfo = await db
					.select({ score: entry.score })
					.from(entry)
					.where(eq(entry.id, entryId))
					.get();

				if (!context?.session?.user?.id) {
					return {
						userVote: null, // null if user hasn't voted
						totalVotes: voteStats?.totalVotes || 0,
						totalScore: voteStats?.totalScore || 0,
					};
				}

				const userId = context.session.user.id;

				// Get user's vote for this entry
				const userVote = await db
					.select({ value: entryVote.value })
					.from(entryVote)
					.where(
						and(eq(entryVote.entryId, entryId), eq(entryVote.userId, userId)),
					)
					.get();

				return {
					userVote: userVote?.value || null, // null if user hasn't voted
					totalVotes: voteStats?.totalVotes || 0,
					totalScore: voteStats?.totalScore || 0,
					entryScore: entryInfo?.score || 0,
				};
			}), // Authenticated users can remove their vote
		removeVote: protectedProcedure
			.input(entryVoteDeleteSchema)
			.handler(async ({ input: { entryId }, context }) => {
				const userId = context.session.user.id;

				const existingVote = await db
					.select()
					.from(entryVote)
					.where(
						and(eq(entryVote.entryId, entryId), eq(entryVote.userId, userId)),
					)
					.get();

				if (existingVote) {
					const timestamp = new Date();
					await db
						.update(entryVote)
						.set({ value: 0, updatedAt: timestamp })
						.where(eq(entryVote.id, existingVote.id));

					// Update entry score
					const currentEntry = await db
						.select({ score: entry.score })
						.from(entry)
						.where(eq(entry.id, entryId))
						.get();

					if (currentEntry) {
						await db
							.update(entry)
							.set({ score: currentEntry.score - existingVote.value })
							.where(eq(entry.id, entryId));
					}
				}

				return { success: true };
			}),
	},
};

export type EntryVoteRouter = typeof entryVoteRouter;
export type EntryVoteRouterClient = RouterClient<typeof entryVoteRouter>;
