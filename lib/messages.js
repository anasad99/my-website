const crypto = require('crypto');
const { makeStore } = require('./kv-store');

const store = makeStore('messages', 'messages.json', []);

async function readAll() {
  return store.read();
}

async function add({ name, email, message }) {
  const all = await readAll();
  const entry = {
    id: crypto.randomUUID(),
    name,
    email,
    message,
    receivedAt: new Date().toISOString()
  };
  all.unshift(entry);
  await store.write(all);
  return entry;
}

async function remove(id) {
  const all = await readAll();
  const index = all.findIndex((m) => m.id === id);
  if (index === -1) return null;
  const [removed] = all.splice(index, 1);
  await store.write(all);
  return removed;
}

module.exports = { readAll, add, remove };
