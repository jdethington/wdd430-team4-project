// createUsers()
// findUserByEmail()
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";

export type UserRole = "user" | "admin";
export type UserStatus =
  "active" | "password_reset" | "inactive" | "banned" | "deleted"; // | "paused";

export interface User {
  _id?: ObjectId;
  name: string;
  email: string; // unique, lowercase
  hashedPassword: string;
  role: UserRole; // default: "user"
  status: UserStatus; // default: "active"
  createdAt: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
  deletedAt?: Date;
  deletedBy?: string; // admin or user who deleted the account
}

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: user._id!.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

const getUsersCollection = async () => {
  const db = await getDb();

  const users = db.collection<User>("users");

  // Make email unique so duplicate accounts cannot be created.
  await users.createIndex({ email: 1 }, { unique: true });

  return users;
};

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await getUsersCollection();

  return users.findOne({
    email: email.toLowerCase(),
  });
}

export async function findUserById(id: string): Promise<User | null> {
  if (!ObjectId.isValid(id)) return null;

  const users = await getUsersCollection();
  return users.findOne({
    _id: new ObjectId(id),
  });
}

export async function createUser(
  name: string,
  email: string,
  hashedPassword: string,
): Promise<User> {
  const users = await getUsersCollection();

  const user: User = {
    name,
    email: email.toLowerCase(),
    hashedPassword,
    role: "user",
    status: "active",
    createdAt: new Date(),
  };

  const result = await users.insertOne(user);

  return {
    ...user,
    _id: result.insertedId,
  };
}

export async function updateUser(
  id: string,
  patch: Partial<
    Pick<
      User,
      | "name"
      | "email"
      | "hashedPassword"
      | "role"
      | "status"
      | "lastLoginAt"
      | "deletedAt"
      | "deletedBy"
    >
  >,
): Promise<User | null> {
  if (!ObjectId.isValid(id)) return null;
  const users = await getUsersCollection();
  const result = await users.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result;
}

export async function softDeleteUser(
  id: string,
  deletedBy: string,
): Promise<User | null> {
  return updateUser(id, {
    status: "deleted",
    deletedAt: new Date(),
    deletedBy,
  });
}

export async function setUserStatus(
  id: string,
  status: UserStatus,
): Promise<User | null> {
  const patch: Partial<User> = { status };
  if (status !== "deleted") {
    // clear soft-delete metadata when restoring-like statuses
    return updateUser(id, {
      ...patch,
      deletedAt: undefined,
      deletedBy: undefined,
    });
  }
  return updateUser(id, patch);
}

export async function countAdmins(): Promise<number> {
  const users = await getUsersCollection();
  return users.countDocuments({ role: "admin", status: { $nin: ["deleted"] } });
}

export type ListUsersParams = {
  q?: string; // search query for name or email
  includeDeleted?: boolean; // include deleted users in the list
  limit?: number; // limit the number of users returned
  skip?: number; // skip the first n users
  // sortBy?: "name" | "email" | "createdAt" | "updatedAt"; // sort by field
  // sortOrder?: "asc" | "desc"; // sort order
};

export async function listUsers(
  params: ListUsersParams = {},
): Promise<{ users: PublicUser[]; total: number }> {
  const users = await getUsersCollection();
  const limit = Math.min(params.limit ?? 50, 100); // max 100
  const skip = params.skip ?? 0;

  const filter: Record<string, unknown> = {};
  if (!params.includeDeleted) {
    filter.status = { $ne: "deleted" };
  }
  if (params.q) {
    const q = params.q.trim();
    filter.$or = [
      { email: { $regex: q, $options: "i" } },
      { name: { $regex: q, $options: "i" } },
    ];
  }

  const [docs, total] = await Promise.all([
    users
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    users.countDocuments(filter),
  ]);
  return {
    users: docs.filter((u) => u._id).map(toPublicUser),
    total,
  };
}

export function canLogin(status: UserStatus): boolean {
  return status === "active" || status === "password_reset";
}
