import type { User } from "@/db/schema";

export type Role = "ADMIN" | "BRAND" | "STREAMER";

export function can(user: User | null, ...roles: Role[]) {
  return !!user && roles.includes(user.role as Role);
}
export function isApproved(user: User | null) {
  return !!user && user.status === "APPROVED";
}
export function assertRole(user: User | null, ...roles: Role[]) {
  if (!user) throw new Error("É necessário iniciar sessão.");
  if (!roles.includes(user.role as Role)) throw new Error("Sem permissão para esta ação.");
  return user;
}
