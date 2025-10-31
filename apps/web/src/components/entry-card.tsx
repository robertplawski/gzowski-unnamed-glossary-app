import { DictionaryEntry } from "./dictionary-entry";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function EntryCard({ entry }: { entry: any }) {
	if (entry.remoteDictionaryEntry) {
		return <DictionaryEntry entry={entry} />;
	}
	return (
		// Fallback to individual fields if no dictionary data
		<Card key={entry.id} className="w-full">
			<CardHeader>
				<CardTitle className="text-2xl text-foreground">{entry.word}</CardTitle>
				<div className="flex items-center gap-4 flex-wrap">
					<span className="text-lg text-muted-foreground font-mono">
						/{entry.pronunciation}/{" "}
					</span>
				</div>
			</CardHeader>
			<CardContent className="grid gap-4">
				{entry.translation && (
					<div>
						<h3 className="font-semibold text-foreground">Translation:</h3>
						<p className="text-foreground">{entry.translation}</p>
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
