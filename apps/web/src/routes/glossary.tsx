import { Input } from "@/components/ui/input";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { EntryCard } from "@/components/entry-card";

export const Route = createFileRoute("/glossary")({
	component: RouteComponent,
});

// Custom debounce hook
function useDebounce(value: string, delay: number) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

// Main Route Component
function RouteComponent() {
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearchTerm = useDebounce(searchTerm, 300);

	// Use the search procedure for server-side searching
	const {
		data: searchResults,
		isLoading,
		error,
	} = useQuery({
		...orpc.entry.search.queryOptions({
			input: {
				query: debouncedSearchTerm,
				limit: 50,
				offset: 0,
			},
		}),
		enabled: debouncedSearchTerm.length > 0, // Only search when there's a query
	});

	// Fetch all entries when no search term (optional - you might want to remove this)
	const {
		data: allEntries,
		isLoading: isLoadingAll,
		error: allEntriesError,
	} = useQuery({
		...orpc.entry.getAll.queryOptions(),
		enabled: debouncedSearchTerm.length === 0, // Only fetch all when no search
	});

	// Determine which data to display
	const displayData =
		debouncedSearchTerm.length > 0
			? searchResults?.entries || []
			: allEntries || [];

	const displayIsLoading =
		debouncedSearchTerm.length > 0 ? isLoading : isLoadingAll;

	const displayError = debouncedSearchTerm.length > 0 ? error : allEntriesError;

	if (displayError) {
		return (
			<div className="max-w-6xl mx-auto container p-6 text-destructive">
				Error loading entries: {displayError.message}
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto container">
			<div className="grid gap-6 p-6 sm:p-12">
				<div className="flex flex-col gap-4">
					<h1 className="font-bold text-3xl text-foreground">
						Search words...
					</h1>
					<p className="text-muted-foreground">
						Enter your query in the field above.
					</p>
				</div>

				<Input
					placeholder="Type to search..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="bg-background"
				/>

				{displayIsLoading ? (
					<p className="text-muted-foreground">
						{debouncedSearchTerm.length > 0
							? "Searching..."
							: "Loading entries..."}
					</p>
				) : (
					<div>
						<div className="grid gap-4">
							{displayData.map((entry) => (
								<EntryCard key={entry.id} entry={entry} />
							))}
						</div>
						{debouncedSearchTerm.length > 0 && (
							<p className="text-sm text-muted-foreground mb-4 mt-4">
								Found {displayData.length} result(s)
								{searchResults?.pagination &&
									searchResults.pagination.total > displayData.length &&
									` out of ${searchResults.pagination.total}`}
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
