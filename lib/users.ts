// createUsers()
// findUserByEmail()
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  hashedPassword: string;
  createdAt: Date;
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
    createdAt: new Date(),
  };

  const result = await users.insertOne(user);

  return {
    ...user,
    _id: result.insertedId,
  };
}
