import { MongoClient } from 'mongodb';

/**
 * Cached MongoDB connection for Vercel / serverless runtimes.
 *
 * Serverless functions are re-invoked in the same process, so the client is
 * stashed on globalThis during development (HMR) and reused across invocations.
 * MongoClient is safe to share because it manages its own connection pool.
 */

const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'bite_pos';

const options = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 10000,
  retryWrites: true
};

let cached = globalThis.__biteMongo;

if (!cached) {
  cached = globalThis.__biteMongo = { client: null, promise: null };
}

export function hasMongoConfig() {
  return Boolean(uri);
}

export function getMongoClient() {
  if (!uri) {
    return Promise.reject(new Error('MONGODB_URI is not configured. Add it to .env.local or the hosting environment.'));
  }
  if (cached.client) return Promise.resolve(cached.client);
  if (!cached.promise) {
    const client = new MongoClient(uri, options);
    cached.promise = client
      .connect()
      .then((connected) => {
        cached.client = connected;
        return connected;
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }
  return cached.promise;
}

export async function getDb(dbName = DB_NAME) {
  const client = await getMongoClient();
  return client.db(dbName);
}

export default getMongoClient;
