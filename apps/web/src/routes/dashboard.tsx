import DictionaryAdminForm from "@/components/dictionary-form";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

function AdminAccessCheck({ children }: { children: React.ReactNode }) {
	const {
		data: hasPermission,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["admin-permission"],
		queryFn: async () => {
			const session = await authClient.getSession();
			if (!session.data?.user?.id) {
				return false;
			}

			const { data } = await authClient.admin.hasPermission({
				userId: session.data.user.id,
				permission: {
					dictionary: ["create", "update", "delete"],
					entry: ["update", "create", "delete"],
				},
			});
			if (!data || data.error || !data.success) {
				return false;
			}

			const { success: hasPermission } = data;

			return hasPermission;
		},
		retry: 0,
	});

	if (isLoading) {
		return (
			<div className="flex justify-center items-center">
				<Loader2 className="animate-spin" />
			</div>
		);
	}

	if (error || !hasPermission) {
		return (
			<div className="max-w-6xl mx-auto container p-4">
				<div className="grid gap-6 p-4 sm:p-8 md:p-24">
					<h1 className="text-4xl font-bold">403 - FORBIDDEN</h1>
					<p className="text-lg">You don't have privileges to view this page</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				throw: true,
			});
		}

		return { session };
	},
});

function RouteComponent() {
	return (
		<AdminAccessCheck>
			<DictionaryAdminForm />
		</AdminAccessCheck>
	);
}
