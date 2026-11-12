export interface DriveNative {
  connect(): Promise<string | null>;
  account(): Promise<string | null>;
  token(): Promise<string>;
  disconnect(): Promise<void>;
  read(name: string): Promise<string | null>;
  write(name: string, value: string): Promise<void>;
  remove(name: string): Promise<void>;
  randomHex(bytes: number): string;
  hash(value: string): Promise<string>;
  encrypt(key: string, value: string): string;
  decrypt(key: string, value: string): string;
}
