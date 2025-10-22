import { useState, useEffect } from "react";
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
import { Loader2, Plus, Trash2, Edit3 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

export default function DictionaryAdminForm() {
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState("dictionary");
	const [message, setMessage] = useState({ type: "", text: "" });

	// Fetch dictionaries for the entry form - Get the query options object
	const dictionaryQueryOptions = orpc.dictionary.getAll.queryOptions();
	const { data: dictionaries = [], isLoading: dictionariesLoading } = useQuery(
		dictionaryQueryOptions, // Use the options object directly
	);

	// Fetch entries for the edit entries tab - Get the query options object
	const entryQueryOptions = orpc.entry.getAll.queryOptions();
	const { data: entries = [], isLoading: entriesLoading } = useQuery(
		entryQueryOptions, // Use the options object directly
	);

	// Dictionary form state
	const [dictionaryForm, setDictionaryForm] = useState({
		id: "",
		name: "",
		description: "",
	});
	const [isEditingDictionary, setIsEditingDictionary] = useState(false);

	// Entry form state
	const [entryForm, setEntryForm] = useState({
		id: "",
		dictionaryId: "",
		word: "",
		translation: "",
		partOfSpeech: "",
		pronunciation: "",
		example: "",
		notes: "",
	});
	const [isEditingEntry, setIsEditingEntry] = useState(false);

	// Dictionary mutations
	const createDictionary = useMutation({
		...orpc.dictionary.create.mutationOptions(),
		onSuccess: () => {
			// Invalidate using the exact query key from the query options
			queryClient.invalidateQueries({
				queryKey: dictionaryQueryOptions.queryKey,
			});
			setMessage({ type: "success", text: "Dictionary created successfully!" });
			setDictionaryForm({ id: "", name: "", description: "" });
		},
		onError: (error: any) => {
			setMessage({
				type: "error",
				text: error.message || "Failed to create dictionary",
			});
		},
	});

	const updateDictionary = useMutation({
		...orpc.dictionary.update.mutationOptions(),
		onSuccess: () => {
			// Invalidate using the exact query key from the query options
			queryClient.invalidateQueries({
				queryKey: dictionaryQueryOptions.queryKey,
			});
			setMessage({ type: "success", text: "Dictionary updated successfully!" });
			setDictionaryForm({ id: "", name: "", description: "" });
			setIsEditingDictionary(false);
		},
		onError: (error: any) => {
			setMessage({
				type: "error",
				text: error.message || "Failed to update dictionary",
			});
		},
	});

	const deleteDictionary = useMutation({
		...orpc.dictionary.delete.mutationOptions(),
		onSuccess: () => {
			// Invalidate using the exact query key from the query options
			queryClient.invalidateQueries({
				queryKey: dictionaryQueryOptions.queryKey,
			});
			setMessage({ type: "success", text: "Dictionary deleted successfully!" });
		},
		onError: (error: any) => {
			setMessage({
				type: "error",
				text: error.message || "Failed to delete dictionary",
			});
		},
	});

	// Entry mutations
	const createEntry = useMutation({
		...orpc.entry.create.mutationOptions(),
		onSuccess: () => {
			// Invalidate using the exact query key from the query options
			queryClient.invalidateQueries({ queryKey: entryQueryOptions.queryKey });
			setMessage({ type: "success", text: "Entry created successfully!" });
			setEntryForm({
				id: "",
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

	const updateEntry = useMutation({
		...orpc.entry.update.mutationOptions(),
		onSuccess: () => {
			// Invalidate using the exact query key from the query options
			queryClient.invalidateQueries({ queryKey: entryQueryOptions.queryKey });
			setMessage({ type: "success", text: "Entry updated successfully!" });
			setEntryForm({
				id: "",
				dictionaryId: "",
				word: "",
				translation: "",
				partOfSpeech: "",
				pronunciation: "",
				example: "",
				notes: "",
			});
			setIsEditingEntry(false);
		},
		onError: (error: any) => {
			setMessage({
				type: "error",
				text: error.message || "Failed to update entry",
			});
		},
	});

	const deleteEntry = useMutation({
		...orpc.entry.delete.mutationOptions(),
		onSuccess: () => {
			// Invalidate using the exact query key from the query options
			queryClient.invalidateQueries({ queryKey: entryQueryOptions.queryKey });
			setMessage({ type: "success", text: "Entry deleted successfully!" });
		},
		onError: (error: any) => {
			setMessage({
				type: "error",
				text: error.message || "Failed to delete entry",
			});
		},
	});

	const handleDictionarySubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!dictionaryForm.name.trim()) {
			setMessage({ type: "error", text: "Dictionary name is required" });
			return;
		}

		if (isEditingDictionary && dictionaryForm.id) {
			updateDictionary.mutate({
				id: dictionaryForm.id,
				name: dictionaryForm.name,
				description: dictionaryForm.description || undefined,
			});
		} else {
			createDictionary.mutate({
				name: dictionaryForm.name,
				description: dictionaryForm.description || undefined,
			});
		}
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

		if (isEditingEntry && entryForm.id) {
			updateEntry.mutate({
				id: entryForm.id,
				dictionaryId: entryForm.dictionaryId,
				word: entryForm.word,
				translation: entryForm.translation || undefined,
				partOfSpeech: entryForm.partOfSpeech || undefined,
				pronunciation: entryForm.pronunciation || undefined,
				example: entryForm.example || undefined,
				notes: entryForm.notes || undefined,
			});
		} else {
			createEntry.mutate({
				dictionaryId: entryForm.dictionaryId,
				word: entryForm.word,
				translation: entryForm.translation || undefined,
				partOfSpeech: entryForm.partOfSpeech || undefined,
				pronunciation: entryForm.pronunciation || undefined,
				example: entryForm.example || undefined,
				notes: entryForm.notes || undefined,
			});
		}
	};

	const handleEditDictionary = (dict: any) => {
		setDictionaryForm({
			id: dict.id,
			name: dict.name,
			description: dict.description || "",
		});
		setIsEditingDictionary(true);
		setActiveTab("dictionary");
	};

	const handleDeleteDictionary = (id: string) => {
		if (
			window.confirm(
				"Are you sure you want to delete this dictionary? This will also delete all entries in this dictionary.",
			)
		) {
			deleteDictionary.mutate({ id });
		}
	};

	const handleEditEntry = (entry: any) => {
		setEntryForm({
			id: entry.id,
			dictionaryId: entry.dictionaryId,
			word: entry.word,
			translation: entry.translation || "",
			partOfSpeech: entry.partOfSpeech || "",
			pronunciation: entry.pronunciation || "",
			example: entry.example || "",
			notes: entry.notes || "",
		});
		setIsEditingEntry(true);
		setActiveTab("entry");
	};

	const handleDeleteEntry = (id: string) => {
		if (window.confirm("Are you sure you want to delete this entry?")) {
			deleteEntry.mutate({ id });
		}
	};

	const resetDictionaryForm = () => {
		setDictionaryForm({ id: "", name: "", description: "" });
		setIsEditingDictionary(false);
	};

	const resetEntryForm = () => {
		setEntryForm({
			id: "",
			dictionaryId: "",
			word: "",
			translation: "",
			partOfSpeech: "",
			pronunciation: "",
			example: "",
			notes: "",
		});
		setIsEditingEntry(false);
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
				<TabsList className="grid w-full grid-cols-4 mb-6">
					<TabsTrigger value="dictionary">Dictionaries</TabsTrigger>
					<TabsTrigger value="manage-dictionaries">
						Manage Dictionaries
					</TabsTrigger>
					<TabsTrigger value="entry">Entries</TabsTrigger>
					<TabsTrigger value="edit-entries">Manage Entries</TabsTrigger>
				</TabsList>

				<TabsContent value="dictionary">
					<Card>
						<CardHeader>
							<CardTitle>
								{isEditingDictionary
									? "Update Dictionary"
									: "Create New Dictionary"}
							</CardTitle>
							<CardDescription>
								{isEditingDictionary
									? "Update existing dictionary metadata"
									: "Add a new dictionary to organize your entries"}
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

								<div className="flex gap-2">
									<Button
										type="submit"
										disabled={
											createDictionary.isPending || updateDictionary.isPending
										}
										className="flex-1"
									>
										{createDictionary.isPending ||
										updateDictionary.isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												{isEditingDictionary ? "Updating..." : "Creating..."}
											</>
										) : (
											<>
												<Plus className="mr-2 h-4 w-4" />
												{isEditingDictionary
													? "Update Dictionary"
													: "Create Dictionary"}
											</>
										)}
									</Button>

									{isEditingDictionary && (
										<Button
											type="button"
											variant="outline"
											onClick={resetDictionaryForm}
											disabled={
												createDictionary.isPending || updateDictionary.isPending
											}
											className="flex-1"
										>
											Cancel
										</Button>
									)}
								</div>
							</form>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="manage-dictionaries">
					<Card>
						<CardHeader>
							<CardTitle>Manage Dictionaries</CardTitle>
							<CardDescription>
								View, edit, and delete existing dictionaries
							</CardDescription>
						</CardHeader>
						<CardContent>
							{dictionariesLoading ? (
								<div className="flex justify-center py-8">
									<Loader2 className="h-8 w-8 animate-spin" />
								</div>
							) : dictionaries.length === 0 ? (
								<p className="text-center text-gray-500 py-4">
									No dictionaries found
								</p>
							) : (
								<div className="space-y-4">
									{dictionaries.map((dict: any) => (
										<div
											key={dict.id}
											className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
										>
											<div>
												<h3 className="font-semibold">{dict.name}</h3>
												{dict.description && (
													<p className="text-sm text-gray-600 mt-1">
														{dict.description}
													</p>
												)}
												<p className="text-sm text-gray-500">
													{dict.entryCount || 0} entries
												</p>
											</div>
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleEditDictionary(dict)}
												>
													<Edit3 className="h-4 w-4 mr-2" />
													Edit
												</Button>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleDeleteDictionary(dict.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="entry">
					<Card>
						<CardHeader>
							<CardTitle>
								{isEditingEntry ? "Update Entry" : "Add New Entry/Word"}
							</CardTitle>
							<CardDescription>
								{isEditingEntry
									? "Update existing entry details"
									: "Add a new word or entry to your dictionary"}
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

								<div className="flex gap-2">
									<Button
										type="submit"
										disabled={createEntry.isPending || updateEntry.isPending}
										className="flex-1"
									>
										{createEntry.isPending || updateEntry.isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												{isEditingEntry ? "Updating..." : "Adding..."}
											</>
										) : (
											<>
												<Plus className="mr-2 h-4 w-4" />
												{isEditingEntry ? "Update Entry" : "Add Entry"}
											</>
										)}
									</Button>

									{isEditingEntry && (
										<Button
											type="button"
											variant="outline"
											onClick={resetEntryForm}
											disabled={createEntry.isPending || updateEntry.isPending}
											className="flex-1"
										>
											Cancel
										</Button>
									)}
								</div>
							</form>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="edit-entries">
					<Card>
						<CardHeader>
							<CardTitle>Manage Entries</CardTitle>
							<CardDescription>
								View, edit, and delete existing entries
							</CardDescription>
						</CardHeader>
						<CardContent>
							{entriesLoading ? (
								<div className="flex justify-center py-8">
									<Loader2 className="h-8 w-8 animate-spin" />
								</div>
							) : entries.length === 0 ? (
								<p className="text-center text-gray-500 py-4">
									No entries found
								</p>
							) : (
								<div className="space-y-4">
									{entries.map((entry: any) => {
										const dictionary = dictionaries.find(
											(d: any) => d.id === entry.dictionaryId,
										);
										return (
											<div
												key={entry.id}
												className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
											>
												<div>
													<h3 className="font-semibold">{entry.word}</h3>
													<p className="text-sm text-gray-600">
														{dictionary?.name || "Unknown Dictionary"} •{" "}
														{entry.partOfSpeech || "N/A"}
													</p>
													{entry.translation && (
														<p className="text-sm">
															Translation: {entry.translation}
														</p>
													)}
												</div>
												<div className="flex gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleEditEntry(entry)}
													>
														<Edit3 className="h-4 w-4 mr-2" />
														Edit
													</Button>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleDeleteEntry(entry.id)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
