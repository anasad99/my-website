const fs = require('fs');
const { ensureDataFile } = require('./storage-paths');

const DATA_FILE = ensureDataFile('projects.json', '[]\n');

function readAll() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeAll(projects) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2) + '\n');
}

function findBySlug(slug) {
  return readAll().find((p) => p.slug === slug);
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

function add(project) {
  const projects = readAll();
  const slug = uniqueSlug(project.name, projects);
  const entry = { ...project, slug };
  projects.push(entry);
  writeAll(projects);
  return entry;
}

function remove(slug) {
  const projects = readAll();
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1) return null;
  const [removed] = projects.splice(index, 1);
  writeAll(projects);
  return removed;
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

module.exports = { readAll, findBySlug, add, remove, slugify, uniqueSlug, layoutImages };
