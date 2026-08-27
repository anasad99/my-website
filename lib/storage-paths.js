const fs = require('fs');
const path = require('path');

// Vercel's deployment filesystem is read-only except /tmp, and /tmp is wiped
// between cold starts. Locally (and on hosts with a real disk) we read and
// write the repo's own data/ and assets/works/ directories directly.
const IS_VERCEL = Boolean(process.env.VERCEL);

const REPO_DATA_DIR = path.join(__dirname, '..', 'data');
const REPO_WORKS_DIR = path.join(__dirname, '..', 'assets', 'works');

const DATA_DIR = IS_VERCEL ? '/tmp/data' : REPO_DATA_DIR;
const WORKS_DIR = IS_VERCEL ? '/tmp/uploads/works' : REPO_WORKS_DIR;

// On Vercel, seed a fresh /tmp copy from the committed file each cold start
// so the site isn't empty. Any admin edits since the last deploy are lost
// when the instance recycles — that's the accepted tradeoff of no database.
function ensureDataFile(filename, emptyContent) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const dest = path.join(DATA_DIR, filename);
  if (!fs.existsSync(dest)) {
    const seedPath = path.join(REPO_DATA_DIR, filename);
    const content = fs.existsSync(seedPath) ? fs.readFileSync(seedPath, 'utf8') : emptyContent;
    fs.writeFileSync(dest, content);
  }
  return dest;
}

module.exports = { IS_VERCEL, DATA_DIR, WORKS_DIR, ensureDataFile };
