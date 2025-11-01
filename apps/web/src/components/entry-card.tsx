function EntryCard({ entry }: { entry: any }) {
	return (
		<Card key={entry.id}>
			<CardHeader>
				<CardTitle>{entry.word}</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-2">
				{/* Show the formatted dictionary entry */}
				<DictionaryEntry entry={entry} />

				{/* Keep the existing fields as fallback */}
				{entry.translation && !entry.remoteDictionaryEntry && (
					<div>
						<h3 className="font-semibold">Translation:</h3>
						<p>{entry.translation}</p>
					</div>
				)}

				{entry.pronunciation && !entry.remoteDictionaryEntry && (
					<div>
						<h3 className="font-semibold">Pronunciation:</h3>
						<p>/{entry.pronunciation}/ </p>
					</div>
				)}

				{entry.partOfSpeech && !entry.remoteDictionaryEntry && (
					<div>
						<h3 className="font-semibold">Part of Speech:</h3>
						<p>{entry.partOfSpeech}</p>
					</div>
				)}

				{entry.example && !entry.remoteDictionaryEntry && (
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
	);
}
