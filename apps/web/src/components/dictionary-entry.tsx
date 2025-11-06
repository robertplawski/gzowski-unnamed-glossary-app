import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface DictionaryEntryProps {
	entry: any;
}

export function DictionaryEntry({ entry }: DictionaryEntryProps) {
	if (!entry?.remoteDictionaryEntry) {
		return null;
	}

	const data = entry.remoteDictionaryEntry;

	return (
		<>
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
								<p className="text-foreground mb-2">{definition.definition}</p>

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
                                                        <Link
                                                            key={synIndex}
                                                            to="/glossary"
                                                            search={{ query: synonym }}
                                                            className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 cursor-pointer transition-colors"
                                                            aria-label={`Search glossary for synonym ${synonym}`}
                                                        >
                                                            {synonym}
                                                        </Link>
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
			<div className="flex flex-row gap-2">
				{data.license && (
					<Button variant="outline" size="sm" asChild className="shrink-0">
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

				{data.sourceUrls?.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{data.sourceUrls.map((url: string, index: number) => (
							<Button key={url} variant="outline" size="sm" asChild>
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
				)}
			</div>
		</>
	);
}
