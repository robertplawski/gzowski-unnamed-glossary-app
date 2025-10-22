import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

interface TooltipAbbrProps {
	abbr: string;
	definition: string;
}

const TooltipAbbr = ({abbr, definition}: TooltipAbbrProps) => {
	return (
		<span className="group text-primary relative inline-block">
			<abbr className="border-b-8 border-dotted border-foreground no-underline cursor-help">
				{abbr}
			</abbr>
			<span className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-neutral-800 px-2 py-1 text-sm text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
				{definition}
			</span>
		</span>
	);
};

function HomeComponent() {
	return (
		<div className="max-w-6xl mx-auto container">
			<div className="grid gap-8 p-8 sm:p-12 md:p-24">
				<h1 className="font-bold text-6xl sm:text-7xl md:text-8xl leading-20 sm:leading-26 md:leading-32">
					Stop{" "}
					<span className="group relative inline-block">
						<TooltipAbbr
							abbr=" ‘babbling’ "
							definition="verb. to speak without clarity, like an infant e.g. gaga guga"
						/>
					</span>{" "}
					in&nbsp;English with{" "}
					<TooltipAbbr
						abbr="GUGA"
						definition="abbr. Gzowski unnamed glossary app"
					/>
				</h1>
				<h2 className="text-2xl sm:text-3xl md:text-4xl leading-8 sm:leading-10 md:leading-16">
					Transform your vocabulary with GUGA – an app that makes remembering
					words effortless!
				</h2>
			</div>
		</div>
	);
}
