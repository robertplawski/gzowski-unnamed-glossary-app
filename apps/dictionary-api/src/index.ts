// index.ts
import { Hono } from "hono";
import { DefinitionSource, ScrapedData } from "./types";

// Define the Hono app with environment bindings type
const app = new Hono<{ Bindings: Env }>();

// Define the GET endpoint for scraping any idiom using standard Hono routing
app.get("/api/idiom/:idiom", async (c) => {
	const { idiom } = c.req.param(); // Get the idiom from the URL parameter
	// Replace hyphens with spaces for the URL
	const formattedIdiom = idiom.replace(/-/g, " ");
	const url = `https://idioms.thefreedictionary.com/${formattedIdiom}`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(
				`Failed to fetch page: ${response.status} ${response.statusText}`,
			);
		}

		const htmlContent = await response.text();

		// Use a simple string parsing approach as DOM manipulation libraries like jsdom are not available in standard Workers environments.
		const scrapedData = scrapeDefinitions(htmlContent, formattedIdiom);

		if (!scrapedData || scrapedData.definitions.length === 0) {
			return c.json(
				{ error: "Could not extract definitions from the page." },
				404,
			);
		}

		return c.json(scrapedData);
	} catch (error: any) {
		// Using 'any' type for error object to access properties like 'message'
		console.error("Scraping Error:", error);
		return c.json(
			{
				error: "An error occurred while fetching or scraping the page.",
				details: error.message,
			},
			500,
		);
	}
});

// Simple string-based scraping function
function scrapeDefinitions(html: string, idiom: string): ScrapedData | null {
	const definitions: DefinitionSource[] = [];
	const idiomTitle = idiom; // Use the formatted idiom title directly

	// Regex to find definition sections
	const sectionRegex =
		/<section[^>]*data-src="([^"]*)"[^>]*>[\s\S]*?<h2[^>]*>[\s\S]*?<\/h2>([\s\S]*?)<\/section>/g;
	let match;

	while ((match = sectionRegex.exec(html)) !== null) {
		const sourceKey = match[1];
		const sectionContent = match[2];

		// Extract the definition text (inside ds-single div)
		const textMatch =
			sectionContent.match(/<div class='ds-single'[^>]*>([\s\S]*?)<\/div>/) ||
			sectionContent.match(/<div class="ds-single"[^>]*>([\s\S]*?)<\/div>/);
		let definitionText = textMatch ? textMatch[1] : "";

		// Clean up the definition text by removing nested tags like <span class="illustration"> and <i>
		definitionText = definitionText
			.replace(/<span class="illustration"[^>]*>[\s\S]*?<\/span>/g, "")
			.replace(/<i[^>]*>[\s\S]*?<\/i>/g, "")
			.replace(/<[^>]+>/g, "") // Remove any remaining HTML tags
			.trim();

		// Extract examples (inside <span class="illustration"> tags)
		const examples: string[] = [];
		const exampleRegex = /<span class="illustration"[^>]*>([\s\S]*?)<\/span>/g;
		let exampleMatch;
		while ((exampleMatch = exampleRegex.exec(sectionContent)) !== null) {
			let example = exampleMatch[1].replace(/<[^>]+>/g, "").trim(); // Remove any tags inside example
			if (example) examples.push(example);
		}

		// Extract copyright info (inside div with class "cprh")
		const copyrightMatch = sectionContent.match(
			/<div class="cprh"[^>]*>([\s\S]*?)<\/div>/,
		);
		const copyright = copyrightMatch
			? copyrightMatch[1].replace(/<[^>]+>/g, "").trim()
			: undefined;

		if (definitionText) {
			// Attempt to get a source title from the key or a mapping
			let title = sourceKey;
			if (sourceKey === "FarlexIdi") title = "Farlex Dictionary of Idioms";
			else if (sourceKey === "MGH_Idi")
				title = "McGraw-Hill Dictionary of American Idioms";
			else if (sourceKey === "HM_Idi")
				title = "The American Heritage® Dictionary of Idioms";

			definitions.push({
				title,
				text: definitionText,
				examples,
				copyright,
			});
		}
	}

	// Handle the specific case for "Also, learn by rote" which might be in a different structure
	const alsoSectionMatch = html.match(/<section[^>]*>([\s\S]*?)<\/section>/g);
	if (alsoSectionMatch) {
		for (const section of alsoSectionMatch) {
			if (section.includes("Also, <b>learn by rote</b>")) {
				const textMatch = section.match(
					/<div class="ds-single"[^>]*>([\s\S]*?)<\/div>/,
				);
				if (textMatch) {
					const text = textMatch[1].replace(/<[^>]+>/g, "").trim();
					const copyrightMatch = section.match(
						/<div class="cprh"[^>]*>([\s\S]*?)<\/div>/,
					);
					const copyright = copyrightMatch
						? copyrightMatch[1].replace(/<[^>]+>/g, "").trim()
						: undefined;
					definitions.push({
						title: "The American Heritage® Dictionary of Idioms (Also Section)",
						text,
						examples: [],
						copyright,
					});
				}
			}
		}
	}

	if (definitions.length > 0) {
		return { idiom: idiomTitle, definitions };
	}

	return null;
}

// Export the Hono app
export default app;
