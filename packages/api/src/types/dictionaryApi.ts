import { z } from "zod";

// Define the Zod schema for the Free Dictionary API response
// Handles the recursive 'subsenses' field within 'Sense' correctly using z.lazy

const SenseSchema: z.ZodSchema<any> = z.lazy(() =>
	z.object({
		definition: z.string(),
		tags: z.array(z.string()),
		examples: z.array(z.string()),
		quotes: z.array(
			z.object({
				text: z.string(),
				reference: z.string(),
			}),
		),
		synonyms: z.array(z.string()),
		antonyms: z.array(z.string()),
		translations: z
			.array(
				z.object({
					language: z.object({
						code: z.string(),
						name: z.string(),
					}),
					word: z.string(),
				}),
			)
			.optional(),
		subsenses: z.array(SenseSchema), // Recursive reference
	}),
);

export const DictionaryAPIResponseSchema = z.object({
	word: z.string(),
	entries: z.array(
		z.object({
			language: z.object({
				code: z.string(),
				name: z.string(),
			}),
			partOfSpeech: z.string(),
			pronunciations: z.array(
				z.object({
					type: z.enum(["ipa", "enpr"]), // Based on OpenAPI spec
					text: z.string(),
					tags: z.array(z.string()),
				}),
			),
			forms: z.array(
				z.object({
					word: z.string(),
					tags: z.array(z.string()),
				}),
			),
			senses: z.array(SenseSchema), // Uses the recursive SenseSchema
			synonyms: z.array(z.string()),
			antonyms: z.array(z.string()),
		}),
	),
	source: z.object({
		url: z.string(), // URL string as returned by the API
		license: z.object({
			name: z.string(),
			url: z.string(), // URL string for the license
		}),
	}),
});

// Type inference
export type DictionaryAPIResponse = z.infer<typeof DictionaryAPIResponseSchema>;
