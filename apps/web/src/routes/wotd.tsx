import { EntryCard } from "@/components/entry-card";
import { Clover, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/wotd")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data, isLoading, isRefetching, error } = useQuery({
		...orpc.entry.getDaily.queryOptions(),
	});

	return (
		<div className="max-w-6xl mx-auto container">
			<div className="grid gap-6 p-6 sm:p-12">
				<div className="flex flex-col gap-4">
					<h1 className="font-bold text-3xl text-foreground">
						GUGA Word of the day
					</h1>
					<p className="text-muted-foreground">Start your day with new word</p>
				</div>
				{isLoading || isRefetching ? (
					<p>Loading entry...</p>
				) : error ? (
					<p>{error.message}</p>
				) : (
					<div className="flex flex-col w-full">
						{data?.map((entry) => (
							<EntryCard key={entry.id || entry.word} entry={entry} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
