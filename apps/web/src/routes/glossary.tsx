import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/glossary")({
	component: RouteComponent,
});

function RouteComponent() {
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredEntries, setFilteredEntries] = useState<any[]>([]); // Consider defining a proper type

	// Fetch all entries using the router
	const {
		data: allEntries,
		isLoading,
		error,
	} = useQuery(orpc.entry.getAll.queryOptions());

	// Filter entries based on search term
	useEffect(() => {
		if (allEntries && searchTerm) {
			const term = searchTerm.toLowerCase();
			const results = allEntries.filter(
				(entry) =>
					entry.word.toLowerCase().includes(term) ||
					(entry.translation &&
						entry.translation.toLowerCase().includes(term)) ||
					(entry.example && entry.example.toLowerCase().includes(term)) ||
					(entry.notes && entry.notes.toLowerCase().includes(term)),
			);
			setFilteredEntries(results);
		} else if (allEntries) {
			// Show all entries if search term is empty
			setFilteredEntries(allEntries);
		}
	}, [searchTerm, allEntries]);

	if (error) {
		return (
			<div className="max-w-6xl mx-auto container p-6">
				Error loading entries: {error.message}
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto container">
			<div className="grid gap-6 p-6 sm:p-12">
				<div className="flex flex-col gap-4">
					<h1 className="font-bold text-3xl ">Search words...</h1>
					<p>Enter you query in the field above.</p>
				</div>

				<Input
					placeholder="Type to search..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
				{isLoading ? (
					<p>Loading entries...</p>
				) : (
					<div>
						<div className="grid gap-4">
							{filteredEntries.map((entry) => (
								<Card key={entry.id}>
									<CardHeader>
										<CardTitle>{entry.word}</CardTitle>
									</CardHeader>
									<CardContent className="grid gap-2">
										{entry.translation && (
											<div>
												<h3 className="font-semibold">Translation:</h3>
												<p>{entry.translation}</p>
											</div>
										)}
										{entry.partOfSpeech && (
											<div>
												<h3 className="font-semibold">Part of Speech:</h3>
												<p>{entry.partOfSpeech}</p>
											</div>
										)}
										{entry.example && (
											<div>
												<h3 className="font-semibold">Example:</h3>
												<p>{entry.example}</p>
											</div>
										)}
										{entry.notes && (
											<div>
												<h3 className="font-semibold">Notes:</h3>
												<p>{entry.notes}</p>
											</div>
										)}
									</CardContent>
								</Card>
							))}
						</div>
						{searchTerm && (
							<p className="text-sm text-gray-500 mb-4">
								Found {filteredEntries.length} result(s)
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
