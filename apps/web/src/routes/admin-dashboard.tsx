import DictionaryAdminForm from "@/components/dictionary-form";
import { checkRoutePermissions } from "@/components/hooks/useNavLinks";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin-dashboard")({
	component: RouteComponent,
	beforeLoad: checkRoutePermissions,
});

function RouteComponent() {
	return <DictionaryAdminForm />;
}
