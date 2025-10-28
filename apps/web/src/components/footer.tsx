import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

export default function Footer() {
	const healthCheck = useQuery(orpc.healthCheck.queryOptions());
	return (
		<footer className="relative bottom-0 left-0 right-0 border-t bg-background p-2 text-xs">
			<div className="container mx-auto max-w-6xl">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-2">
					<div className="flex items-center gap-4">
						<span className="text-muted-foreground">
							© {new Date().getFullYear()} Gzowski Unnamed Glossary App / GUGA
						</span>
						<span className="hidden sm:inline text-muted-foreground">•</span>
						<span className="text-muted-foreground">
							Authors:{" "}
							<a
								href="https://eksabajt.pl"
								target="_blank"
								rel="noopener noreferrer"
								className="underline hover:text-foreground transition-colors"
							>
								eksabajt.pl
							</a>
						</span>
						<span className="hidden sm:inline text-muted-foreground">•</span>
						<span className="text-muted-foreground">
							<a
								href="https://github.com/robertplawski/gzowski-unnamed-glossary-app?tab=readme-ov-file"
								target="_blank"
								rel="noopener noreferrer"
								className="underline hover:text-foreground transition-colors"
							>
								Github
							</a>
						</span>
					</div>

					<Link to={import.meta.env.VITE_SERVER_URL + "/api-reference"}>
						<div className="flex items-center gap-2">
							<div
								className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
							>
								<div
									className={`h-2 w-2 animate-ping rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
								/>
							</div>
							<span className="text-muted-foreground">
								{healthCheck.isLoading
									? "API: Checking..."
									: healthCheck.data
										? "API: Connected"
										: "API: Disconnected"}
							</span>
						</div>
					</Link>
				</div>
			</div>
		</footer>
	);
}
