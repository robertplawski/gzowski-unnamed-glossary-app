import { publicProcedure, protectedProcedure } from "../index";
import { eq } from "drizzle-orm";
import type { RouterClient } from "@orpc/server";
import { db } from "@gzowski-unnamed-glossary-app/db";
import { dictionary } from "@gzowski-unnamed-glossary-app/db/schema/dictionary";
import { z } from "zod";
import { randomUUID } from "crypto";

// Zod schemas
const dictionaryCreateSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
});

const dictionaryUpdateSchema = z.object({
	id: z.uuid(),
	name: z.string().min(1).optional(),
	description: z.string().optional(),
});

const dictionaryIdSchema = z.object({
	id: z.uuid(),
});

export const dictionaryRouter = {
	// Get all dictionaries (public)
	getAll: publicProcedure.handler(async () => {
		return db.select().from(dictionary).all();
	}),

	// Get dictionary by ID (public)
	getById: publicProcedure
		.input(dictionaryIdSchema)
		.handler(async ({ input: { id } }) => {
			return db.select().from(dictionary).where(eq(dictionary.id, id)).get();
		}),

	// Create a new dictionary (private)
	create: protectedProcedure
		.input(dictionaryCreateSchema)
		.handler(async ({ input: { name, description } }) => {
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

	// Update dictionary (private)
	update: protectedProcedure
		.input(dictionaryUpdateSchema)
		.handler(async ({ input: { id, name, description } }) => {
			await db
				.update(dictionary)
				.set({
					...(name !== undefined ? { name } : {}),
					...(description !== undefined
						? { description: description ?? null }
						: {}),
				})
				.where(eq(dictionary.id, id));
			return { success: true };
		}),

	// Delete dictionary (private)
	delete: protectedProcedure
		.input(dictionaryIdSchema)
		.handler(async ({ input: { id } }) => {
			await db.delete(dictionary).where(eq(dictionary.id, id));
			return { success: true };
		}),
};

export type DictionaryRouter = typeof dictionaryRouter;
export type DictionaryRouterClient = RouterClient<DictionaryRouter>;
