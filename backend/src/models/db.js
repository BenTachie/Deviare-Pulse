const path     = require('path')
const fs       = require('fs')
const { DatabaseSync } = require('node:sqlite')
const { SEED_TEMPLATES } = require('../data/templates')

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '../../data/pulse_email.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const _db = new DatabaseSync(DB_PATH)

/* ── node:sqlite uses exec() for PRAGMAs (no pragma() shorthand) ── */
_db.exec('PRAGMA journal_mode = WAL')
_db.exec('PRAGMA foreign_keys = ON')

/* ── Schema ─────────────────────────────────────────────────────── */
_db.exec(`
  CREATE TABLE IF NOT EXISTS email_templates (
    key        TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    subject    TEXT NOT NULL,
    body_html  TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS email_logs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient    TEXT NOT NULL,
    template_key TEXT,
    subject      TEXT,
    status       TEXT NOT NULL CHECK(status IN ('sent','failed')),
    message_id   TEXT,
    error        TEXT,
    sent_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

/*
 * Compatibility shim: node:sqlite requires named-parameter keys to include
 * their prefix (e.g. { '@key': val }), whereas better-sqlite3 accepted plain
 * keys ({ key: val }) for @param-style SQL.  This shim converts plain keys
 * automatically so the rest of the codebase is unchanged.
 */
function prefixAt(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k.startsWith('@') || k.startsWith(':') || k.startsWith('$') ? k : `@${k}`] = v
  }
  return out
}

function normalise(args) {
  if (
    args.length === 1 &&
    args[0] !== null &&
    typeof args[0] === 'object' &&
    !Array.isArray(args[0])
  ) {
    return [prefixAt(args[0])]
  }
  return args
}

function wrapStmt(stmt) {
  return {
    all: (...a) => stmt.all(...normalise(a)),
    get: (...a) => stmt.get(...normalise(a)),
    run: (...a) => stmt.run(...normalise(a)),
  }
}

/* Public API that mirrors better-sqlite3 */
const db = {
  prepare: (sql) => wrapStmt(_db.prepare(sql)),
  exec:    (sql) => _db.exec(sql),
  transaction(fn) {
    return (...args) => {
      _db.exec('BEGIN IMMEDIATE')
      try {
        const result = fn(...args)
        _db.exec('COMMIT')
        return result
      } catch (err) {
        _db.exec('ROLLBACK')
        throw err
      }
    }
  },
}

/* ── Seed templates (insert or ignore) ─────────────────────────── */
const upsertTpl = db.prepare(`
  INSERT INTO email_templates (key, name, subject, body_html)
  VALUES (@key, @name, @subject, @body_html)
  ON CONFLICT(key) DO NOTHING
`)

const seedAll = db.transaction(() => {
  for (const tpl of SEED_TEMPLATES) upsertTpl.run(tpl)
})

seedAll()

module.exports = db
