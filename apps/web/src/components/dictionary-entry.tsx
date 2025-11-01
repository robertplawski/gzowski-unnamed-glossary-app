import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { type DictionaryAPIResponse } from "@gzowski-unnamed-glossary-app/api/types/dictionaryApi";

interface DictionaryEntryProps {
	// Assuming 'entry' holds the full API response or a similar structure
	// Adjust the type if 'entry' is the full response object itself
	entry: {
		remoteDictionaryEntry?: DictionaryAPIResponse;
		// ... other properties if needed
	};
	// Or, if the component receives the API response directly:
	// entry: DictionaryAPIResponse;
}

export function DictionaryEntry({ entry }: DictionaryEntryProps) {
	// Adjust the path if 'entry' is the response object itself
	const data = entry.remoteDictionaryEntry;

	if (!data) {
		return null;
	}

	// The API response has an 'entries' array, which contains the detailed information per language/part-of-speech
	// This component iterates over the 'entries' array.
	return (
		<>
			{data.entries?.map((apiEntry, entryIndex) => (
				<div key={entryIndex} className="space-y-4">
					{/* Language Information */}
					<div className="flex items-center gap-3">
						<span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
							{apiEntry.language.name} ({apiEntry.language.code})
						</span>
						<span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
							{apiEntry.partOfSpeech}
						</span>
					</div>

					{/* Pronunciations */}
					{apiEntry.pronunciations && apiEntry.pronunciations.length > 0 && (
						<div className="pl-4 border-l-2 border-border">
							<p className="text-sm font-medium text-muted-foreground mb-1">
								Pronunciations:
							</p>
							<ul className="list-disc list-inside space-y-1 text-foreground">
								{apiEntry.pronunciations.map((pronunciation, pIndex) => (
									<li key={pIndex}>
										<span className="font-mono text-primary">
											[{pronunciation.text}]
										</span>
										{pronunciation.tags && pronunciation.tags.length > 0 && (
											<span className="text-xs text-muted-foreground ml-2">
												({pronunciation.tags.join(", ")})
											</span>
										)}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Forms */}
					{apiEntry.forms && apiEntry.forms.length > 0 && (
						<div className="pl-4 border-l-2 border-border">
							<p className="text-sm font-medium text-muted-foreground mb-1">
								Forms:
							</p>
							<ul className="list-disc list-inside space-y-1 text-foreground">
								{apiEntry.forms.map((form, fIndex) => (
									<li key={fIndex}>
										{form.word}
										{form.tags && form.tags.length > 0 && (
											<span className="text-xs text-muted-foreground ml-2">
												({form.tags.join(", ")})
											</span>
										)}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Senses (Definitions, Examples, Synonyms, Antonyms) */}
					<div className="space-y-3">
						{apiEntry.senses?.map((sense, senseIndex) => (
							<SenseItem key={senseIndex} sense={sense} />
						))}
					</div>

					{/* Entry-level Synonyms and Antonyms */}
					{(apiEntry.synonyms && apiEntry.synonyms.length > 0) ||
					(apiEntry.antonyms && apiEntry.antonyms.length > 0) ? (
						<div className="pl-4 border-l-2 border-border space-y-2">
							{apiEntry.synonyms && apiEntry.synonyms.length > 0 && (
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-green-600">
										Entry Synonyms:
									</span>
									<div className="flex flex-wrap gap-1">
										{apiEntry.synonyms.map((synonym, synIndex) => (
											<span
												key={synIndex}
												className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs dark:bg-green-900 dark:text-green-300"
											>
												{synonym}
											</span>
										))}
									</div>
								</div>
							)}
							{apiEntry.antonyms && apiEntry.antonyms.length > 0 && (
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-destructive">
										Entry Antonyms:
									</span>
									<div className="flex flex-wrap gap-1">
										{apiEntry.antonyms.map((antonym, antIndex) => (
											<span
												key={antIndex}
												className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs"
											>
												{antonym}
											</span>
										))}
									</div>
								</div>
							)}
						</div>
					) : null}
				</div>
			))}

			{/* Source and License Information */}
			{data.source && (
				<div className="flex flex-row gap-2 mt-4">
					<Button variant="outline" size="sm" asChild className="shrink-0">
						<a
							href={data.source.license.url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1"
						>
							<span className="text-xs">{data.source.license.name}</span>
							<ExternalLink className="h-3 w-3" />
						</a>
					</Button>
					<Button variant="outline" size="sm" asChild>
						<a
							href={data.source.url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 text-xs"
						>
							Source
							<ExternalLink className="h-3 w-3" />
						</a>
					</Button>
				</div>
			)}
		</>
	);
}

// Separate component for rendering a single Sense (definition block)
interface SenseItemProps {
	sense: DictionaryAPIResponse["entries"][number]["senses"][number];
}

function SenseItem({ sense }: SenseItemProps) {
	return (
		<div className="pl-4 border-l-2 border-border">
			<p className="text-foreground mb-2">{sense.definition}</p>

			{/* Tags */}
			{sense.tags && sense.tags.length > 0 && (
				<p className="text-xs text-muted-foreground mb-2">
					({sense.tags.join(", ")})
				</p>
			)}

			{/* Examples */}
			{sense.examples && sense.examples.length > 0 && (
				<div className="mb-2">
					{sense.examples.map((example, exIndex) => (
						<p key={exIndex} className="text-muted-foreground italic">
							"{example}"
						</p>
					))}
				</div>
			)}

			{/* Quotes */}
			{sense.quotes && sense.quotes.length > 0 && (
				<div className="mb-2">
					{sense.quotes.map((quote, qIndex) => (
						<div key={qIndex}>
							<p className="text-muted-foreground italic">"{quote.text}"</p>
							<p className="text-xs text-muted-foreground">
								{" "}
								- {quote.reference}
							</p>
						</div>
					))}
				</div>
			)}

			{/* Synonyms and Antonyms for this specific sense */}
			<div className="flex flex-wrap gap-2">
				{sense.synonyms && sense.synonyms.length > 0 && (
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-green-600">
							Synonyms:
						</span>
						<div className="flex flex-wrap gap-1">
							{sense.synonyms.map((synonym, synIndex) => (
								<span
									key={synIndex}
									className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs dark:bg-green-900 dark:text-green-300"
								>
									{synonym}
								</span>
							))}
						</div>
					</div>
				)}

				{sense.antonyms && sense.antonyms.length > 0 && (
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-destructive">
							Antonyms:
						</span>
						<div className="flex flex-wrap gap-1">
							{sense.antonyms.map((antonym, antIndex) => (
								<span
									key={antIndex}
									className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs"
								>
									{antonym}
								</span>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Translations for this specific sense (if present) */}
			{sense.translations && sense.translations.length > 0 && (
				<div className="mt-2">
					<p className="text-sm font-medium text-muted-foreground mb-1">
						Translations:
					</p>
					<ul className="list-disc list-inside space-y-1">
						{sense.translations.map((translation, tIndex) => (
							<li key={tIndex} className="text-foreground">
								<span className="font-medium">
									{translation.language.name}:
								</span>{" "}
								{translation.word}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Subsenses */}
			{sense.subsenses && sense.subsenses.length > 0 && (
				<div className="mt-3 space-y-2">
					{sense.subsenses.map((subSense, subIndex) => (
						<SenseItem key={subIndex} sense={subSense} />
					))}
				</div>
			)}
		</div>
	);
}
