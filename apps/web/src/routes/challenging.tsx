import { EntryCard } from "@/components/entry-card";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/challenging")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data, isLoading, isRefetching, error } = useQuery({
		...orpc.entry.getSortedByVotes.queryOptions(),
	});

	return (
		<div className="max-w-6xl mx-auto container">
			<div className="grid gap-6 p-6 sm:p-12">
				<div className="flex flex-col gap-4">
					<h1 className="font-bold text-3xl text-foreground">
						Challenging words
					</h1>
					<p className="text-muted-foreground">
						The words deemed hardest to learn by the community
					</p>
				</div>
				{isLoading ? (
					<p>Loading entry...</p>
				) : error ? (
					<p>{error.message}</p>
				) : (
					<div className="flex flex-col w-full gap-4">
						{data?.map((entry) => (
							<EntryCard key={entry.id || entry.word} entry={entry} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
