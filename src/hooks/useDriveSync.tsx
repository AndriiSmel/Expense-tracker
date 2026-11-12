import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { subscribeToLocalChanges } from '../core/database';
import type { DriveNative } from '../core/driveNative';
import { driveNative as binding } from '../core/driveNativeBinding';
import { syncDrive } from '../core/driveTransport';
import { useDB } from './useDatabase';

const native: DriveNative | null = binding;
const keyName = 'expense-drive-key';
const autoName = 'expense-drive-auto';
const deviceName = 'expense-drive-device';

function useDriveController() {
  const db = useDB();
  const [account, setAccount] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [revision, setRevision] = useState(0);
  const [pendingAutoSync, setPendingAutoSync] = useState(false);
  const locked = useRef(false);

  const perform = useCallback(async (work: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Google Drive sync is unavailable.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!native) return;
    const adapter = native;
    let active = true;
    Promise.all([adapter.account(), adapter.read(keyName), adapter.read(autoName)]).then(([user, savedKey, automatic]) => {
      if (!active) return;
      setAccount(user);
      const saved = savedKey ? JSON.parse(savedKey) : null;
      if (user && saved?.account === user && typeof saved.key === 'string') {
        setKey(saved.key);
        setAuto(automatic === '1');
      }
    }).catch(() => {
      if (active) setError('Could not restore the Drive connection. Try connecting again.');
    }).finally(() => {
      if (active) setReady(true);
    });
    return () => { active = false; };
  }, []);

  const connect = () => perform(async () => {
    if (!native) return;
    const user = await native.connect();
    if (user) setAccount(user);
  });
  const disconnect = () => perform(async () => {
    if (!native) return;
    await native.disconnect();
    setAccount(null);
    setAuto(false);
    setLastSync(null);
    setKey(null);
    await Promise.all([native.remove(keyName), native.remove(autoName)]);
  });
  const saveKey = (value: string) => perform(async () => {
    if (!native || !account) return;
    const normalized = value.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(normalized)) throw new Error('Enter the full 64-character sync key.');
    await native.write(keyName, JSON.stringify({ account, key: normalized }));
    await native.write(autoName, '0');
    setAuto(false);
    setKey(normalized);
    setLastSync(null);
  });
  const setAutomatic = (value: boolean) => perform(async () => {
    if (!native) return;
    await native.write(autoName, value ? '1' : '0');
    setAuto(value);
  });

  const sync = useCallback(() => perform(async () => {
    if (!native || !account || !key) return;
    setPendingAutoSync(false);
    let device = await native.read(deviceName);
    if (!device) {
      device = native.randomHex(16);
      await native.write(deviceName, device);
    }
    await syncDrive(db, native, account, key, device, () => setRevision((value) => value + 1));
    setLastSync(new Date());
  }), [account, db, key, perform]);

  const automaticEnabled = ready && auto && Boolean(account && key);
  useEffect(() => {
    if (!automaticEnabled) return;
    return subscribeToLocalChanges(db, () => setPendingAutoSync(true));
  }, [automaticEnabled, db]);

  useEffect(() => {
    if (!automaticEnabled) setPendingAutoSync(false);
    else if (pendingAutoSync && !busy) void sync();
  }, [automaticEnabled, busy, pendingAutoSync, sync]);

  return {
    available: Boolean(native), ready, account, key, auto, busy, error, lastSync, revision,
    connect, disconnect, saveKey, setAutomatic, sync, generateKey: () => native?.randomHex(32) ?? '',
  };
}

const DriveContext = createContext<ReturnType<typeof useDriveController> | null>(null);

export function DriveSyncProvider({ children }: { children: React.ReactNode }) {
  const drive = useDriveController();
  return <DriveContext.Provider value={drive}>{children}</DriveContext.Provider>;
}

export function useDriveSync() {
  const drive = useContext(DriveContext);
  if (!drive) throw new Error('DriveSyncProvider is missing.');
  return drive;
}
