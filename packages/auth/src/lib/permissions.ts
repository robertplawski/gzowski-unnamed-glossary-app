import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
	...defaultStatements,
	dictionary: ["create", "update", "delete"],
	entry: ["create", "update", "delete"],
	comment: ["create", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
	entry: ["create"],
	comment: ["create"],
});

export const moderator = ac.newRole({
	entry: ["create", "update", "delete"],
	comment: ["create", "update", "delete"],
	user: ["ban"],
});

export const admin = ac.newRole({
	...adminAc.statements,
	dictionary: ["create", "update", "delete"],
	entry: ["create", "update", "delete"],
	comment: ["create", "update", "delete"],
});
