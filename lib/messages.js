const fs = require('fs');
const crypto = require('crypto');
const { ensureDataFile } = require('./storage-paths');

const DATA_FILE = ensureDataFile('messages.json', '[]\n');

function readAll() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return raw.trim() ? JSON.parse(raw) : [];
}

function writeAll(messages) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2) + '\n');
}

function add({ name, email, message }) {
  const messages = readAll();
  const entry = {
    id: crypto.randomUUID(),
    name,
    email,
    message,
    receivedAt: new Date().toISOString()
  };
  messages.unshift(entry);
  writeAll(messages);
  return entry;
}

function remove(id) {
  const messages = readAll();
  const index = messages.findIndex((m) => m.id === id);
  if (index === -1) return null;
  const [removed] = messages.splice(index, 1);
  writeAll(messages);
  return removed;
}

module.exports = { readAll, add, remove };
