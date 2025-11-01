import { publicProcedure, protectedProcedure } from "../index";
import { eq, and, ilike, or, sql, like } from "drizzle-orm";
import { ORPCError, type RouterClient } from "@orpc/server";
import { db } from "@gzowski-unnamed-glossary-app/db";
import { env } from "cloudflare:workers";

import {
	dictionary,
	entry,
	comment,
	entryVote,
	commentVote,
} from "@gzowski-unnamed-glossary-app/db/schema/dictionary";
import { auth } from "@gzowski-unnamed-glossary-app/auth";
import { z } from "zod";
import { randomUUID } from "crypto";
import {
	DictionaryAPIResponseSchema,
	type DictionaryAPIResponse,
} from "../types/dictionaryApi.ts";

const offsetPaginationSchema = z.object({
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(20),
});

// Helper function to get remote dictionary entry
async function getRemoteDictionaryEntry(word: string, context: any) {
	try {
		// Check cache first
		/*const cachedData = await context.env.WORD_CACHE.get(word);
		if (cachedData && z.safeParse(DictionaryAPIResponseSchema, cachedData)) {
			return cachedData;
		}*/

		// Fetch from API if not in cache
		const response = await fetch(
			`https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(word)}?translations=true`, //`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
			{
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"User-Agent": "DictionaryApp/1.0.0",
				},
			},
		);

		// Check if response is OK and content type is JSON
		if (!response.ok) {
			console.warn(`API returned ${response.status} for word: ${word}`);
			return null;
		}
		const remoteData =
			(await response.json()) as unknown as DictionaryAPIResponse;

		// Cache for future use
		await context.env.WORD_CACHE.put(word, JSON.stringify(remoteData));
		return remoteData;
	} catch (error) {
		console.error(`Failed to fetch remote data for word: ${word}`, error);
		return null;
	}
}

// Helper function to enrich entries with remote data
async function enrichEntriesWithRemoteData(entries: any[], context: any) {
	return Promise.all(
		entries
			.filter((_, index) => index < 10) // MAX 10
			.map(async (entry) => ({
				...entry,
				remoteDictionaryEntry: await getRemoteDictionaryEntry(
					entry.word,
					context,
				),
			})),
	);
}

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

// ===== JSON Import Schemas (as per original, matching the provided JSON) =====
const vocabularyItemSchema = z.object({
	word: z.string(),
	pronunciation: z.string().optional(),
	full_match: z.string(), // Not used in the entry, but present in the JSON
});

const pageSchema = z.object({
	file_path: z.string(),
	file_name: z.string(),
	match_count: z.number(),
	vocabulary: z.array(vocabularyItemSchema),
});

const importJsonSchema = z.object({
	metadata: z.object({
		regex_pattern: z.string(),
		pages_requested: z.string(),
		pages_found: z.array(z.number()),
		total_matches: z.number(),
		timestamp: z.string(), // Consider z.string().datetime() if format is strict
		input_directory: z.string(),
	}),
	pages: z.record(z.string(), pageSchema), // Key is page number string
});

type ImportJson = z.infer<typeof importJsonSchema>;

const remoteEntryInput = z.object({
	word: z.string(),
});

// Function to parse the import JSON and extract vocabulary entries
function parseImportJson(json: unknown): ImportJson {
	return importJsonSchema.parse(json); // This should now pass validation
}

