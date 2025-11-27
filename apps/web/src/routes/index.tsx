import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

interface TooltipAbbrProps {
	abbr: string;
	definition: string;
}

const TooltipAbbr = ({ abbr, definition }: TooltipAbbrProps) => {
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
						<p className="text-blue-400 text-sm text-primary font-semibold tracking-wider uppercase">
							Overview
						</p>

						<h2 className="text-4xl lg:text-5xl font-bold mt-4">
							What is <span className="text-(--color-chart-1)">GUGA</span>?
						</h2>

						<p className="text-xl mt-6 leading-relaxed">
							GUGA is a modern glossary built for clarity and simplicity. No
							jargon, no confusion — just clean explanations that stick in your
							memory.
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
							Designed for learners, students, and professionals who want to
							understand English terms quickly — and remember them.
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

			{/* SECTION — Testimonials */}
			<section className="w-full py-24 px-6 md:px-16 bg-(--color-card)">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<p className="text-primary text-sm font-semibold tracking-wider uppercase">
							Success Stories
						</p>
						<h2 className="text-4xl lg:text-5xl font-bold mt-4">
							What Learners <span className="text-primary">Say</span>
						</h2>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="bg-muted p-8 rounded-2xl border border-border hover:shadow-md transition-shadow">
							<div className="text-5xl text-primary/30 mb-4">"</div>
							<p className="text-lg italic text-foreground mb-6">
								"GUGA helped me increase my vocabulary retention by 70% in just
								two weeks. The simple definitions stick in my mind!"
							</p>
							<div>
								<div className="font-bold text-foreground">Sarah K.</div>
								<div className="text-muted-foreground">Language Learner</div>
							</div>
						</div>
						<div className="bg-muted p-8 rounded-2xl border border-border hover:shadow-md transition-shadow">
							<div className="text-5xl text-primary/30 mb-4">"</div>
							<p className="text-lg italic text-foreground mb-6">
								"As a non-native speaker preparing for IELTS, GUGA's clear
								explanations gave me confidence I never had with traditional
								dictionaries."
							</p>
							<div>
								<div className="font-bold text-foreground">Miguel R.</div>
								<div className="text-muted-foreground">Student</div>
							</div>
						</div>
						<div className="bg-muted p-8 rounded-2xl border border-border hover:shadow-md transition-shadow">
							<div className="text-5xl text-primary/30 mb-4">"</div>
							<p className="text-lg italic text-foreground mb-6">
								"Finally an app that explains technical terms in plain English!
								I use it daily for work and it's saved me countless hours."
							</p>
							<div>
								<div className="font-bold text-foreground">Dr. Aisha T.</div>
								<div className="text-muted-foreground">Medical Researcher</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* SECTION 3 — Why use it */}
			<section className="w-full py-24 px-6 md:px-16 bg-(--color-border) ">
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
							Every definition in GUGA is crafted to be intuitive and easy to
							remember. No complexity — only clarity.
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
			{/* SECTION — Statistics */}
			<section className="w-full py-24 px-6 md:px-16 bg-(--color-card)">
				<div className="max-w-7xl mx-auto text-center">
					<p className="text-primary text-sm font-semibold tracking-wider uppercase">
						By the Numbers
					</p>
					<h2 className="text-4xl lg:text-5xl font-bold mt-4">
						Impact in <span className="text-primary">Numbers</span>
					</h2>
					<p className="text-xl mt-6 leading-relaxed max-w-3xl mx-auto text-muted-foreground">
						Join thousands of learners who've transformed their vocabulary with
						GUGA's intuitive approach
					</p>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
						{/*<div className="p-6">
							<div className="text-5xl font-bold text-primary">200+</div>
							<div className="text-lg mt-2 text-muted-foreground">Users</div>
						</div>*/}
						<div className="p-6">
							<div className="text-5xl font-bold text-primary">2,000+</div>
							<div className="text-lg mt-2 text-muted-foreground">
								Dictionary entries
							</div>
						</div>

						<div className="p-6">
							<div className="text-5xl font-bold text-primary">94%</div>
							<div className="text-lg mt-2 text-muted-foreground">
								Retention Rate
							</div>
						</div>
						<div className="p-6">
							<div className="text-5xl font-bold text-primary">5,000+</div>
							<div className="text-lg mt-2 text-muted-foreground">
								Words Included
							</div>
						</div>
						<div className="p-6">
							<div className="text-5xl font-bold text-primary">4.9/5</div>
							<div className="text-lg mt-2 text-muted-foreground">
								User Satisfaction
							</div>
						</div>
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
			{/* SECTION — Open Source */}
			<section className="w-full py-24 px-6 md:px-16  bg-(--color-card)">
				<div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
					<div>
						<p className="text-primary text-sm font-semibold tracking-wider uppercase">
							Community Driven
						</p>

						<h2 className="text-4xl lg:text-5xl font-bold mt-4">
							Proudly <span className="text-primary">Open Source</span>
						</h2>

						<p className="text-xl mt-6 leading-relaxed text-muted-foreground">
							GUGA is built transparently with the community. Our code is
							publicly available on GitHub, and we welcome contributions from
							developers worldwide.
						</p>

						<p className="text-xl mt-4 leading-relaxed text-muted-foreground">
							Whether you're fixing a typo or adding a new feature, your
							contributions help make language learning better for everyone.
						</p>

						<div className="mt-8 flex flex-col sm:flex-row gap-4">
							<a
								href="https://github.com/gzowski/guga    "
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center px-6 py-3 bg-foreground text-background rounded-lg font-medium hover:bg-muted-foreground transition-colors"
							>
								<svg
									className="w-5 h-5 mr-2"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.56 22.092 24 17.595 24 12c0-6.627-5.373-12-12-12z" />
								</svg>
								View Repository
							</a>
							<a
								href="/contribute"
								className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
							>
								Contribute Now
							</a>
						</div>
					</div>
					<img
						src="/undraw_pair-programming.svg"
						alt="Pair programming together"
					/>
				</div>
			</section>
		</div>
	);
}

export default HomeComponent;
