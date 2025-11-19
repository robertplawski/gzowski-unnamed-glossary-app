import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  LucideArrowDown,
  LucideArrowUp,
  LucideBookA,
  LucideChevronDown,
  LucideChevronUp,
  LucideFlag,
  LucideMessageCircle,
  LucideSend,
  LucideSettings2,
  LucideVolume2,
} from "lucide-react";
import { useState } from "react";
import { orpc, queryClient } from "@/utils/orpc";
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

function CommentSection({ entry }: { entry: any }) {
  const navigate = useNavigate();
  const handleAuthRedirect = () => navigate({ to: "/login", throw: true });
  const [commentText, setCommentText] = useState("");

  const { data: comments, isLoading: commentsLoading } = useQuery(
    orpc.comment.getByEntry.queryOptions({ input: { entryId: entry.id } }),
  );

  const { mutate: addComment, isPending: isAddingComment } = useMutation(
    orpc.comment.create.mutationOptions({
      onSuccess: () => {
        setCommentText("");
        queryClient.invalidateQueries({
          queryKey: orpc.comment.getByEntry.queryOptions({
            input: { entryId: entry.id },
          }).queryKey,
        });
      },
      onError: (error) => {
        handleAuthRedirect(error);
      },
    }),
  );

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addComment({
        entryId: entry.id,
        text: commentText.trim(),
      });
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <form onSubmit={handleSubmitComment} className="flex gap-2">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[80px] flex-1 resize-none rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isAddingComment}
        />
        <Button
          type="submit"
          disabled={!commentText.trim() || isAddingComment}
          size="sm"
        >
          <LucideSend className="h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-3">
        {commentsLoading ? (
          <p className="text-muted-foreground text-sm">Loading comments...</p>
        ) : comments && comments.length > 0 ? (
          comments.map((comment: any) => (
            <div key={comment.id} className="rounded-lg border bg-muted/30 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {comment.user?.name || "Anonymous"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm">{comment.text}</p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}

function EntryInteractions({ entry }: { entry: any }) {
  const navigate = useNavigate();
  const handleAuthRedirect = () => navigate({ to: "/login", throw: true });
  const [showComments, setShowComments] = useState(false);

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
      onMutate: async ({ entryId, value }) => {
        await queryClient.cancelQueries({
          queryKey: orpc.entryVote.getVote.queryOptions({
            input: { entryId },
          }).queryKey,
        });

        const previousVote = queryClient.getQueryData(
          orpc.entryVote.getVote.queryOptions({
            input: { entryId },
          }).queryKey,
        );

        queryClient.setQueryData(
          orpc.entryVote.getVote.queryOptions({
            input: { entryId },
          }).queryKey,
          (old: any) => {
            if (!old) return old;
            const scoreDiff = value - (old.userVote || 0);
            return {
              ...old,
              userVote: value,
              totalScore: old.totalScore + scoreDiff,
            };
          },
        );

        return { previousVote, entryId };
      },
      onError: (error, variables, context) => {
        if (context?.previousVote) {
          queryClient.setQueryData(
            orpc.entryVote.getVote.queryOptions({
              input: { entryId: context.entryId },
            }).queryKey,
            context.previousVote,
          );
        }
        handleAuthRedirect(error);
      },
      onSettled: (data, error, variables) => {
        queryClient.invalidateQueries({
          queryKey: orpc.entryVote.getVote.queryOptions({
            input: { entryId: variables.entryId },
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: orpc.entry.getSortedByVotes.queryOptions().queryKey,
        });
      },
    }),
  );

  const { mutate: resetVote } = useMutation(
    orpc.entryVote.resetVote.mutationOptions({
      onMutate: async ({ entryId }) => {
        await queryClient.cancelQueries({
          queryKey: orpc.entryVote.getVote.queryOptions({
            input: { entryId },
          }).queryKey,
        });

        const previousVote = queryClient.getQueryData(
          orpc.entryVote.getVote.queryOptions({
            input: { entryId },
          }).queryKey,
        );

        queryClient.setQueryData(
          orpc.entryVote.getVote.queryOptions({
            input: { entryId },
          }).queryKey,
          (old: any) => {
            if (!old) return old;
            const scoreDiff = -(old.userVote || 0);
            return {
              ...old,
              userVote: 0,
              totalScore: old.totalScore + scoreDiff,
            };
          },
        );

        return { previousVote, entryId };
      },
      onError: (error, variables, context) => {
        if (context?.previousVote) {
          queryClient.setQueryData(
            orpc.entryVote.getVote.queryOptions({
              input: { entryId: context.entryId },
            }).queryKey,
            context.previousVote,
          );
        }
        handleAuthRedirect(error);
      },
      onSettled: (data, error, variables) => {
        queryClient.invalidateQueries({
          queryKey: orpc.entryVote.getVote.queryOptions({
            input: { entryId: variables.entryId },
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: orpc.entry.getSortedByVotes.queryOptions().queryKey,
        });
      },
    }),
  );

  if (commentsLoading || votesLoading || !votesData) {
    return (
      <CardFooter>
        <CardAction className="flex flex-row gap-2">
          <Button variant={"outline"}>
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
        </CardAction>
      </CardFooter>
    );
  }

  return (
    <>
      <CardFooter>
        <CardAction className="flex w-full flex-row flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant={votesData?.userVote > 0 ? "default" : "outline"}
              onClick={() =>
                votesData?.userVote > 0
                  ? resetVote({ entryId: entry.id })
                  : vote({ entryId: entry.id, value: 1 })
              }
              className="min-h-[48px] min-w-[48px]"
            >
              <LucideArrowUp />
            </Button>

            <p className="flex w-10 items-center justify-center">
              {votesData?.totalScore ?? 0}
            </p>
            <Button
              onClick={() =>
                votesData?.userVote < 0
                  ? resetVote({ entryId: entry.id })
                  : vote({ entryId: entry.id, value: -1 })
              }
              variant={votesData?.userVote < 0 ? "default" : "outline"}
              className="min-h-[48px] min-w-[48px]"
            >
              <LucideArrowDown />
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowComments(!showComments)}
              className="min-h-[48px] min-w-[48px]"
            >
              <LucideMessageCircle />
              <span className="ml-1 hidden md:inline">
                {comments?.length || 0} Comments
              </span>
              <span className="ml-1 inline md:hidden">
                {comments?.length || 0}
              </span>
              <span className="hidden md:inline">
                {showComments ? (
                  <LucideChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <LucideChevronDown className="ml-1 h-4 w-4" />
                )}
              </span>
            </Button>
          </div>

          <Button
            disabled={true}
            variant={"outline"}
            className="ml-auto min-h-[48px] min-w-[48px] md:ml-0"
          >
            <LucideBookA />

            <p className="ml-1 hidden md:inline">{entry.dictionary?.name}</p>
            <LucideSettings2 />
          </Button>
          <div className="mx-[-0.25rem] flex-1 md:flex-none" />
          <Button
            variant="outline"
            className="ml-auto min-h-[48px] min-w-[48px] md:ml-0"
          >
            <LucideFlag />
            <span className="ml-1 hidden md:inline">Report</span>
          </Button>
        </CardAction>
      </CardFooter>
      {showComments && (
        <div className="px-6 pb-6">
          <CommentSection entry={entry} />
        </div>
      )}
    </>
  );
}

function EntryPronunciation({
  entry,
  isMobile = false,
}: {
  entry: any;
  isMobile?: boolean;
}) {
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
      <span
        className={`text-muted-foreground ${isMobile ? "mt-1 block text-sm" : "ml-3 inline-block text-normal"}`}
      >
        /{entry.pronunciation}/
      </span>
    );
  }
  const {
    remoteDictionaryEntry: { phonetics },
  } = entry;

  return phonetics
    .sort(({ audio }: { audio?: string }) => (audio ? -1 : 1))
    .map(
      ({ text, audio }: { text?: string; audio?: string }, index: number) => (
        <span
          key={index}
          className={
            isMobile
              ? "mt-1 inline-flex min-h-[32px] items-center"
              : "inline-flex items-center"
          }
        >
          {audio && (
            <Button
              onClick={() => playAudio(audio)}
              size={isMobile ? "icon" : "sm"}
              variant="outline"
              className={`${isMobile ? "mr-2 h-6 w-6" : "ml-2"} min-h-[32px] min-w-[32px]`}
            >
              <LucideVolume2 className={isMobile ? "h-3 w-3" : ""} />
            </Button>
          )}
          {text && (
            <span
              className={`text-muted-foreground ${isMobile ? "mr-3 text-sm" : "ml-3 text-normal"}`}
            >
              {text}
            </span>
          )}
        </span>
      ),
    );
}

export function EntryCard({ entry }: { entry: any }) {
  const [showDefinitions, setShowDefinitions] = useState(false);

  return (
    <Card key={entry.id} className="w-full">
      <CardHeader>
        <CardTitle className="flex flex-col text-foreground md:flex-row md:items-center">
          <span className="text-2xl md:mr-2 md:text-2xl">{entry.word}</span>
          {/* Desktop pronunciation */}
          <div className="hidden md:flex">
            <EntryPronunciation entry={entry} />
          </div>
          {/* Mobile pronunciation */}
          <div className="flex md:hidden">
            <EntryPronunciation entry={entry} isMobile={true} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm md:text-base">
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
        {entry.remoteDictionaryEntry?.meanings ? (
          <Button
            variant={"outline"}
            onClick={() => setShowDefinitions((v) => !v)}
            className="min-h-[48px]"
          >
            {showDefinitions ? <ChevronUp /> : <ChevronDown />}
            <span>{showDefinitions ? "Hide" : "Show"} definition</span>
          </Button>
        ) : (
          <Button disabled className="min-h-[48px]">
            <AlertCircle /> Definition unavailable, look for comments
          </Button>
        )}
        {showDefinitions && entry.remoteDictionaryEntry && (
          <DictionaryEntry entry={entry} />
        )}
      </CardContent>
      <CardFooter>
        <div className="flex flex-row flex-wrap gap-1 text-muted-foreground text-xs md:text-sm">
          {entry.notes && <p>{entry.notes} | </p>}
          <p> Dictionary entry provided by</p>
          <a className="underline" href="https://dictionaryapi.dev">
            dictionaryapi.dev
          </a>{" "}
        </div>
      </CardFooter>
      <EntryInteractions entry={entry} />
    </Card>
  );
}
