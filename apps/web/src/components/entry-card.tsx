import {
  LucideArrowDown,
  LucideArrowUp,
  LucideFlag,
  LucideMessageCircle,
  LucideVolume2,
  LucideSend,
  LucideChevronDown,
  LucideChevronUp,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  LucideCheck,
  LucideCross,
  LucideHourglass,
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc, queryClient } from "@/utils/orpc";
import { useNavigate } from "@tanstack/react-router";

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
    <div className="border-t pt-4 space-y-4">
      <form onSubmit={handleSubmitComment} className="flex gap-2">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 min-h-[80px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
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
            <div key={comment.id} className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">
                  {comment.user?.name || "Anonymous"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                {comment.moderationStatus === "verified" && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <LucideCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
                {comment.moderationStatus === "rejected" && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <LucideCross className="h-3 w-3" />
                    Rejected
                  </span>
                )}
                {comment.moderationStatus === "pending" && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <LucideHourglass className="h-3 w-3" />
                    Pending
                  </span>
                )}
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
            <LucideMessageCircle /> 0
            <span className="hidden sm:block">Comments</span>
          </Button>

          <Button variant="outline">
            <LucideFlag />
            <span className="hidden sm:block">Report</span>
          </Button>
        </CardAction>
      </CardFooter>
    );
  }

  return (
    <>
      <CardFooter>
        <CardAction className="flex items-center flex-row gap-2 w-full">
          <div className="flex items-center gap-2">
            <Button
              variant={votesData?.userVote > 0 ? "default" : "outline"}
              onClick={() =>
                votesData?.userVote > 0
                  ? resetVote({ entryId: entry.id })
                  : vote({ entryId: entry.id, value: 1 })
              }
              className="min-w-[48px] min-h-[48px]"
            >
              <LucideArrowUp />
            </Button>

            <p className="w-10 flex items-center justify-center">
              {votesData?.totalScore ?? 0}
            </p>
            <Button
              onClick={() =>
                votesData?.userVote < 0
                  ? resetVote({ entryId: entry.id })
                  : vote({ entryId: entry.id, value: -1 })
              }
              variant={votesData?.userVote < 0 ? "default" : "outline"}
              className="min-w-[48px] min-h-[48px]"
            >
              <LucideArrowDown />
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowComments(!showComments)}
              className="min-w-[48px] min-h-[48px]"
            >
              <LucideMessageCircle />
              <span className="md:inline hidden ml-1">
                {comments?.length || 0} Comments
              </span>
              <span className="md:hidden inline ml-1">
                {comments?.length || 0}
              </span>
              <span className="md:inline hidden">
                {showComments ? (
                  <LucideChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <LucideChevronDown className="ml-1 h-4 w-4" />
                )}
              </span>
            </Button>
          </div>

          <div className="flex-1" />
          <Button variant="outline">
            <LucideFlag />

            <span className="hidden sm:block">Report</span>
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
        className={`text-muted-foreground ${isMobile ? "text-sm block mt-1" : "text-normal ml-3 inline-block"}`}
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
              ? "inline-flex items-center mt-1 min-h-[32px]"
              : "inline-flex items-center"
          }
        >
          {audio && (
            <Button
              onClick={() => playAudio(audio)}
              size={isMobile ? "icon" : "sm"}
              variant="outline"
              className={`${isMobile ? "h-6 w-6 mr-2" : "ml-2"} min-h-[32px] min-w-[32px]`}
            >
              <LucideVolume2 className={isMobile ? "h-3 w-3" : ""} />
            </Button>
          )}
          {text && (
            <span
              className={`text-muted-foreground ${isMobile ? "text-sm mr-3" : "text-normal ml-3"}`}
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
        <CardTitle className="text-foreground flex flex-col md:flex-row md:items-center">
          <span className="text-2xl md:text-2xl md:mr-2">{entry.word}</span>
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
        <div className="flex flex-row flex-wrap gap-1 text-muted-foreground">
          {entry.notes && <p>{entry.notes} </p>}
        </div>
      </CardFooter>
      <EntryInteractions entry={entry} />
    </Card>
  );
}
