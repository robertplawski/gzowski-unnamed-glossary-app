import Header from "@/components/header";
import Loader from "@/components/loader";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { link, orpc } from "@/utils/orpc";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouterClient } from "@gzowski-unnamed-glossary-app/api/routers/index";
import { createORPCClient } from "@orpc/client";
import {
	HeadContent,
	Outlet,
	createRootRouteWithContext,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import "../index.css";
import Footer from "@/components/footer";
import MobileBottomNav from "@/components/mobile-bottom-nav";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	head: () => ({
		meta: [
			{
				title: "gzowski-unnamed-glossary-app",
			},
			{
				name: "description",
				content: "gzowski-unnamed-glossary-app is a web application",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

function NotFoundComponent() {
	return (
		<div className="max-w-6xl mx-auto container p-4">
			<div className="grid gap-6 p-4 sm:p-8 md:p-24">
				<h1 className="text-4xl font-bold">404 - Page Not Found</h1>
				<p className="text-lg">
					Sorry, the page you're looking for doesn't exist.
				</p>
			</div>
		</div>
	);
}
function RootComponent() {
	const isFetching = useRouterState({
		select: (s) => s.isLoading,
	});

	const [client] = useState<AppRouterClient>(() => createORPCClient(link));
	const [orpcUtils] = useState(() => createTanstackQueryUtils(client));

	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				<div className="grid grid-rows-[auto_1fr_auto] min-h-svh  ">
					<Header />
					<div className="pb-20 md:pb-0">
						{isFetching ? <Loader /> : <Outlet />}
					</div>
					<Footer />
					<MobileBottomNav />
				</div>
				<Toaster richColors />
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
		</>
	);
}
