import { publicProcedure, protectedProcedure } from "../index";
import { eq } from "drizzle-orm";
import { ORPCError, type RouterClient } from "@orpc/server";
import { db } from "@gzowski-unnamed-glossary-app/db";
import { dictionary } from "@gzowski-unnamed-glossary-app/db/schema/dictionary";
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

				const updates: Record<string, string | Date> = {
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
};

export type DictionaryRouter = typeof dictionaryRouter;
export type DictionaryRouterClient = RouterClient<DictionaryRouter>;
