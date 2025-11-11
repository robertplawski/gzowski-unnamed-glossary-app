import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";
import { PermissionWrapper } from "./permission-wrapper";

export default function ModeratorForm() {
  const [searchUser, setSearchUser] = useState("");
  const [searchComment, setSearchComment] = useState("");
  const [userPage, setUserPage] = useState(0);
  const [commentPage, setCommentPage] = useState(0);
  const [usersPerPage] = useState(10);
  const [commentsPerPage] = useState(10);
  const [commentSortConfig, setCommentSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [moderationStatusFilter, setModerationStatusFilter] = useState<
    string | null
  >(null);
  const queryClient = useQueryClient();

  // Function to handle sorting
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      commentSortConfig &&
      commentSortConfig.key === key &&
      commentSortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setCommentSortConfig({ key, direction });
  };
  // Function to get sort icon based on current sort configuration
  const getSortIcon = (columnName: string) => {
    if (!commentSortConfig || commentSortConfig.key !== columnName) {
      return <ArrowUpDown className="ml-1 inline-block h-4 w-4" />;
    }
    return commentSortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 inline-block h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 inline-block h-4 w-4" />
    );
  };
  // Fetch all users (for client-side pagination)
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // Fetch all users for client-side pagination
      const { data } = await authClient.admin.listUsers({
        query: {
          limit: 1000, // Fetch a large number to get all users
          offset: 0,
        },
      });
      return data;
    },
  });

  // Filter users based on search term
  const filteredUsers =
    usersResponse?.users?.filter(
      (user: any) =>
        user.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchUser.toLowerCase()),
    ) || [];

  // Paginate filtered users
  const paginatedUsers = filteredUsers.slice(
    userPage * usersPerPage,
    (userPage + 1) * usersPerPage,
  );

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    ...orpc.comment.getAll.queryOptions(),
    queryKey: ["comments"],
  });

  // Filter comments based on search term and moderation status
  const filteredComments =
    commentsData?.filter(({ comment, user }: { comment: any; user: any }) => {
      // Apply search filter
      const matchesSearch =
        comment.text?.toLowerCase().includes(searchComment.toLowerCase()) ||
        user?.name?.toLowerCase().includes(searchComment.toLowerCase()) ||
        comment.moderationStatus
          ?.toLowerCase()
          .includes(searchComment.toLowerCase());

      // Apply moderation status filter
      const matchesStatus = moderationStatusFilter
        ? comment.moderationStatus === moderationStatusFilter
        : true;

      return matchesSearch && matchesStatus;
    }) || [];

  // Sort filtered comments
  const sortedComments = commentSortConfig
    ? [...filteredComments].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (commentSortConfig.key) {
        case "user":
          aValue = a.user?.name?.toLowerCase() || "";
          bValue = b.user?.name?.toLowerCase() || "";
          break;
        case "content":
          aValue = a.comment.text?.toLowerCase() || "";
          bValue = b.comment.text?.toLowerCase() || "";
          break;
        case "word":
          aValue = a.entry?.word?.toLowerCase() || "";
          bValue = b.entry?.word?.toLowerCase() || "";
          break;
        case "status":
          aValue = a.comment.moderationStatus?.toLowerCase() || "";
          bValue = b.comment.moderationStatus?.toLowerCase() || "";
          break;
        case "date":
          aValue = new Date(a.comment.createdAt).getTime() || 0;
          bValue = new Date(b.comment.createdAt).getTime() || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return commentSortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return commentSortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    })
    : filteredComments;

  // Paginate sorted comments
  const paginatedComments = sortedComments.slice(
    commentPage * commentsPerPage,
    (commentPage + 1) * commentsPerPage,
  );
  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      const session = await authClient.getSession();
      if (session.data?.user?.id === userId) {
        toast.error("You cannot ban/unban yourself.");
        return;
      }

      if (isBanned) {
        // Unban user
        await authClient.admin.unbanUser({
          userId,
        });
        toast.success("User unbanned");
      } else {
        // Ban user
        const banReason =
          prompt("Enter ban reason:", "The banhammer has spoken") ||
          "The banhammer has spoken";

        await authClient.admin.banUser({
          userId,
          banReason,
        });
        toast.success("User banned");
      }

      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment({ id: commentId });
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  // Reject comment
  const handleRejectComment = async (commentId: string) => {
    try {
      await moderate({
        id: commentId,
        moderationStatus: "rejected",
      });
      toast.success("Comment rejected");
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    } catch (error) {
      toast.error("Failed to reject comment");
    }
  };
  // Approve comment
  const handleApproveComment = async (commentId: string) => {
    try {
      await moderate({
        id: commentId,
        moderationStatus: "verified",
      });
      toast.success("Comment approved");
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    } catch (error) {
      toast.error("Failed to reject comment");
    }
  };
  const handleUserRoleChange = async (
    userId: string,
    newRole: "user" | "moderator" | "admin",
  ) => {
    try {
      // Update user role using better-auth admin plugin
      await authClient.admin.setRole({
        userId,
        role: newRole,
      });

      toast.success(`User role changed to ${newRole}`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      toast.error("Failed to change user role");
    }
  };
  const handleDeleteUser = async (userId: string) => {
    try {
      const session = await authClient.getSession();
      if (session.data?.user?.id === userId) {
        toast.error("You cannot delete yourself.");
        return;
      }

      if (
        confirm(
          "Are you sure you want to delete this user? This action cannot be undone.",
        )
      ) {
        await authClient.admin.removeUser({
          userId,
        });
        toast.success("User deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["users"] });
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const { mutateAsync: moderate } = useMutation(
    orpc.comment.moderate.mutationOptions(),
  );
  const { mutateAsync: deleteComment } = useMutation(
    orpc.comment.delete.mutationOptions(),
  );

  return (
    <div className="container px-4 py-4 sm:p-6 md:p-12 mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Moderator Dashboard</h1>
        <p className="text-sm sm:text-base">
          Manage users and moderate comments
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-2 mb-6 gap-1 h-auto">
          <TabsTrigger
            value="users"
            className="text-sm md:text-base px-2 py-1.5 md:py-2"
          >
            Manage Users
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="text-sm md:text-base px-2 py-1.5 md:py-2"
          >
            Moderate Comments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search users..."
                    className="max-w-sm"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                </div>
                <PermissionWrapper permissions={{ user: ["create"] }}>
                  <Button>Create User</Button>
                </PermissionWrapper>
              </div>
              {usersLoading ? (
                <div>Loading users...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers && paginatedUsers.length > 0 ? (
                        paginatedUsers.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.role || "user"}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  !user.banned ? "default" : "destructive"
                                }
                              >
                                {!user.banned ? "active" : "banned"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Edit User</DropdownMenuItem>
                                  <PermissionWrapper
                                    permissions={{ user: ["ban"] }}
                                  >
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleBanUser(
                                          user.id,
                                          user.banned ?? false,
                                        )
                                      }
                                    >
                                      {user.banned ? "Unban User" : "Ban User"}
                                    </DropdownMenuItem>
                                  </PermissionWrapper>
                                  <PermissionWrapper
                                    permissions={{ user: ["update"] }}
                                  >
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <DropdownMenuItem>
                                          Change Role
                                        </DropdownMenuItem>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleUserRoleChange(
                                              user.id,
                                              "admin",
                                            )
                                          }
                                        >
                                          Admin
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleUserRoleChange(
                                              user.id,
                                              "moderator",
                                            )
                                          }
                                        >
                                          Moderator
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleUserRoleChange(
                                              user.id,
                                              "user",
                                            )
                                          }
                                        >
                                          User
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </PermissionWrapper>
                                  <PermissionWrapper
                                    permissions={{ user: ["delete"] }}
                                  >
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteUser(user.id)}
                                    >
                                      Delete User
                                    </DropdownMenuItem>
                                  </PermissionWrapper>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-gray-500">
                      Showing {userPage * usersPerPage + 1} to{" "}
                      {Math.min(
                        (userPage + 1) * usersPerPage,
                        filteredUsers.length,
                      )}{" "}
                      of {filteredUsers.length} users
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserPage(Math.max(0, userPage - 1))}
                        disabled={userPage === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setUserPage(
                            (userPage + 1) * usersPerPage < filteredUsers.length
                              ? userPage + 1
                              : userPage,
                          )
                        }
                        disabled={
                          (userPage + 1) * usersPerPage >= filteredUsers.length
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Moderate Comments</CardTitle>
              <CardDescription>
                Review and moderate user comments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search comments..."
                    className="max-w-sm"
                    value={searchComment}
                    onChange={(e) => setSearchComment(e.target.value)}
                  />
                  <div className="flex items-center space-x-1">
                    <Button
                      variant={
                        moderationStatusFilter === null ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setModerationStatusFilter(null)}
                      className="flex items-center space-x-1"
                    >
                      <Filter className="h-4 w-4" />
                      <span>All</span>
                    </Button>
                    <Button
                      variant={
                        moderationStatusFilter === "verified"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setModerationStatusFilter("verified")}
                      className="flex items-center space-x-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Verified</span>
                    </Button>
                    <Button
                      variant={
                        moderationStatusFilter === "pending"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setModerationStatusFilter("pending")}
                      className="flex items-center space-x-1"
                    >
                      <Clock className="h-4 w-4" />
                      <span>Pending</span>
                    </Button>
                    <Button
                      variant={
                        moderationStatusFilter === "rejected"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setModerationStatusFilter("rejected")}
                      className="flex items-center space-x-1"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Rejected</span>
                    </Button>
                  </div>
                </div>
              </div>
              {commentsLoading ? (
                <div>Loading comments...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => requestSort("user")}
                        >
                          User {getSortIcon("user")}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => requestSort("content")}
                        >
                          Content {getSortIcon("content")}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => requestSort("word")}
                        >
                          Word {getSortIcon("word")}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => requestSort("status")}
                        >
                          Status {getSortIcon("status")}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => requestSort("date")}
                        >
                          Date {getSortIcon("date")}
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedComments && paginatedComments.length > 0 ? (
                        paginatedComments.map(
                          ({
                            comment,
                            entry,
                            user,
                          }: {
                            user: any;
                            comment: any;
                            entry: any;
                          }) => (
                            <TableRow key={comment.id}>
                              <TableCell>
                                {user?.name || "Unknown User"}
                              </TableCell>
                              <TableCell>{comment.text}</TableCell>
                              <TableCell>{entry?.word || "N/A"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {comment.moderationStatus}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {comment.createdAt
                                  ? new Date(
                                    comment.createdAt,
                                  ).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <PermissionWrapper
                                    permissions={{ comment: ["verify"] }}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleApproveComment(comment.id)
                                      }
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  </PermissionWrapper>
                                  <PermissionWrapper
                                    permissions={{ comment: ["verify"] }}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleRejectComment(comment.id)
                                      }
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </PermissionWrapper>
                                  <PermissionWrapper
                                    permissions={{ comment: ["delete"] }}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteComment(comment.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </PermissionWrapper>
                                </div>
                              </TableCell>
                            </TableRow>
                          ),
                        )
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No comments found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {/* Pagination Controls for Comments */}
                  <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-gray-500">
                      Showing {commentPage * commentsPerPage + 1} to{" "}
                      {Math.min(
                        (commentPage + 1) * commentsPerPage,
                        filteredComments.length,
                      )}{" "}
                      of {filteredComments.length} comments
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCommentPage(Math.max(0, commentPage - 1))
                        }
                        disabled={commentPage === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCommentPage(
                            (commentPage + 1) * commentsPerPage <
                              filteredComments.length
                              ? commentPage + 1
                              : commentPage,
                          )
                        }
                        disabled={
                          (commentPage + 1) * commentsPerPage >=
                          filteredComments.length
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
