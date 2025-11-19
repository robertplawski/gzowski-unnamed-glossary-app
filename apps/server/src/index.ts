import { env } from "cloudflare:workers";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { createContext } from "@gzowski-unnamed-glossary-app/api/context";
import { appRouter } from "@gzowski-unnamed-glossary-app/api/routers/index";
import { auth } from "@gzowski-unnamed-glossary-app/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db } from "@gzowski-unnamed-glossary-app/db";
import { entry } from "@gzowski-unnamed-glossary-app/db/schema/dictionary";
import { or, like } from "drizzle-orm";
import { performEnhancedSearch, getSearchStats } from "@gzowski-unnamed-glossary-app/api/utils/search";

const app = new Hono();
const origins = [
	env.CORS_ORIGIN,
	"https://dev.gzowski-unnamed-glossary-app.pages.dev",
	".gzowski-unnamed-glossary-app.pages.dev",
].filter((v) => v) as string[];

app.use(logger());
app.use(
	"/*",
	cors({
		origin: (origin) => {
			if (origins.includes(origin)) return origin;
			if (origins.some((allowedOrigin) => origin.endsWith(allowedOrigin)))
				return origin;
		},
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

export const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

app.use("/*", async (c, next) => {
	const context = await createContext({ context: c });

	const rpcResult = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: context,
	});

	if (rpcResult.matched) {
		return c.newResponse(rpcResult.response.body, rpcResult.response);
	}

	const apiResult = await apiHandler.handle(c.req.raw, {
		prefix: "/api-reference",
		context: context,
	});

	if (apiResult.matched) {
		return c.newResponse(apiResult.response.body, apiResult.response);
	}

	await next();
});

app.get("/", (c) => {
    return c.text("OK");
});

// Glossary route: accepts ?q= or ?query= and returns sanitized search results
app.get("/glossary", async (c) => {
    const url = new URL(c.req.url);
    const params = url.searchParams;
    const rawQuery = params.get("query") ?? params.get("q");

    // Helper: safely decode and trim
    const normalize = (value: string | null | undefined): string => {
        if (!value) return "";
        try {
            value = decodeURIComponent(value);
        } catch {
            // ignore
        }
        return value.trim();
    };

    const query = normalize(rawQuery);

    // Optional parameters
    const limitParam = params.get("limit");
    const offsetParam = params.get("offset");
    const includeFuzzyParam = params.get("includeFuzzy");
    const includeSemanticParam = params.get("includeSemantic");

    const limit = Math.min(Math.max(parseInt(limitParam ?? "20", 10) || 20, 1), 100);
    const offset = Math.max(parseInt(offsetParam ?? "0", 10) || 0, 0);
    const includeFuzzy = includeFuzzyParam === null ? true : includeFuzzyParam === "true";
    const includeSemantic = includeSemanticParam === null ? true : includeSemanticParam === "true";

    // Handle empty or malformed params gracefully
    if (!query || query.length === 0) {
        return c.json({
            query: null,
            message: "Provide a search via ?q= or ?query=",
            entries: [],
            pagination: { total: 0, limit, offset, hasMore: false },
        });
    }

    // Broad match via LIKE across key fields
    const potentialMatches = await db
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
        .limit(limit * 3)
        .all();

    // Enhanced scoring & ranking
    const scored = await performEnhancedSearch(potentialMatches, query, {
        limit: limit * 2,
        offset: 0,
        includeFuzzy,
        includeSemantic,
    });

    const top = scored.slice(0, limit).map((r) => r.entry);
    const totalCount = scored.length;
    const stats = getSearchStats(scored);
    stats.queryLength = query.length;
    stats.executionTime = 0; // Computation cost minimal here; UI shows local time

    return c.json({
        query,
        entries: top,
        searchStats: stats,
        pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount,
        },
    });
});

if (env.NODE_ENV !== "production") {
	app.get("/cors", (c) => {
		return c.json({
			message: "sup",
			origins,
		});
	});
}

export default app;
