import { publicProcedure, protectedProcedure } from "../index";
import { eq, and } from "drizzle-orm";
import { ORPCError, type RouterClient } from "@orpc/server";
import { db } from "@gzowski-unnamed-glossary-app/db";
import {
	dictionary,
	entry,
	tag,
	entryTag,
	comment,
	entryVote,
	commentVote,
} from "@gzowski-unnamed-glossary-app/db/schema/dictionary";
import { auth } from "@gzowski-unnamed-glossary-app/auth";
import { z } from "zod";
import { randomUUID } from "crypto";

// ===== Dictionary Schemas =====
const dictionaryCreateSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
});

const dictionaryUpdateSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).optional(),
	description: z.string().optional(),
});

const dictionaryIdSchema = z.object({
	id: z.string().uuid(),
});

// ===== Entry Schemas =====
const entryCreateSchema = z.object({
	dictionaryId: z.string().uuid(),
	word: z.string().min(1),
	translation: z.string().optional(),
	partOfSpeech: z.string().optional(),
	pronunciation: z.string().optional(),
	example: z.string().optional(),
	notes: z.string().optional(),
});

const entryUpdateSchema = z.object({
	id: z.string().uuid(),
	word: z.string().min(1).optional(),
	translation: z.string().optional(),
	partOfSpeech: z.string().optional(),
	pronunciation: z.string().optional(),
	example: z.string().optional(),
	notes: z.string().optional(),
});

const entryIdSchema = z.object({
	id: z.string().uuid(),
});

const entryByDictionarySchema = z.object({
	dictionaryId: z.string().uuid(),
});

// ===== Tag Schemas =====
const tagCreateSchema = z.object({
	name: z.string().min(1),
});

const tagIdSchema = z.object({
	id: z.string().uuid(),
});

// ===== Entry Tag Schemas =====
const entryTagCreateSchema = z.object({
	entryId: z.string().uuid(),
	tagId: z.string().uuid(),
});

const entryTagDeleteSchema = z.object({
	entryId: z.string().uuid(),
	tagId: z.string().uuid(),
});

const tagsByEntrySchema = z.object({
	entryId: z.string().uuid(),
});

// ===== Comment Schemas =====
const commentCreateSchema = z.object({
	entryId: z.string().uuid(),
	text: z.string().min(1),
	image: z.string().optional(),
});

const commentUpdateSchema = z.object({
	id: z.string().uuid(),
	text: z.string().min(1).optional(),
	image: z.string().optional(),
});

const commentIdSchema = z.object({
	id: z.string().uuid(),
});

const commentsByEntrySchema = z.object({
	entryId: z.string().uuid(),
});

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

