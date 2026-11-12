import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, TurboModuleRegistry } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { gcm } from '@noble/ciphers/aes';
import { Buffer } from 'buffer';
import type { DriveNative } from './driveNative';

const scope = 'https://www.googleapis.com/auth/drive.appdata';
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

function makeAdapter(): DriveNative | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    (Platform.OS !== 'android' && Platform.OS !== 'ios') ||
    (Platform.OS === 'ios' && !iosClientId)) return null;

  // A development client can load newer JavaScript than its native binary supports.
  if (!TurboModuleRegistry.get('RNGoogleSignin')) return null;

  const { GoogleSignin, isSuccessResponse } = require('@react-native-google-signin/google-signin') as
    typeof import('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ iosClientId, scopes: [scope] });
  return {
    async connect() {
      if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signedIn = await GoogleSignin.signIn();
      if (!isSuccessResponse(signedIn)) return null;
      if (!signedIn.data.scopes.includes(scope)) {
        const consent = await GoogleSignin.addScopes({ scopes: [scope] });
        if (!consent || !isSuccessResponse(consent) || !consent.data.scopes.includes(scope)) {
          await GoogleSignin.signOut();
          throw new Error('Allow access to the app’s Google Drive folder to use sync.');
        }
      }
      return signedIn.data.user.email;
    },
    async account() {
      if (!GoogleSignin.hasPreviousSignIn()) return null;
      const signedIn = await GoogleSignin.signInSilently();
      return signedIn.type === 'success' && signedIn.data.scopes.includes(scope) ? signedIn.data.user.email : null;
    },
    async token() { return (await GoogleSignin.getTokens()).accessToken; },
    async disconnect() {
      await GoogleSignin.signOut();
    },
    read: (name) => SecureStore.getItemAsync(name),
    write: (name, value) => SecureStore.setItemAsync(name, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
    remove: (name) => SecureStore.deleteItemAsync(name),
    randomHex: (bytes) => Buffer.from(Crypto.getRandomBytes(bytes)).toString('hex'),
    hash: (value) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
    encrypt(key, value) {
      const nonce = Crypto.getRandomBytes(12);
      const cipher = gcm(Buffer.from(key, 'hex'), nonce);
      const ciphertext = cipher.encrypt(Buffer.from(value, 'utf8'));
      return Buffer.concat([nonce, ciphertext]).toString('base64');
    },
    decrypt(key, value) {
      const bytes = Buffer.from(value, 'base64');
      if (bytes.length < 28) throw new Error('A Drive sync file is incomplete.');
      try {
        const cipher = gcm(Buffer.from(key, 'hex'), bytes.subarray(0, 12));
        return Buffer.from(cipher.decrypt(bytes.subarray(12))).toString('utf8');
      } catch {
        throw new Error('Could not unlock a Drive sync file. Check your sync key.');
      }
    },
  };
}

export const driveNative = makeAdapter();
