import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

export default function DictionaryAdminForm() {
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState("dictionary");
	const [message, setMessage] = useState({ type: "", text: "" });

	// Fetch dictionaries for the entry form
	const { data: dictionaries = [] } = useQuery(
		orpc.dictionary.getAll.queryOptions(),
	);

	// Dictionary form state
	const [dictionaryForm, setDictionaryForm] = useState({
		name: "",
		description: "",
	});

	// Entry form state
	const [entryForm, setEntryForm] = useState({
		dictionaryId: "",
		word: "",
		translation: "",
		partOfSpeech: "",
		pronunciation: "",
		example: "",
		notes: "",
	});

	// Dictionary mutations
	const createDictionary = useMutation({
		...orpc.dictionary.create.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["dictionaries"] });
			setMessage({ type: "success", text: "Dictionary created successfully!" });
			setDictionaryForm({ name: "", description: "" });
		},
		onError: (error: any) => {
			setMessage({
				type: "error",
				text: error.message || "Failed to create dictionary",
			});
		},
	});

	// Entry mutations
	const createEntry = useMutation({
		...orpc.entry.create.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["entries"] });
			setMessage({ type: "success", text: "Entry created successfully!" });
			setEntryForm({
				dictionaryId: entryForm.dictionaryId,
				word: "",
				translation: "",
				partOfSpeech: "",
				pronunciation: "",
				example: "",
				notes: "",
			});
		},
		onError: (error: any) => {
			setMessage({
				type: "error",
				text: error.message || "Failed to create entry",
			});
		},
	});

	const handleDictionarySubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!dictionaryForm.name.trim()) {
			setMessage({ type: "error", text: "Dictionary name is required" });
			return;
		}
		createDictionary.mutate({
			name: dictionaryForm.name,
			description: dictionaryForm.description || undefined,
		});
	};

	const handleEntrySubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!entryForm.dictionaryId) {
			setMessage({ type: "error", text: "Please select a dictionary" });
			return;
		}
		if (!entryForm.word.trim()) {
			setMessage({ type: "error", text: "Word is required" });
			return;
		}
		createEntry.mutate({
			dictionaryId: entryForm.dictionaryId,
			word: entryForm.word,
			translation: entryForm.translation || undefined,
			partOfSpeech: entryForm.partOfSpeech || undefined,
			pronunciation: entryForm.pronunciation || undefined,
			example: entryForm.example || undefined,
			notes: entryForm.notes || undefined,
		});
	};

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			<div className="mb-6">
				<h1 className="text-3xl font-bold mb-2">Dictionary Administration</h1>
				<p className="text-gray-600">
					Create and manage dictionaries and entries
				</p>
			</div>

			{message.text && (
				<Alert
					className={`mb-6 ${message.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
				>
					<AlertDescription
						className={
							message.type === "success" ? "text-green-800" : "text-red-800"
						}
					>
						{message.text}
					</AlertDescription>
				</Alert>
			)}

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-2 mb-6">
					<TabsTrigger value="dictionary">Create Dictionary</TabsTrigger>
					<TabsTrigger value="entry">Add Entry/Word</TabsTrigger>
				</TabsList>

				<TabsContent value="dictionary">
					<Card>
						<CardHeader>
							<CardTitle>Create New Dictionary</CardTitle>
							<CardDescription>
								Add a new dictionary to organize your entries
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleDictionarySubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="dict-name">Dictionary Name *</Label>
									<Input
										id="dict-name"
										placeholder="e.g., English-Spanish, Technical Terms"
										value={dictionaryForm.name}
										onChange={(e) =>
											setDictionaryForm({
												...dictionaryForm,
												name: e.target.value,
											})
										}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="dict-description">Description</Label>
									<Textarea
										id="dict-description"
										placeholder="Optional description of this dictionary"
										value={dictionaryForm.description}
										onChange={(e) =>
											setDictionaryForm({
												...dictionaryForm,
												description: e.target.value,
											})
										}
										rows={3}
									/>
								</div>

								<Button
									type="submit"
									disabled={createDictionary.isPending}
									className="w-full"
								>
									{createDictionary.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Creating...
										</>
									) : (
										<>
											<Plus className="mr-2 h-4 w-4" />
											Create Dictionary
										</>
									)}
								</Button>
							</form>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="entry">
					<Card>
						<CardHeader>
							<CardTitle>Add New Entry/Word</CardTitle>
							<CardDescription>
								Add a new word or entry to your dictionary
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleEntrySubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="entry-dictionary">Select Dictionary *</Label>
									<Select
										value={entryForm.dictionaryId}
										onValueChange={(value) =>
											setEntryForm({ ...entryForm, dictionaryId: value })
										}
									>
										<SelectTrigger id="entry-dictionary">
											<SelectValue placeholder="Choose a dictionary" />
										</SelectTrigger>
										<SelectContent>
											{dictionaries.map((dict: any) => (
												<SelectItem key={dict.id} value={dict.id}>
													{dict.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="entry-word">Word *</Label>
										<Input
											id="entry-word"
											placeholder="e.g., hello, algorithm"
											value={entryForm.word}
											onChange={(e) =>
												setEntryForm({ ...entryForm, word: e.target.value })
											}
											required
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="entry-translation">Translation</Label>
										<Input
											id="entry-translation"
											placeholder="e.g., hola, algoritmo"
											value={entryForm.translation}
											onChange={(e) =>
												setEntryForm({
													...entryForm,
													translation: e.target.value,
												})
											}
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="entry-pos">Part of Speech</Label>
										<Input
											id="entry-pos"
											placeholder="e.g., noun, verb, adjective"
											value={entryForm.partOfSpeech}
											onChange={(e) =>
												setEntryForm({
													...entryForm,
													partOfSpeech: e.target.value,
												})
											}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="entry-pronunciation">Pronunciation</Label>
										<Input
											id="entry-pronunciation"
											placeholder="e.g., /həˈloʊ/, /ˈælɡəˌrɪðəm/"
											value={entryForm.pronunciation}
											onChange={(e) =>
												setEntryForm({
													...entryForm,
													pronunciation: e.target.value,
												})
											}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="entry-example">Example</Label>
									<Textarea
										id="entry-example"
										placeholder="Example sentence using this word"
										value={entryForm.example}
										onChange={(e) =>
											setEntryForm({ ...entryForm, example: e.target.value })
										}
										rows={2}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="entry-notes">Notes</Label>
									<Textarea
										id="entry-notes"
										placeholder="Additional notes or information"
										value={entryForm.notes}
										onChange={(e) =>
											setEntryForm({ ...entryForm, notes: e.target.value })
										}
										rows={3}
									/>
								</div>

								<Button
									type="submit"
									disabled={createEntry.isPending}
									className="w-full"
								>
									{createEntry.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Adding...
										</>
									) : (
										<>
											<Plus className="mr-2 h-4 w-4" />
											Add Entry
										</>
									)}
								</Button>
							</form>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