const commentVoteSchema = z.object({
	commentId: z.string().uuid(),
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

const commentVoteDeleteSchema = z.object({
	commentId: z.string().uuid(),
});

export const dictionaryRouter = {
	// ===== Dictionary Routes =====
	// Public endpoints for reading dictionaries
	dictionary: {
		getAll: publicProcedure.handler(async () => {
			return db.select().from(dictionary).all();
		}),

		getById: publicProcedure
			.input(dictionaryIdSchema)
			.handler(async ({ input: { id } }) => {
				return db.select().from(dictionary).where(eq(dictionary.id, id)).get();
			}),

		// Admin/moderator only endpoints
		create: protectedProcedure
			.input(dictionaryCreateSchema)
			.handler(async ({ input: { name, description }, context }) => {
				// Check if user has permission to create dictionaries
				const { success: hasPermission } = await auth.api.userHasPermission({
					body: {
						userId: context.session.user.id,
						permission: { dictionary: ["create"] },
					},
				});

				if (!hasPermission) {
					throw new ORPCError("FORBIDDEN");
				}

				const id = randomUUID();
				const timestamp = new Date();
				await db.insert(dictionary).values({
					id,
					name,
					description: description ?? null,
					createdAt: timestamp,
					updatedAt: timestamp,
				});
				return { success: true, id };
			}),

		update: protectedProcedure
			.input(dictionaryUpdateSchema)
			.handler(async ({ input: { id, name, description }, context }) => {
				// Check if user has permission to update dictionaries
				const { success: hasPermission } = await auth.api.userHasPermission({
					body: {
						userId: context.session.user.id,
						permission: { dictionary: ["update"] },
					},
				});

				if (!hasPermission) {
					throw new ORPCError("FORBIDDEN");
				}

				const updates: Record<string, any> = {
					updatedAt: new Date(),
				};
				if (name !== undefined) updates.name = name;
				if (description !== undefined)
					updates.description = description ?? null;

				await db.update(dictionary).set(updates).where(eq(dictionary.id, id));
				return { success: true };
			}),

		delete: protectedProcedure
			.input(dictionaryIdSchema)
			.handler(async ({ input: { id }, context }) => {
				// Check if user has permission to delete dictionaries
				const { success: hasPermission } = await auth.api.userHasPermission({
					body: {
						userId: context.session.user.id,
						permission: { dictionary: ["delete"] },
					},
				});

				if (!hasPermission) {
					throw new ORPCError("FORBIDDEN");
				}

				await db.delete(dictionary).where(eq(dictionary.id, id));
				return { success: true };
			}),
	},

	// ===== Entry Routes =====
	// Public endpoints for reading entries
	entry: {
		getAll: publicProcedure.handler(async () => {
			return db.select().from(entry).all();
		}),

		getById: publicProcedure
			.input(entryIdSchema)
			.handler(async ({ input: { id } }) => {
				return db.select().from(entry).where(eq(entry.id, id)).get();
			}),

		getByDictionary: publicProcedure
			.input(entryByDictionarySchema)
			.handler(async ({ input: { dictionaryId } }) => {
				return db
					.select()
					.from(entry)
					.where(eq(entry.dictionaryId, dictionaryId))
					.all();
			}),

		// Authenticated users can create entries
		create: protectedProcedure
			.input(entryCreateSchema)
			.handler(
				async ({
					input: {
						dictionaryId,
						word,
						translation,
						partOfSpeech,
						pronunciation,
						example,
						notes,
					},
					context,
				}) => {
					// Check if user has permission to create entries
					const { success: hasPermission } = await auth.api.userHasPermission({
						body: {
							userId: context.session.user.id,
							permission: { entry: ["create"] },
						},
					});

					if (!hasPermission) {
						throw new ORPCError("FORBIDDEN");
					}

					const id = randomUUID();
					const timestamp = new Date();
					await db.insert(entry).values({
						id,
						dictionaryId,
						word,
						translation: translation ?? null,
						partOfSpeech: partOfSpeech ?? null,
						pronunciation: pronunciation ?? null,
						example: example ?? null,
						notes: notes ?? null,
						score: 0,
						createdAt: timestamp,
						updatedAt: timestamp,
					});
					return { success: true, id };
				},
			),

		// Admin/moderator can update any entry
		update: protectedProcedure
			.input(entryUpdateSchema)
			.handler(
				async ({
					input: {
						id,
						word,
						translation,
						partOfSpeech,
						pronunciation,
						example,
						notes,
					},
					context,
				}) => {
					// Check if user has permission to update entries
					const { success: hasPermission } = await auth.api.userHasPermission({
						body: {
							userId: context.session.user.id,
							permission: { entry: ["update"] },
						},
					});

					if (!hasPermission) {
						throw new ORPCError("FORBIDDEN");
					}

					const updates: Record<string, any> = {
						updatedAt: new Date(),
					};
					if (word !== undefined) updates.word = word;
					if (translation !== undefined)
						updates.translation = translation ?? null;
					if (partOfSpeech !== undefined)
						updates.partOfSpeech = partOfSpeech ?? null;
					if (pronunciation !== undefined)
						updates.pronunciation = pronunciation ?? null;
					if (example !== undefined) updates.example = example ?? null;
					if (notes !== undefined) updates.notes = notes ?? null;

					await db.update(entry).set(updates).where(eq(entry.id, id));
					return { success: true };
				},
			),

		// Admin/moderator can delete entries
		delete: protectedProcedure
			.input(entryIdSchema)
			.handler(async ({ input: { id }, context }) => {
				// Check if user has permission to delete entries
				const { success: hasPermission } = await auth.api.userHasPermission({
					body: {
						userId: context.session.user.id,
						permission: { entry: ["delete"] },
					},
				});

				if (!hasPermission) {
					throw new ORPCError("FORBIDDEN");
				}

				await db.delete(entry).where(eq(entry.id, id));
				return { success: true };
			}),
	},

	/*// ===== Tag Routes =====
	tag: {
		getAll: publicProcedure.handler(async () => {
			return db.select().from(tag).all();
		}),

		getById: publicProcedure
			.input(tagIdSchema)
			.handler(async ({ input: { id } }) => {
				return db.select().from(tag).where(eq(tag.id, id)).get();
			}),

		// Authenticated users can create tags
		create: protectedProcedure
			.input(tagCreateSchema)
			.handler(async ({ input: { name }, context }) => {
				// Check if user has permission to create tags
				const { success: hasPermission } = await auth.api.userHasPermission({
					body: {
						userId: context.session.user.id,
						permission: { tag: ["create"] },
					},
				});

				if (!hasPermission) {
					throw new ORPCError("FORBIDDEN");
				}

				const id = randomUUID();
				const timestamp = new Date();
				await db.insert(tag).values({
					id,
					name,
					createdAt: timestamp,
					updatedAt: timestamp,
				});
				return { success: true, id };
			}),

		// Admin/moderator can delete tags
		delete: protectedProcedure
			.input(tagIdSchema)
			.handler(async ({ input: { id }, context }) => {
				// Check if user has permission to delete tags
				const { success: hasPermission } = await auth.api.userHasPermission({
					body: {
						userId: context.session.user.id,
						permission: { tag: ["delete"] },
					},
				});

				if (!hasPermission) {
					throw new ORPCError("FORBIDDEN");
				}

				await db.delete(tag).where(eq(tag.id, id));
				return { success: true };
			}),
	},

	// ===== Entry Tag Routes =====
	entryTag: {
		getByEntry: publicProcedure
			.input(tagsByEntrySchema)
			.handler(async ({ input: { entryId } }) => {
				return db
					.select()
					.from(entryTag)
					.innerJoin(tag, eq(entryTag.tagId, tag.id))
					.where(eq(entryTag.entryId, entryId))
					.all();
			}),

		// Authenticated users can tag entries
		create: protectedProcedure
			.input(entryTagCreateSchema)
			.handler(async ({ input: { entryId, tagId }, context }) => {
				// Check if user has permission to create entry tags
				const { success: hasPermission } = await auth.api.userHasPermission({
					body: {
						userId: context.session.user.id,
						permission: { entryTag: ["create"] },
					},
				});

				if (!hasPermission) {
					throw new ORPCError("FORBIDDEN");
				}

				await db.insert(entryTag).values({
					entryId,
					tagId,
				});
				return { success: true };
			}),

		// Admin/moderator can remove tags from entries
		delete: protectedProcedure
			.input(entryTagDeleteSchema)
			.handler(async ({ input: { entryId, tagId }, context }) => {
				// Check if user has permission to delete entry tags
				const { success: hasPermission } = await auth.api.userHasPermission({
					body: {
						userId: context.session.user.id,
						permission: { entryTag: ["delete"] },
					},
				});

				if (!hasPermission) {
					throw new ORPCError("FORBIDDEN");
				}

				await db
					.delete(entryTag)
					.where(and(eq(entryTag.entryId, entryId), eq(entryTag.tagId, tagId)));
				return { success: true };
			}),
	},*/

	// ===== Comment Routes =====
	comment: {
		getById: publicProcedure
			.input(commentIdSchema)
			.handler(async ({ input: { id } }) => {
				return db.select().from(comment).where(eq(comment.id, id)).get();
			}),

		getByEntry: publicProcedure
			.input(commentsByEntrySchema)
			.handler(async ({ input: { entryId } }) => {
				return db
					.select()
					.from(comment)
					.where(eq(comment.entryId, entryId))
					.all();
			}),

		// Authenticated users can create comments
		create: protectedProcedure
			.input(commentCreateSchema)
			.handler(async ({ input: { entryId, text, image }, context }) => {
				// Check if user has permission to create comments
				const { success: hasPermission } = await auth.api.userHasPermission({
					body: {
						userId: context.session.user.id,
						permission: { comment: ["create"] },
					},
				});

				if (!hasPermission) {
					throw new ORPCError("FORBIDDEN");
				}

				const userId = context.session.user.id;

				const id = randomUUID();
				const timestamp = new Date();
				await db.insert(comment).values({
					id,
					entryId,
					userId,
					text,
					image: image ?? null,
					score: 0,
					createdAt: timestamp,
					updatedAt: timestamp,
				});
				return { success: true, id };
			}),

		// Admin/moderator can update any comment
		update: protectedProcedure
			.input(commentUpdateSchema)
			.handler(async ({ input: { id, text, image }, context }) => {
				// Check if user has permission to update comments
				const { success: hasPermission } = await auth.api.userHasPermission({
					body: {
						userId: context.session.user.id,
						permission: { comment: ["update"] },
					},
				});

				if (!hasPermission) {
					throw new ORPCError("FORBIDDEN");
				}

				const updates: Record<string, any> = {
					updatedAt: new Date(),
				};
				if (text !== undefined) updates.text = text;
				if (image !== undefined) updates.image = image ?? null;

				await db.update(comment).set(updates).where(eq(comment.id, id));
				return { success: true };
			}),

		// Admin/moderator can delete any comment
		delete: protectedProcedure
			.input(commentIdSchema)
			.handler(async ({ input: { id }, context }) => {
				// Check if user has permission to delete comments
				const { success: hasPermission } = await auth.api.userHasPermission({
					body: {
						userId: context.session.user.id,
						permission: { comment: ["delete"] },
					},
				});

				if (!hasPermission) {
					throw new ORPCError("FORBIDDEN");
				}

				await db.delete(comment).where(eq(comment.id, id));
				return { success: true };
			}),
	},

	// ===== Entry Vote Routes =====
	entryVote: {
		// Authenticated users can vote on entries
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

		// Authenticated users can remove their vote
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
					await db.delete(entryVote).where(eq(entryVote.id, existingVote.id));

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

	// ===== Comment Vote Routes =====
	commentVote: {
		// Authenticated users can vote on comments
		vote: protectedProcedure
			.input(commentVoteSchema)
			.handler(async ({ input: { commentId, value }, context }) => {
				const userId = context.session.user.id;

				// Check if vote exists
				const existingVote = await db
					.select()
					.from(commentVote)
					.where(
						and(
							eq(commentVote.commentId, commentId),
							eq(commentVote.userId, userId),
						),
					)
					.get();

				const timestamp = new Date();

				if (existingVote) {
					const oldValue = existingVote.value;
					// Update existing vote
					await db
						.update(commentVote)
						.set({ value, updatedAt: timestamp })
						.where(eq(commentVote.id, existingVote.id));

					// Update comment score (remove old value, add new value)
					const scoreDiff = value - oldValue;
					if (scoreDiff !== 0) {
						const currentComment = await db
							.select({ score: comment.score })
							.from(comment)
							.where(eq(comment.id, commentId))
							.get();

						if (currentComment) {
							await db
								.update(comment)
								.set({ score: currentComment.score + scoreDiff })
								.where(eq(comment.id, commentId));
						}
					}
				} else {
					// Create new vote
					const id = randomUUID();
					await db.insert(commentVote).values({
						id,
						commentId,
						userId,
						value,
						createdAt: timestamp,
						updatedAt: timestamp,
					});

					// Update comment score
					const currentComment = await db
						.select({ score: comment.score })
						.from(comment)
						.where(eq(comment.id, commentId))
						.get();

					if (currentComment) {
						await db
							.update(comment)
							.set({ score: currentComment.score + value })
							.where(eq(comment.id, commentId));
					}
				}

				return { success: true };
			}),

		// Authenticated users can remove their vote
		removeVote: protectedProcedure
			.input(commentVoteDeleteSchema)
			.handler(async ({ input: { commentId }, context }) => {
				const userId = context.session.user.id;

				const existingVote = await db
					.select()
					.from(commentVote)
					.where(
						and(
							eq(commentVote.commentId, commentId),
							eq(commentVote.userId, userId),
						),
					)
					.get();

				if (existingVote) {
					await db
						.delete(commentVote)
						.where(eq(commentVote.id, existingVote.id));

					// Update comment score
					const currentComment = await db
						.select({ score: comment.score })
						.from(comment)
						.where(eq(comment.id, commentId))
						.get();

					if (currentComment) {
						await db
							.update(comment)
							.set({ score: currentComment.score - existingVote.value })
							.where(eq(comment.id, commentId));
					}
				}

				return { success: true };
			}),
	},
};

export type DictionaryRouter = typeof dictionaryRouter;
export type DictionaryRouterClient = RouterClient<DictionaryRouter>;
