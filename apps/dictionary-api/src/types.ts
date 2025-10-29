export type DefinitionSource = {
	title: string;
	text: string;
	examples: string[];
	copyright?: string;
};

export type ScrapedData = {
	idiom: string;
	definitions: DefinitionSource[];
};
