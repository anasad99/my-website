const fs = require('fs');
const { ensureDataFile } = require('./storage-paths');

// Upstash Redis, connected via Vercel's Storage tab ("Marketplace Database
// Providers" > Upstash), has a free tier (10k commands/day, 256MB) that's
// far more than a personal portfolio's admin panel needs. Vercel injects
// KV_REST_API_URL / KV_REST_API_TOKEN automatically once it's linked to the
// project; UPSTASH_REDIS_REST_URL / _TOKEN are the raw Upstash names, kept
// as a fallback in case you connect it a different way.
const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const IS_CONFIGURED = Boolean(REST_URL && REST_TOKEN);

let redis = null;
if (IS_CONFIGURED) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({ url: REST_URL, token: REST_TOKEN });
} else {
  console.warn(
    'No Redis storage configured (KV_REST_API_URL/TOKEN) — falling back to a local JSON file. ' +
    'On Vercel, anything written here will NOT survive a redeploy or cold start. See .env.example.'
  );
}

// One store per JSON "table" (projects, messages). `filename` is only used
// for the local fallback and as the one-time seed when Redis has never seen
// this key before, so the site isn't empty on first use.
function makeStore(key, filename, emptyValue) {
  const filePath = ensureDataFile(filename, JSON.stringify(emptyValue) + '\n');

  async function read() {
    if (redis) {
      const value = await redis.get(key);
      if (value !== null && value !== undefined) return value;
      const seed = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : emptyValue;
      await redis.set(key, seed);
      return seed;
    }
    if (!fs.existsSync(filePath)) return emptyValue;
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw.trim() ? JSON.parse(raw) : emptyValue;
  }

  async function write(value) {
    if (redis) {
      await redis.set(key, value);
      return;
    }
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
  }

  return { read, write };
}

module.exports = { makeStore, IS_CONFIGURED };
