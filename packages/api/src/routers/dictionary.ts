import { publicProcedure, protectedProcedure } from "../index";
import { eq, or, sql, like, desc } from "drizzle-orm";
import { ORPCError, type RouterClient } from "@orpc/server";
import { db } from "@gzowski-unnamed-glossary-app/db";

import {
	dictionary,
	entry,
	entryVote,
} from "@gzowski-unnamed-glossary-app/db/schema/dictionary";
import { auth } from "@gzowski-unnamed-glossary-app/auth";
import { z } from "zod";
import { randomUUID } from "crypto";

// Helper function to get remote dictionary entry
async function getRemoteDictionaryEntry(word: string, context: any) {
	try {
		// Check cache first
		const cachedData = await context.env.WORD_CACHE.get(word);
		if (cachedData) {
			return JSON.parse(cachedData);
		}

		// Fetch from API if not in cache
		const response = await fetch(
			`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
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
		const dictionaryData = await response.json();
		const remoteData = dictionaryData[0];

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
		getSortedByVotes: publicProcedure.handler(async ({ context }) => {
			// Get entries with vote counts using a join
			const entriesWithVoteCounts = await db
				.select({
					entry: entry,
					voteCount: sql<number>`SUM(${entryVote.value})`.as("voteCount"),
				})
				.from(entry)
				.leftJoin(entryVote, eq(entry.id, entryVote.entryId))
				.groupBy(entry.id)
				.orderBy(desc(sql`voteCount`))
				.all();

			// Extract just the entries for enrichment
			const entries = entriesWithVoteCounts.map((row) => row.entry);
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
};

export type DictionaryRouter = typeof dictionaryRouter;
export type DictionaryRouterClient = RouterClient<DictionaryRouter>;
