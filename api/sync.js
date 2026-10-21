import { getDb, hasMongoConfig } from '../lib/mongodb.js';

/**
 * Bite POS — MongoDB sync API (Vercel serverless function).
 *
 *   GET  /api/sync            → current restaurant state
 *   POST /api/sync  { state } → upsert the latest state (per-collection replace)
 *   POST /api/sync  { queue } → legacy: acknowledge a pending action batch
 *
 * Collections: users, categories, kitchen_stations, inventory, menu, tables, invoices
 */

const COLLECTIONS = {
  users: 'users',
  categories: 'categories',
  kitchenStations: 'kitchen_stations',
  inventory: 'inventory',
  menu: 'menu',
  tables: 'tables',
  invoices: 'invoices'
};

function readBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (_) {
      return {};
    }
  }
  return body;
}

function toClientDoc(doc) {
  if (doc && doc.kind === 'scalar') return doc.value;
  const { _id, ...rest } = doc;
  return { id: rest.id ?? String(_id), ...rest };
}

async function readState(db) {
  const state = {};
  const counts = {};

  const entries = Object.entries(COLLECTIONS);
  const results = await Promise.all(
    entries.map(([, name]) => db.collection(name).find({}).toArray())
  );

  entries.forEach(([key], index) => {
    const docs = results[index].map(toClientDoc);
    state[key] = docs;
    counts[key] = docs.length;
  });

  const meta = await db.collection('meta').findOne({ _id: 'state' });
  return { state, counts, updatedAt: meta?.updatedAt || null };
}

async function writeCollection(db, name, items) {
  const collection = db.collection(name);
  const docs = [];

  items.forEach((item, index) => {
    if (item === undefined || item === null) return;
    if (typeof item === 'object') {
      const { _id, ...rest } = item;
      const key = rest.id !== undefined && rest.id !== null ? String(rest.id) : `idx_${index}`;
      docs.push({ ...rest, _id: key });
    } else {
      // Scalar lists (categories, kitchen stations) keep their plain string value.
      docs.push({ _id: String(item) || `idx_${index}`, value: item, kind: 'scalar' });
    }
  });

  if (docs.length) {
    await collection.bulkWrite(
      docs.map((doc) => ({
        replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true }
      })),
      { ordered: false }
    );
  }

  const keep = docs.map((doc) => doc._id);
  await collection.deleteMany(keep.length ? { _id: { $nin: keep } } : {});
  return docs.length;
}

async function writeState(db, state) {
  const counts = {};
  for (const [key, name] of Object.entries(COLLECTIONS)) {
    if (!Array.isArray(state[key])) continue;
    counts[key] = await writeCollection(db, name, state[key]);
  }

  if (Object.keys(counts).length) {
    await db.collection('meta').updateOne(
      { _id: 'state' },
      { $set: { updatedAt: new Date().toISOString(), counts } },
      { upsert: true }
    );
  }

  return counts;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!hasMongoConfig()) {
    res.status(503).json({
      ok: false,
      error: 'MONGODB_URI is not configured. Add it to .env.local or the hosting environment.'
    });
    return;
  }

  try {
    const db = await getDb();

    if (req.method === 'GET') {
      const payload = await readState(db);
      res.status(200).json({ ok: true, ...payload });
      return;
    }

    if (req.method === 'POST') {
      const body = readBody(req);

      // Acknowledge an offline action batch without mutating state.
      if (Array.isArray(body.queue) && !body.state) {
        res.status(200).json({ ok: true, accepted: body.queue.length, syncedAt: new Date().toISOString() });
        return;
      }

      const state = body.state || body;
      if (!state || typeof state !== 'object') {
        res.status(400).json({ ok: false, error: 'Expected a JSON body containing { state }.' });
        return;
      }

      const counts = await writeState(db, state);
      if (!Object.keys(counts).length) {
        res.status(400).json({ ok: false, error: 'No syncable collections were supplied.' });
        return;
      }

      res.status(200).json({ ok: true, saved: counts, syncedAt: new Date().toISOString() });
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ ok: false, error: 'Method not allowed. Use GET or POST.' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || 'Sync failed.' });
  }
}
