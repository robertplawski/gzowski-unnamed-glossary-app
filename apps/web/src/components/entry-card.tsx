import {
	LucideArrowDown,
	LucideArrowUp,
	LucideCloud,
	LucideFlag,
	LucideMessageCircle,
	LucideVolume2,
} from "lucide-react";
import { DictionaryEntry } from "./dictionary-entry";
import { Button } from "./ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

// make entry context please
//
function EntryInteractions({ entry }: { entry: any }) {
	const queryClient = useQueryClient();
	const { data: comments, isLoading: commentsLoading } = useQuery(
		orpc.comment.getByEntry.queryOptions({ input: { entryId: entry.id } }),
	);

	const { data: votesData, isLoading: votesLoading } = useQuery(
		orpc.entryVote.getVote.queryOptions({
			input: { entryId: entry.id },
		}),
	);

	const { mutate: vote } = useMutation(
		orpc.entryVote.vote.mutationOptions({
			onSuccess: () => {
				// Invalidate the vote query to refetch the data
				queryClient.invalidateQueries({
					queryKey: orpc.entryVote.getVote.queryOptions({
						input: { entryId: entry.id },
					}).queryKey,
				});
			},
		}),
	);
	const { mutate: resetVote } = useMutation(
		orpc.entryVote.resetVote.mutationOptions({
			onSuccess: () => {
				// Invalidate the vote query to refetch the data
				queryClient.invalidateQueries({
					queryKey: orpc.entryVote.getVote.queryOptions({
						input: { entryId: entry.id },
					}).queryKey,
				});
			},
		}),
	);

	if (commentsLoading || votesLoading || !votesData) {
		return (
			<CardFooter>
				<CardAction className="flex flex-row gap-2">
					<Button variant={"ghost"}>
						<LucideArrowUp />
					</Button>

					<Button variant="ghost">0</Button>
					<Button variant="outline">
						<LucideArrowDown />
					</Button>
					<Button variant="outline">
						<LucideMessageCircle /> 0 Comments
					</Button>

					<Button variant="outline">
						<LucideFlag />
						Report
					</Button>
				</CardAction>{" "}
			</CardFooter>
		);
	}
	return (
		<CardFooter>
			<CardAction className="flex items-center flex-row gap-2">
				<Button
					variant={votesData?.userVote > 0 ? "default" : "outline"}
					onClick={() =>
						votesData?.userVote > 0
							? resetVote({ entryId: entry.id })
							: vote({ entryId: entry.id, value: 1 })
					}
				>
					<LucideArrowUp />
				</Button>

				<Button variant="ghost">{votesData?.entryScore ?? -1}</Button>
				<Button
					onClick={() =>
						votesData?.userVote < 0
							? resetVote({ entryId: entry.id })
							: vote({ entryId: entry.id, value: -1 })
					}
					variant={votesData?.userVote < 0 ? "default" : "outline"}
				>
					<LucideArrowDown />
				</Button>
				<Button variant="outline">
					<LucideMessageCircle /> {comments?.length} Comments
				</Button>

				<div className="flex-1" />
				<Button variant="outline">
					<LucideFlag />
					Report
				</Button>
			</CardAction>{" "}
		</CardFooter>
	);
}

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
						<h3 className="font-semibold text-foreground">Translation:</h3>
						<p className="text-foreground">{entry.translation}</p>
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
					<p> | Translation provided by</p>
					<a className="underline" href="https://libretranslate.com">
						libretranslate.com
					</a>{" "}
					<p>If you can afford it, please donate to these awesome projects.</p>
				</div>
			</CardFooter>
			<EntryInteractions entry={entry} />
		</Card>
	);
}