// Function to extract vocabulary entries from the parsed JSON
function extractVocabularyEntries(parsedJson: ImportJson): {
	word: string;
	pronunciation: string | undefined;
	page: string; // Using the page number string key
}[] {
	const entries: {
		word: string;
		pronunciation: string | undefined;
		page: string;
	}[] = [];

	for (const [pageNumber, pageData] of Object.entries(parsedJson.pages)) {
		// Iterate over parsedJson.pages
		for (const vocabItem of pageData.vocabulary) {
			entries.push({
				word: vocabItem.word,
				pronunciation: vocabItem.pronunciation,
				page: pageNumber, // Use the page number from the key
			});
		}
	}

	return entries;
}

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
		getRemoteEntry: publicProcedure
			.input(remoteEntryInput)
			.handler(async ({ input: { word }, context }) => {
				const remoteData = await getRemoteDictionaryEntry(word, context);
				return JSON.stringify(remoteData);
			}),

		// Add this to your existing procedures
		search: publicProcedure
			.input(
				z.object({
					query: z.string().min(1, "Search query cannot be empty"),
					limit: z.number().min(1).max(100).optional().default(20),
					offset: z.number().min(0).optional().default(0),
				}),
			)
			.handler(async ({ input, context }) => {
				const { query, limit, offset } = input;

				// Search across multiple fields using SQLite LIKE (which is case-insensitive)
				const entries = await db
					.select()
					.from(entry)
					.where(
						or(
							like(entry.word, `%${query}%`),
							like(entry.translation, `%${query}%`),
							like(entry.example, `%${query}%`),
							like(entry.notes, `%${query}%`),
							like(entry.partOfSpeech, `%${query}%`),
						),
					)
					.limit(limit)
					.offset(offset)
					.all();

				const enrichedEntries = await enrichEntriesWithRemoteData(
					entries,
					context,
				);

				// Get total count for pagination
				const totalResult = await db
					.select({ count: sql<number>`count(*)` })
					.from(entry)
					.where(
						or(
							like(entry.word, `%${query}%`),
							like(entry.translation, `%${query}%`),
							like(entry.example, `%${query}%`),
							like(entry.notes, `%${query}%`),
							like(entry.partOfSpeech, `%${query}%`),
						),
					)
					.get();

				return {
					entries: enrichedEntries,
					pagination: {
						total: totalResult?.count || 0,
						limit,
						offset,
						hasMore: offset + limit < (totalResult?.count || 0),
					},
				};
			}),
		getAll: publicProcedure.handler(async ({ context }) => {
			const entries = await db.select().from(entry).all();
			return enrichEntriesWithRemoteData(entries, context);
		}),
		getRandom: publicProcedure.handler(async ({ context }) => {
			const entries = await db
				.select()
				.from(entry)
				.orderBy(sql`RANDOM()`)
				.limit(1);
			return enrichEntriesWithRemoteData(entries, context);
		}),

		getById: publicProcedure
			.input(entryIdSchema)
			.handler(async ({ input: { id }, context }) => {
				const dbEntry = await db
					.select()
					.from(entry)
					.where(eq(entry.id, id))
					.get();

				if (!dbEntry) {
					return null;
				}

				const enrichedEntries = await enrichEntriesWithRemoteData(
					[dbEntry],
					context,
				);
				return enrichedEntries[0];
			}),

		getByDictionary: publicProcedure
			.input(entryByDictionarySchema)
			.handler(async ({ input: { dictionaryId }, context }) => {
				const entries = await db
					.select()
					.from(entry)
					.where(eq(entry.dictionaryId, dictionaryId))
					.all();

				return enrichEntriesWithRemoteData(entries, context);
			}),
		importFromJson: protectedProcedure
			.input(
				z.object({
					jsonData: z.unknown(), // Accept the raw JSON data
					dictionaryId: z.string().uuid(), // Validate dictionary ID
				}),
			)
			.handler(async ({ input: { jsonData, dictionaryId }, context }) => {
				try {
					// 1. Check User Permission
					let permissionCheckResult;
					try {
						permissionCheckResult = await auth.api.userHasPermission({
							body: {
								userId: context.session.user.id,
								permission: { entry: ["create"] },
							},
						});
					} catch (authError) {
						console.error("Permission check failed:", authError);
						// Throw a generic error if auth system fails, to avoid leaking auth details
						throw new ORPCError("INTERNAL_SERVER_ERROR");
					}

					if (!permissionCheckResult.success) {
						throw new ORPCError("FORBIDDEN");
					}

					// 2. Parse and Validate the input JSON
					let parsedJson: ImportJson;
					try {
						parsedJson = parseImportJson(jsonData);
					} catch (parseError) {
						console.error("JSON parsing/validation failed:", parseError);
						if (parseError instanceof z.ZodError) {
							// Provide specific Zod validation errors if available
							const errorMessages = parseError.errors
								.map((e) => `${e.path.join(".")}: ${e.message}`)
								.join(", ");
							throw new ORPCError("BAD_REQUEST");
						}
						// Fallback for other parsing errors
						throw new ORPCError("BAD_REQUEST");
					}

					// 3. Extract Vocabulary Entries
					const vocabularyEntries = extractVocabularyEntries(parsedJson);

					// Optional: Add a check for empty entries
					if (vocabularyEntries.length === 0) {
						throw new ORPCError("BAD_REQUEST");
					}

					// 4. Insert Entries into the Database
					let insertedCount = 0;
					for (const vocabEntry of vocabularyEntries) {
						try {
							const id = randomUUID();
							const timestamp = new Date();
							await db.insert(entry).values({
								id,
								dictionaryId,
								word: vocabEntry.word,
								pronunciation: vocabEntry.pronunciation ?? null, // Use null if pronunciation is undefined
								notes: `Extracted from page ${vocabEntry.page} of wordbook`, // Use the page number string from the key
								score: 0, // Default score
								createdAt: timestamp, // Set creation time
								updatedAt: timestamp, // Set update time initially
							});
							insertedCount++; // Increment counter on successful insert
						} catch (dbError) {
							console.error(
								`Database insert failed for word '${vocabEntry.word}' on page '${vocabEntry.page}':`,
								dbError,
							);
							// Decide whether to fail the whole operation or just log the error and continue
							// For now, re-throwing to stop the process and report the error
							throw new ORPCError("INTERNAL_SERVER_ERROR");
							// If you want to continue inserting other entries despite one failure, remove the throw and maybe add an error counter.
						}
					}

					console.log(
						`Successfully imported ${insertedCount} entries into dictionary ${dictionaryId}.`,
					);

					return {
						success: true,
						count: insertedCount, // Return the number of successfully inserted entries
						dictionaryId,
					};
				} catch (error) {
					// Catch any unexpected errors that might bubble up and wrap them
					console.error("Unexpected error in importFromJson handler:", error);
					// Avoid exposing internal error details
					throw new ORPCError("INTERNAL_SERVER_ERROR");
				}
			}), // Authenticated users can create entries
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
