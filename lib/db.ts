import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}

if (!dbName) {
  throw new Error("MONGODB_DB is not defined");
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri);

const clientPromise = global._mongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== "production") {
  global._mongoClientPromise = clientPromise;
}

export async function getDb(): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}
