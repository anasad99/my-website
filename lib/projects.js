const { makeStore } = require('./kv-store');

const store = makeStore('projects', 'projects.json', []);

async function readAll() {
  return store.read();
}

async function findBySlug(slug) {
  const all = await readAll();
  return all.find((p) => p.slug === slug);
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueSlug(name, projects) {
  const base = slugify(name) || 'project';
  let slug = base;
  let n = 2;
  while (projects.some((p) => p.slug === slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

async function add(project) {
  const all = await readAll();
  const slug = uniqueSlug(project.name, all);
  const entry = { ...project, slug };
  all.push(entry);
  await store.write(all);
  return entry;
}

async function remove(slug) {
  const all = await readAll();
  const index = all.findIndex((p) => p.slug === slug);
  if (index === -1) return null;
  const [removed] = all.splice(index, 1);
  await store.write(all);
  return removed;
}

// The slug is never changed here, even if the name is — it's baked into the
// project's URL and its uploaded-image folder, so keeping it stable means
// editing a project never breaks a link someone already has to it.
async function update(slug, updates) {
  const all = await readAll();
  const index = all.findIndex((p) => p.slug === slug);
  if (index === -1) return null;
  all[index] = { ...all[index], ...updates, slug };
  await store.write(all);
  return all[index];
}

function layoutImages(images) {
  const groups = [];
  let i = 0;
  let wideTurn = true;
  while (i < images.length) {
    if (wideTurn || i + 1 >= images.length) {
      groups.push({ type: 'wide', images: [images[i]] });
      i += 1;
    } else {
      groups.push({ type: 'pair', images: [images[i], images[i + 1]] });
      i += 2;
    }
    wideTurn = !wideTurn;
  }
  return groups;
}

module.exports = { readAll, findBySlug, add, remove, update, slugify, uniqueSlug, layoutImages };
