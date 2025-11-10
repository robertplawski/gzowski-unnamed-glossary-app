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

if (env.NODE_ENV !== "production") {
	app.get("/cors", (c) => {
		return c.json({
			message: "sup",
			origins,
		});
	});
}

export default app;
