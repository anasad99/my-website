const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WORKS_DIR } = require('./storage-paths');

// Vercel Blob has a free storage/bandwidth allowance on the Hobby plan —
// plenty for a personal portfolio's images. Its access model is public-URL
// only (no private/authenticated reads), which is exactly right for these
// images since they're meant to be viewed on the public site anyway.
const IS_CONFIGURED = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

if (!IS_CONFIGURED) {
  console.warn(
    'BLOB_READ_WRITE_TOKEN is not set — uploaded work images are saved to local disk. ' +
    'On Vercel this means they will NOT survive a redeploy or cold start. See .env.example.'
  );
}

function nextLocalNumber(existingImages) {
  const used = existingImages
    .map((img) => parseInt(path.basename(img.src), 10))
    .filter((n) => !isNaN(n));
  return used.length ? Math.max(...used) + 1 : 1;
}

// existingImages is only needed for the local fallback's sequential
// filenames (to avoid colliding with what's already on disk) — Blob keys
// are random, so two uploads can never collide regardless of ordering.
async function saveImages(slug, name, files, existingImages) {
  if (IS_CONFIGURED) {
    const { put } = require('@vercel/blob');
    const results = [];
    for (const file of files) {
      const ext = path.extname(file.originalname) || '.jpg';
      const key = `works/${slug}/${crypto.randomUUID()}${ext}`;
      const { url } = await put(key, file.buffer, {
        access: 'public',
        contentType: file.mimetype
      });
      results.push({ src: url, alt: `${name} project image` });
    }
    return results;
  }

  const dir = path.join(WORKS_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });
  let next = nextLocalNumber(existingImages);
  return files.map((file) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${next++}${ext}`;
    fs.writeFileSync(path.join(dir, filename), file.buffer);
    return { src: `assets/works/${slug}/${filename}`, alt: `${name} project image` };
  });
}

// Deletes one image regardless of where it lives. Only ever removes files
// this app wrote itself (a Blob URL under our token, or a local file under
// assets/works/) — an original seed image living directly under assets/ is
// never touched, even if it's "removed" from a project.
async function deleteImage(src) {
  if (/^https?:\/\//.test(src)) {
    if (!IS_CONFIGURED) return;
    const { del } = require('@vercel/blob');
    await del(src).catch(() => {});
    return;
  }
  if (src.startsWith('assets/works/')) {
    fs.unlink(path.join(__dirname, '..', src), () => {});
  }
}

// Called after deleting every image in a work (e.g. removing the work
// entirely). Blob has no real directories — deleting each object is all
// that's needed there — but the local fallback leaves an empty folder
// behind unless it's cleaned up explicitly.
function deleteProjectFolder(slug) {
  if (IS_CONFIGURED) return;
  fs.rm(path.join(WORKS_DIR, slug), { recursive: true, force: true }, () => {});
}

module.exports = { IS_CONFIGURED, saveImages, deleteImage, deleteProjectFolder };
