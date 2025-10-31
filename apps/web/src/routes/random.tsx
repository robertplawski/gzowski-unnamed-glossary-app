import { EntryCard } from "@/components/entry-card";
import { Clover, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/random")({
	component: RouteComponent,
});

function RouteComponent() {
	const { refetch, data, isLoading, isRefetching, error } = useQuery({
		...orpc.entry.getRandom.queryOptions(),
	});

	return (
		<div className="max-w-6xl mx-auto container">
			<div className="grid gap-6 p-6 sm:p-12">
				<div className="flex flex-col gap-4">
					<h1 className="font-bold text-3xl text-foreground">
						Random words...
					</h1>
					<p className="text-foreground-muted">Learn new random words</p>
					<Button
						disabled={isLoading || isRefetching}
						className="my-2 flexflex-row items-center justify-center"
						variant="secondary"
						onClick={() => refetch()}
					>
						{!(isLoading || isRefetching) ? (
							<>
								<Clover />
								I'm feeling lucky
							</>
						) : (
							<>
								<Loader2 className="animate-spin" /> Loading...
							</>
						)}
					</Button>
				</div>
				{isLoading || isRefetching ? (
					<p>Loading entry</p>
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
