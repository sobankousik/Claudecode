/**
 * services/db.js
 *
 * Single SQLite database instance shared across audit, snapshots,
 * and pending confirmations. Tables are created on first boot.
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.GUARDRAILS_DB_PATH
  ?? path.join(__dirname, "..", "guardrails.db");

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");

// ─── Audit log ────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ts          TEXT    NOT NULL DEFAULT (datetime('now')),
    shop        TEXT    NOT NULL,
    session_id  TEXT,
    method      TEXT    NOT NULL,
    path        TEXT    NOT NULL,
    resource    TEXT    NOT NULL,
    resource_id TEXT,
    payload     TEXT,
    dry_run     INTEGER NOT NULL DEFAULT 0
  );
`);

// ─── Snapshots ────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS snapshots (
    id          TEXT    PRIMARY KEY,
    ts          TEXT    NOT NULL DEFAULT (datetime('now')),
    shop        TEXT    NOT NULL,
    resource    TEXT    NOT NULL,
    resource_id TEXT    NOT NULL,
    data        TEXT    NOT NULL
  );
`);

// ─── Pending confirmations ────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS pending_confirmations (
    token       TEXT    PRIMARY KEY,
    ts          TEXT    NOT NULL DEFAULT (datetime('now')),
    shop        TEXT    NOT NULL,
    method      TEXT    NOT NULL,
    path        TEXT    NOT NULL,
    body        TEXT,
    expires_at  TEXT    NOT NULL
  );
`);

// Prepared statements exposed for use by services
export const stmts = {
  // Audit
  insertAudit: db.prepare(`
    INSERT INTO audit_log (shop, session_id, method, path, resource, resource_id, payload, dry_run)
    VALUES (@shop, @session_id, @method, @path, @resource, @resource_id, @payload, @dry_run)
  `),
  listAudit: db.prepare(`
    SELECT * FROM audit_log WHERE shop = @shop ORDER BY id DESC LIMIT @limit OFFSET @offset
  `),

  // Snapshots
  insertSnapshot: db.prepare(`
    INSERT INTO snapshots (id, shop, resource, resource_id, data)
    VALUES (@id, @shop, @resource, @resource_id, @data)
  `),
  getSnapshot: db.prepare(`SELECT * FROM snapshots WHERE id = @id`),
  listSnapshots: db.prepare(`
    SELECT id, ts, shop, resource, resource_id
    FROM snapshots WHERE shop = @shop ORDER BY ts DESC LIMIT @limit
  `),

  // Confirmations
  insertConfirmation: db.prepare(`
    INSERT INTO pending_confirmations (token, shop, method, path, body, expires_at)
    VALUES (@token, @shop, @method, @path, @body, @expires_at)
  `),
  getConfirmation: db.prepare(`SELECT * FROM pending_confirmations WHERE token = @token`),
  deleteConfirmation: db.prepare(`DELETE FROM pending_confirmations WHERE token = @token`),
  purgeExpired: db.prepare(`DELETE FROM pending_confirmations WHERE expires_at < datetime('now')`),
};

export default db;
