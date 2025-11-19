import { checkRoutePermissions } from "@/components/hooks/useNavLinks";
import ModeratorForm from "@/components/moderator-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/moderation-dashboard")({
  component: RouteComponent,
  beforeLoad: checkRoutePermissions,
});

function RouteComponent() {
  return <ModeratorForm />;
}
