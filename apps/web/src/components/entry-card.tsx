import { LucideVolume2 } from "lucide-react";

import { DictionaryEntry } from "./dictionary-entry";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { useState } from "react";

function EntryPronunciation({ entry }: { entry: any }) {
	// Create a audio context please to be sure that only one audio can play at a time
	const [activeAudio, setActiveAudio] = useState<string | null>(null);

	const playAudio = (audioUrl: string) => {
		if (activeAudio) {
			return;
		}
		setActiveAudio(audioUrl);
		const audio = new Audio(audioUrl);
		audio.play().finally(() => setActiveAudio(null));
	};

	if (!(entry.remoteDictionaryEntry && entry.remoteDictionaryEntry.phonetics)) {
		return (
			<span className="text-muted-foreground text-normal ml-3">
				/{entry.pronunciation}/
			</span>
		);
	}
	const {
		remoteDictionaryEntry: { phonetics },
	} = entry;

	/*TODO PLEASE ADD A SOURCE URL REF HERE */

	return phonetics
		.sort(({ audio }: { audio?: string }) => (audio ? -1 : 1))
		.map(({ text, audio }: { text?: string; audio?: string }) => (
			<>
				{audio && (
					<Button
						onClick={() => playAudio(audio)}
						size={"sm"}
						variant="outline"
						className="ml-2"
					>
						<LucideVolume2 />
					</Button>
				)}
				{text && (
					<span className="text-muted-foreground text-normal ml-3">{text}</span>
				)}
			</>
		));
}

export function EntryCard({ entry }: { entry: any }) {
	return (
		<Card key={entry.id} className="w-full">
			<CardHeader>
				<CardTitle className="text-2xl text-foreground">
					<span className="mr-2">{entry.word}</span>
					<EntryPronunciation entry={entry} />
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4">
				{entry.translation && (
					<div>
						<h3 className="font-semibold text-foreground">
							Automatic translation:
						</h3>
						<p className="text-foreground">
							{[
								entry.translation.translatedText,
								...entry.translation.alternatives,
							]
								.map((v: string) => v)
								.join(", ")}
						</p>
					</div>
				)}

				{entry.example && (
					<div>
						<h3 className="font-semibold text-foreground">Example:</h3>
						<p className="text-muted-foreground italic">{entry.example}</p>
					</div>
				)}

				{entry.remoteDictionaryEntry && <DictionaryEntry entry={entry} />}
			</CardContent>
			<CardFooter>
				<div className="flex flex-row flex-wrap gap-1 text-muted-foreground">
					{entry.notes && <p>{entry.notes} | </p>}
					<p> Dictionary entry provided by</p>
					<a className="underline" href="https://dictionaryapi.dev">
						dictionaryapi.dev
					</a>{" "}
					<p>| If you can afford it, please donate.</p>
				</div>
			</CardFooter>
		</Card>
	);
}
