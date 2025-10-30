import { DictionaryEntry } from '@/components/dictionary-entry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { orpc } from '@/utils/orpc';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/random')({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    refetch,
      data: allEntries,
      isLoading: isLoadingAll,
      error: allEntriesError,
    } = useQuery({
      ...orpc.entry.getRandom.queryOptions(),
    });
  
    // Determine which data to display
    const displayData = allEntries
  
    const displayIsLoading = isLoadingAll
  
return (
		<div className="max-w-6xl mx-auto container">
			<div className="grid gap-6 p-6 sm:p-12">
				<div className="flex flex-col gap-4">
					<h1 className="font-bold text-3xl text-foreground">
						Losowe Hadaly
					</h1>
					<p className="text-red-500">
						Słodka chwila pedofila
					</p>
          <button onClick={refetch}>Odświerz</button>
				</div>
        {
          (displayIsLoading && displayData && displayData?.length > 0) ? <p>Ładuje się</p> : <div className="grid gap-4">
							{displayData?.map((entry) => (
								<EntryCard key={entry.id || entry.word} entry={entry} />
							))}
						</div>
        }
				
			</div>
		</div>
	);
}
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
