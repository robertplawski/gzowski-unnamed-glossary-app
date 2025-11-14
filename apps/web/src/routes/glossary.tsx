import { Input } from "@/components/ui/input";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type SetStateAction, type Dispatch } from "react";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { EntryCard } from "@/components/entry-card";
import { Button } from "@/components/ui/button";
import { LucideArrowLeft, LucideArrowRight } from "lucide-react";

export const Route = createFileRoute("/glossary")({
  component: RouteComponent,
});

// Custom debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const usePagination = (PAGE_SIZE = 4) => {
  const [page, setPage] = useState(0);
  return {
    pageSize: PAGE_SIZE,
    limit: PAGE_SIZE,
    offset: PAGE_SIZE * page,
    page,
    setPage,
  };
};

function PaginationComponent({
  page,
  total,
  setPage,
}: {
  setPage: Dispatch<SetStateAction<number>>;
  total: number;
  page: number;
  pageSize: number;
}) {
  const maxButtonCount = 5;

  const startPage = Math.max(1, page + 1 - Math.floor(maxButtonCount / 2));
  const endPage = Math.min(total, startPage + maxButtonCount - 1);

  return (
    <div className="flex flex-row gap-2 items-center justify-center">
      <Button
        onClick={() => setPage((v) => Math.max(0, v - 1))}
        variant={"outline"}
        disabled={page === 0}
      >
        <LucideArrowLeft />
      </Button>

      {startPage > 1 && (
        <>
          <Button onClick={() => setPage(0)} variant={"outline"}>
            1
          </Button>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}

      {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
        const pageNum = startPage + i;
        return (
          <Button
            key={pageNum}
            onClick={() => setPage(pageNum - 1)}
            variant={pageNum === page + 1 ? "default" : "outline"}
          >
            {pageNum}
          </Button>
        );
      })}

      {endPage < total && (
        <>
          {endPage < total - 1 && <span className="px-2">...</span>}
          <Button onClick={() => setPage(total - 1)} variant={"outline"}>
            {total}
          </Button>
        </>
      )}

      <Button
        onClick={() => setPage((v) => Math.min(total - 1, v + 1))}
        variant={"outline"}
        disabled={page >= total - 1}
      >
        <LucideArrowRight />
      </Button>
    </div>
  );
}

// Main Route Component
function RouteComponent() {
  const { limit, offset, page, setPage, pageSize } = usePagination(10);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Search procedure
  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery({
    ...orpc.entry.search.queryOptions({
      input: {
        query: debouncedSearchTerm,
        limit,
        offset,
        includeFuzzy: true,
        includeSemantic: true,
      },
    }),
    enabled: debouncedSearchTerm.length > 0, // Only search when there's a query
  });

  // Fetch all entries when no search term (optional)
  const {
    data: getAllResults,
    isLoading: isLoadingAll,
    error: allEntriesError,
  } = useQuery({
    ...orpc.entry.getAll.queryOptions({
      input: {
        limit,
        offset,
      },
    }),
    enabled: debouncedSearchTerm.length === 0, // Only fetch all when no search
  });

  // Determine which data to display
  const displayData =
    debouncedSearchTerm.length > 0
      ? searchResults?.entries || []
      : getAllResults?.entries || [];

  const total =
    debouncedSearchTerm.length > 0
      ? Math.ceil(searchResults?.pagination.total / pageSize) || 0
      : Math.ceil(getAllResults?.pagination.total / pageSize) || 0;

  // Get search results with match information for enhanced display
  const searchResultsWithMatchInfo =
    debouncedSearchTerm.length > 0 ? searchResults : null;

  const displayIsLoading =
    debouncedSearchTerm.length > 0 ? isLoading : isLoadingAll;

  const displayError = debouncedSearchTerm.length > 0 ? error : allEntriesError;

  if (displayError) {
    return (
      <div className="max-w-6xl mx-auto container p-6 text-destructive">
        Error loading entries: {displayError.message}
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

        <PaginationComponent
          setPage={setPage}
          total={total}
          page={page}
          pageSize={pageSize}
        />
        {displayIsLoading ? (
          <p className="text-muted-foreground">
            {debouncedSearchTerm.length > 0
              ? "Searching..."
              : "Loading entries..."}
          </p>
        ) : (
          <div>
            <div className="grid gap-4">
              {displayData.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
            {debouncedSearchTerm.length > 0 && (
              <div className="text-sm text-muted-foreground mb-4 mt-4 space-y-1">
                <p>
                  Found {displayData.length} result(s)
                  {searchResults?.pagination &&
                    searchResults.pagination.total > displayData.length &&
                    ` out of ${searchResults.pagination.total}`}
                </p>
                {searchResults?.searchStats && (
                  <div className="text-xs opacity-75">
                    <p>
                      Average score: {searchResults.searchStats.averageScore}
                    </p>
                    {displayData.length > 0 && (
                      <p>
                        Match types:{" "}
                        {Object.entries(
                          searchResults.searchStats.matchTypeDistribution,
                        )
                          .map(([type, count]) => `${type} (${count})`)
                          .join(", ")}
                      </p>
                    )}
                    <p>
                      Search time: {searchResults.searchStats.executionTime}ms
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <PaginationComponent
          setPage={setPage}
          total={total}
          page={page}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
