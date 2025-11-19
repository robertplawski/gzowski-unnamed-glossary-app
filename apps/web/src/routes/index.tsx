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
			{/* HERO SECTION */}
			<div className="grid gap-8 p-8 sm:p-12 md:p-24">
				<h1 className="font-bold text-6xl sm:text-7xl md:text-8xl leading-20 sm:leading-26 md:leading-32">
					Stop{" "}
					<span className="group relative inline-block ">
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

			{/* SECTION 1 — What is GUGA */}
<section className="w-full py-24 px-6 md:px-16 bg-(--color-card) ">
	<div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

		{/* IMAGE LEFT */}
		<div className="rounded-3xl overflow-hidden bg-black/20 h-80 md:h-full">
			<img 
				src="photo1.jpg" 
				alt="" 
				className="w-full h-full object-cover opacity-80"
			/>
		</div>

		{/* TEXT RIGHT */}
		<div>
			<p className="text-blue-400 text-sm font-semibold tracking-wider uppercase">
				Overview
			</p>

			<h2 className="text-4xl lg:text-5xl font-bold mt-4">
				What is <span className="text-(--color-chart-1)">GUGA</span>?
			</h2>

			<p className="text-xl mt-6 leading-relaxed">
				GUGA is a modern glossary built for clarity and simplicity.
				No jargon, no confusion — just clean explanations that stick
				in your memory.
			</p>
		</div>
	</div>
</section>


{/* SECTION 2 — Who is it for? */}
<section className="w-full py-24 px-6 md:px-16 bg-(--color-border) ">
	<div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

		{/* TEXT LEFT */}
		<div className="order-2 md:order-1">
			<p className="text-blue-400 text-sm font-semibold tracking-wider uppercase">
				Audience
			</p>

			<h2 className="text-4xl lg:text-5xl font-bold mt-4">
				Who is GUGA for?
			</h2>

			<p className="text-xl  mt-6 leading-relaxed ">
				Designed for learners, students, and professionals who want
				to understand English terms quickly — and remember them.
			</p>

			<ul className="mt-6 space-y-3 text-lg ">
				<li>• language learners improving their fluency</li>
				<li>• students preparing for exams</li>
				<li>• professionals who need clarity</li>
				<li>• anyone who values simple, accurate definitions</li>
			</ul>
		</div>

		{/* IMAGE RIGHT */}
		<div className="order-1 md:order-2 rounded-3xl overflow-hidden bg-black/20 h-80 md:h-full">
			<img 
				src="photo2.jpg" 
				alt="" 
				className="w-full h-full object-cover opacity-80"
			/>
		</div>
	</div>
</section>


{/* SECTION 3 — Why use it */}
<section className="w-full py-24 px-6 md:px-16 bg-(--color-card)">
	<div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

		{/* IMAGE LEFT */}
		<div className="rounded-3xl overflow-hidden bg-black/20 h-80 md:h-full">
			<img 
				src="photo3.jpg" 
				alt="" 
				className="w-full h-full object-cover opacity-80"
			/>
		</div>

		{/* TEXT RIGHT */}
		<div>
			<p className="text-blue-400 text-sm font-semibold tracking-wider uppercase">
				Why GUGA
			</p>

			<h2 className="text-4xl lg:text-5xl font-bold mt-4">
				Why use GUGA?
			</h2>

			<p className="text-xl mt-6 leading-relaxed">
				Every definition in GUGA is crafted to be intuitive and easy
				to remember. No complexity — only clarity.
			</p>

			<ul className="mt-6 space-y-3 text-lg ">
				<li>• short, practical definitions</li>
				<li>• real-life usage examples</li>
				<li>• explanations that remove confusion</li>
				<li>• an interface made for ease of learning</li>
			</ul>
		</div>
	</div>
</section>


{/* SECTION 4 — About the authors */}
<section className="w-full py-24 px-6 md:px-16 bg-(--color-border)  ">
	<div className="max-w-7xl mx-auto gap-12 items-center">

		{/* TEXT LEFT */}
		<div className="order-2 md:order-1">
			<p className="text-blue-400 text-sm font-semibold tracking-wider uppercase">
				Authors
			</p>

			<h2 className="text-4xl lg:text-5xl font-bold mt-4">
				About the creators
			</h2>

			<p className="text-xl  mt-6 leading-relaxed">
				GUGA is built by students from Gzowski — developers and language
				enthusiasts who believe learning should be simple, intuitive, and
				enjoyable.
			</p>
		</div>
	</div>
</section>

		</div>
	);
}

export default HomeComponent;
