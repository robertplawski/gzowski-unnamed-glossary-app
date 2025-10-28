import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { Volume2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/glossary")({
	component: RouteComponent,
});

// Dictionary Entry Component
interface DictionaryEntryProps {
	entry: any;
}

function DictionaryEntry({ entry }: DictionaryEntryProps) {
	const [activeAudio, setActiveAudio] = useState<string | null>(null);

	const playAudio = (audioUrl: string) => {
		setActiveAudio(audioUrl);
		const audio = new Audio(audioUrl);
		audio.play().finally(() => setActiveAudio(null));
	};

	if (!entry?.remoteDictionaryEntry) {
		return null;
	}

	const data = entry.remoteDictionaryEntry;

	return (
		<Card className="w-full">
			<CardHeader className="pb-4">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="text-3xl font-bold text-foreground mb-2">
							{data.word}
						</CardTitle>
						<div className="flex items-center gap-4 flex-wrap">
							<span className="text-lg text-muted-foreground font-mono">
								{data.phonetic}
							</span>
							{data.phonetics?.map((phonetic: any, index: number) => (
								<div key={index} className="flex items-center gap-2">
									{phonetic.audio && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => playAudio(phonetic.audio)}
											disabled={activeAudio === phonetic.audio}
											className="h-8 w-8 p-0"
										>
											<Volume2 className="h-4 w-4" />
										</Button>
									)}
									{phonetic.text && (
										<span className="text-sm text-muted-foreground font-mono">
											{phonetic.text}
										</span>
									)}
								</div>
							))}
						</div>
					</div>
					{data.license && (
						<Button variant="ghost" size="sm" asChild className="shrink-0">
							<a
								href={data.license.url}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1"
							>
								<span className="text-xs">{data.license.name}</span>
								<ExternalLink className="h-3 w-3" />
							</a>
						</Button>
					)}
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				{data.meanings?.map((meaning: any, meaningIndex: number) => (
					<div key={meaningIndex} className="space-y-4">
						<div className="flex items-center gap-3">
							<span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
								{meaning.partOfSpeech}
							</span>
						</div>

						<div className="space-y-3">
							{meaning.definitions?.map((definition: any, defIndex: number) => (
								<div key={defIndex} className="pl-4 border-l-2 border-border">
									<p className="text-foreground mb-2">
										{definition.definition}
									</p>

									{definition.example && (
										<p className="text-muted-foreground italic mb-2">
											"{definition.example}"
										</p>
									)}

									<div className="flex flex-wrap gap-2">
										{definition.synonyms?.length > 0 && (
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-green-600">
													Synonyms:
												</span>
												<div className="flex flex-wrap gap-1">
													{definition.synonyms.map(
														(synonym: string, synIndex: number) => (
															<span
																key={synIndex}
																className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs dark:bg-green-900 dark:text-green-300"
															>
																{synonym}
															</span>
														),
													)}
												</div>
											</div>
										)}

										{definition.antonyms?.length > 0 && (
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-destructive">
													Antonyms:
												</span>
												<div className="flex flex-wrap gap-1">
													{definition.antonyms.map(
														(antonym: string, antIndex: number) => (
															<span
																key={antIndex}
																className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs"
															>
																{antonym}
															</span>
														),
													)}
												</div>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				))}

				{data.sourceUrls?.length > 0 && (
					<div className="pt-4 border-t border-border">
						<p className="text-sm font-medium text-foreground mb-2">Sources:</p>
						<div className="flex flex-wrap gap-2">
							{data.sourceUrls.map((url: string, index: number) => (
								<Button key={index} variant="outline" size="sm" asChild>
									<a
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1 text-xs"
									>
										Source {index + 1}
										<ExternalLink className="h-3 w-3" />
									</a>
								</Button>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// Updated EntryCard Component
function EntryCard({ entry }: { entry: any }) {
	if (entry.remoteDictionaryEntry) {
		return <DictionaryEntry entry={entry} />;
	}
	return (
		// Fallback to individual fields if no dictionary data
		<Card key={entry.id} className="w-full">
			<CardHeader>
				<CardTitle className="text-2xl text-foreground">{entry.word}</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4">
				{entry.translation && (
					<div>
						<h3 className="font-semibold text-foreground">Translation:</h3>
						<p className="text-foreground">{entry.translation}</p>
					</div>
				)}

				{entry.pronunciation && (
					<div>
						<h3 className="font-semibold text-foreground">Pronunciation:</h3>
						<p className="text-muted-foreground font-mono">
							/{entry.pronunciation}/{" "}
						</p>
					</div>
				)}
				{entry.partOfSpeech && (
					<div>
						<h3 className="font-semibold text-foreground">Part of Speech:</h3>
						<p className="text-foreground">{entry.partOfSpeech}</p>
					</div>
				)}
				{entry.example && (
					<div>
						<h3 className="font-semibold text-foreground">Example:</h3>
						<p className="text-muted-foreground italic">{entry.example}</p>
					</div>
				)}
				{entry.notes && (
					<div>
						<h3 className="font-semibold text-foreground">Notes:</h3>
						<p className="text-foreground">{entry.notes}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// Main Route Component
function RouteComponent() {
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredEntries, setFilteredEntries] = useState<any[]>([]);

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
			<div className="max-w-6xl mx-auto container p-6 text-destructive">
				Error loading entries: {error.message}
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
				{isLoading ? (
					<p className="text-muted-foreground">Loading entries...</p>
				) : (
					<div>
						<div className="grid gap-4">
							{filteredEntries.map((entry) => (
								<EntryCard key={entry.id || entry.word} entry={entry} />
							))}
						</div>
						{searchTerm && (
							<p className="text-sm text-muted-foreground mb-4 mt-4">
								Found {filteredEntries.length} result(s)
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
