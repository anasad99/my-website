require('dotenv').config();

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cookieSession = require('cookie-session');
const multer = require('multer');

const projects = require('./lib/projects');
const messages = require('./lib/messages');
const mailer = require('./lib/mailer');
const { WORKS_DIR } = require('./lib/storage-paths');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.ADMIN_PASSWORD) {
  console.warn('ADMIN_PASSWORD is not set — using the default "admin". Set it in .env before deploying.');
}
if (!process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET is not set — using a random value generated at startup. On a serverless host (Vercel) this WILL break admin login: each instance gets its own random secret, so a login cookie signed by one instance fails verification on the next. Set SESSION_SECRET as a fixed environment variable before deploying there.');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session data lives in the signed cookie itself (not server memory), so it
// works across Vercel's separate serverless instances — a server-side store
// like express-session's default MemoryStore does not, since a login and
// the next request can land on different instances with no shared memory.
app.use(cookieSession({
  name: 'session',
  keys: [SESSION_SECRET],
  maxAge: 1000 * 60 * 60 * 8,
  httpOnly: true,
  sameSite: 'lax'
}));

app.use(express.urlencoded({ extended: false }));

const parseForm = multer().none();
const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/admin/login');
}

// ---------------------------------------------------------------------------
// Public pages
// ---------------------------------------------------------------------------

app.get('/', (req, res) => {
  res.render('index', { projects: projects.readAll() });
});

const staticPages = { '/about': 'about.html', '/contact': 'contact.html' };

app.get(Object.keys(staticPages), (req, res) => {
  res.sendFile(path.join(__dirname, staticPages[req.path]));
});

app.get('/project/:slug', (req, res) => {
  const project = projects.findBySlug(req.params.slug);
  if (!project) return res.status(404).render('index', { projects: projects.readAll() });

  const otherProjects = projects.readAll().filter((p) => p.slug !== project.slug).slice(0, 3);

  res.render('project', {
    project,
    layout: projects.layoutImages(project.images),
    otherProjects
  });
});

// Old static links redirect to their clean-URL equivalent.
app.get(['/index.html', '/about.html', '/contact.html'], (req, res) => {
  const clean = req.path === '/index.html' ? '/' : '/' + req.path.replace('.html', '');
  res.redirect(301, clean);
});
app.get(['/project', '/project.html'], (req, res) => res.redirect(301, '/#work'));

// Contact form submission. contact.js posts a multipart FormData body here
// when the form's data-endpoint attribute is set (see contact.html).
app.post('/contact', parseForm, async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim();
  const message = (req.body.message || '').trim();

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Missing required field.' });
  }

  messages.add({ name, email, message });

  try {
    await mailer.sendContactNotification({ name, email, message });
  } catch (err) {
    console.error('Failed to send contact notification email:', err);
  }

  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Admin: login
// ---------------------------------------------------------------------------

app.get('/admin/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }

  res.status(401).render('admin/login', { error: 'Wrong username or password.' });
});

app.post('/admin/logout', (req, res) => {
  req.session = null;
  res.redirect('/admin/login');
});

// ---------------------------------------------------------------------------
// Admin: dashboard
// ---------------------------------------------------------------------------

app.get('/admin', requireAdmin, (req, res) => {
  res.render('admin/dashboard', {
    projects: projects.readAll(),
    messages: messages.readAll(),
    mailConfigured: mailer.isConfigured,
    error: null
  });
});

app.post('/admin/works', requireAdmin, uploadImages.array('images', 12), (req, res) => {
  const name = (req.body.name || '').trim();
  const discipline = (req.body.discipline || '').trim();
  const lead = (req.body.lead || '').trim();
  const services = (req.body.services || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!name || !discipline || !lead || !req.files || req.files.length === 0) {
    return res.status(400).render('admin/dashboard', {
      projects: projects.readAll(),
      messages: messages.readAll(),
      mailConfigured: mailer.isConfigured,
      error: 'Name, discipline, lead text and at least one image are required.'
    });
  }

  const slug = projects.uniqueSlug(name, projects.readAll());
  const dir = path.join(WORKS_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });

  const images = req.files.map((file, i) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${i + 1}${ext}`;
    fs.writeFileSync(path.join(dir, filename), file.buffer);
    return { src: `assets/works/${slug}/${filename}`, alt: `${name} project image` };
  });

  projects.add({ name, discipline, lead, services, images });
  res.redirect('/admin');
});

app.post('/admin/works/:slug/delete', requireAdmin, (req, res) => {
  const removed = projects.remove(req.params.slug);
  if (removed) {
    fs.rm(path.join(WORKS_DIR, req.params.slug), { recursive: true, force: true }, () => {});
  }
  res.redirect('/admin');
});

// ---------------------------------------------------------------------------
// Admin: contact messages
// ---------------------------------------------------------------------------

app.post('/admin/messages/:id/delete', requireAdmin, (req, res) => {
  messages.remove(req.params.id);
  res.redirect('/admin');
});

// ---------------------------------------------------------------------------
// Static assets (styles.css, nav.js, contact.js, assets/*) referenced by
// absolute/relative paths in the pages above. Admin-uploaded work images live
// in WORKS_DIR, which is outside the repo on Vercel (see lib/storage-paths),
// so they need their own static handler ahead of the general one.
// ---------------------------------------------------------------------------

app.use('/assets/works', express.static(WORKS_DIR));
app.use(express.static(__dirname, { index: false }));

app.use((req, res) => {
  res.status(404).render('index', { projects: projects.readAll() });
});

// Vercel imports this file as a serverless function and calls the exported
// app directly — it must not also start its own listener.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
