import type { SQLiteDatabase } from 'expo-sqlite';
import { mergeSync, markUploaded, parseBatch, readSyncState, type SyncFile } from './driveSync';
import type { DriveNative } from './driveNative';

const api = 'https://www.googleapis.com/drive/v3';
const uploads = 'https://www.googleapis.com/upload/drive/v3';

export async function syncDrive(
  db: SQLiteDatabase, native: DriveNative, account: string, key: string, device: string,
  onApply: () => void,
) {
  const token = await native.token();
  const prefix = `expense-sync-v1-${await native.hash(key)}-`;
  const scope = JSON.stringify([account, prefix]);
  const { seen } = readSyncState(db, scope);
  const known = new Set(seen);
  const request = async (url: string, options: RequestInit = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const result = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}`, ...options.headers },
      });
      if (!result.ok) {
        throw new Error(result.status === 401 || result.status === 403
          ? 'Google Drive access was denied. Reconnect your account and try again.'
          : `Google Drive sync failed (HTTP ${result.status}). Try again.`);
      }
      return await result.text();
    } finally {
      clearTimeout(timeout);
    }
  };

  const downloaded: Parameters<typeof mergeSync>[3] = [];
  let pageToken = '';
  let otherKeyFound = false;
  let matchingKeyFound = false;
  do {
    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      q: "trashed = false and name contains 'expense-sync-v1-'",
      fields: 'nextPageToken,files(id,name)',
      pageSize: '1000',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const page = JSON.parse(await request(`${api}/files?${params}`)) as {
      files?: SyncFile[]; nextPageToken?: string;
    };
    for (const file of page.files ?? []) {
      if (!file.name.startsWith(prefix)) {
        otherKeyFound = true;
        continue;
      }
      matchingKeyFound = true;
      if (known.has(file.id)) continue;
      const body = await request(`${api}/files/${encodeURIComponent(file.id)}?alt=media`);
      downloaded.push({ id: file.id, changes: parseBatch(native.decrypt(key, body)) });
    }
    pageToken = page.nextPageToken ?? '';
  } while (pageToken);

  if (otherKeyFound && !matchingKeyFound) {
    throw new Error('This Google Drive has sync data protected by a different key. Use the key from your other device.');
  }
  if (seen.length && !matchingKeyFound) {
    throw new Error('Previously synced files are missing from Drive. Your local data is safe.');
  }
  const merged = mergeSync(db, scope, device, downloaded);
  if (merged.changed) onApply();
  if (!merged.pending.length) return;

  const encrypted = native.encrypt(key, JSON.stringify({ version: 1, changes: merged.pending }));
  const boundary = `sync-${native.randomHex(16)}`;
  const metadata = { name: prefix + native.randomHex(16), parents: ['appDataFolder'] };
  const uploaded = JSON.parse(await request(`${uploads}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: [
      `--${boundary}`, 'Content-Type: application/json; charset=UTF-8', '', JSON.stringify(metadata),
      `--${boundary}`, 'Content-Type: application/octet-stream', '', encrypted,
      `--${boundary}--`, '',
    ].join('\r\n'),
  }));
  if (typeof uploaded.id !== 'string') throw new Error('Drive did not confirm the upload. Try syncing again.');
  markUploaded(db, scope, uploaded.id);
}
