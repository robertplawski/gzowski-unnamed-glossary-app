import { db } from "@gzowski-unnamed-glossary-app/db";
import { and, desc, eq, or } from "drizzle-orm";
import { protectedProcedure, publicProcedure } from "../index";
import { ORPCError, type RouterClient } from "@orpc/server";
import {
  comment,
  commentVote,
  entry,
} from "@gzowski-unnamed-glossary-app/db/schema/dictionary";
import z from "zod";
import { auth } from "@gzowski-unnamed-glossary-app/auth";
import { randomUUID } from "crypto";
import { user } from "@gzowski-unnamed-glossary-app/db/schema/auth";

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

const commentVoteDeleteSchema = z.object({
  commentId: z.string().uuid(),
});

const commentModerationSchema = z.object({
  id: z.string().uuid(),
  moderationStatus: z.enum(["verified", "rejected", "pending"]),
});

export const commentRouter = {
  comment: {
    getAll: publicProcedure.handler(async () => {
      return db
        .select()
        .from(comment)
        .leftJoin(entry, eq(comment.entryId, entry.id))
        .leftJoin(user, eq(comment.userId, user.id));
    }),
    getById: publicProcedure
      .input(commentIdSchema)
      .handler(async ({ input: { id } }) => {
        return db.select().from(comment).where(eq(comment.id, id)).get();
      }),

    getByEntry: protectedProcedure
      .input(commentsByEntrySchema)
      .handler(async ({ input: { entryId }, context }) => {
        const userId = context.session.user.id;

        return db
          .select({
            id: comment.id,
            text: comment.text,
            entryId: comment.entryId,
            userId: comment.userId,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            moderationStatus: comment.moderationStatus,
            user,
          })
          .from(comment)
          .leftJoin(user, eq(comment.userId, user.id))
          .where(
            and(
              eq(comment.entryId, entryId),
              or(
                eq(comment.userId, userId), // User's own comments
                eq(comment.moderationStatus, "verified"), // Verified comments from others
              ),
            ),
          )
          .orderBy(desc(comment.createdAt))
          .all();
      }),
    // Authenticated users can create comments
    create: protectedProcedure
      .input(commentCreateSchema)
      .handler(async ({ input: { entryId, text, image }, context }) => {
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
        const { success: hasPermission } = await auth.api.userHasPermission({
          body: {
            userId: context.session.user.id,
            permission: { comment: ["update"] },
          },
        });

        if (!hasPermission) {
          throw new ORPCError("FORBIDDEN");
        }

        const updates: Partial<typeof comment.$inferInsert> = {
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

    // Admin/moderator can moderate comments
    moderate: protectedProcedure
      .input(commentModerationSchema)
      .handler(async ({ input: { id, moderationStatus }, context }) => {
        // Check if user has permission to verify/reject comments
        const { success: hasPermission } = await auth.api.userHasPermission({
          body: {
            userId: context.session.user.id,
            permission: { comment: ["verify"] },
          },
        });

        if (!hasPermission) {
          throw new ORPCError("FORBIDDEN");
        }

        await db
          .update(comment)
          .set({ moderationStatus, updatedAt: new Date() })
          .where(eq(comment.id, id));
        return { success: true };
      }),
  },
};
export type CommentRouter = typeof commentRouter;
export type CommentRouterClient = RouterClient<typeof commentRouter>;
