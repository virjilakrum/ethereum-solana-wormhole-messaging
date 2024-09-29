import { ethers } from 'ethers';
import { PublicKey } from '@solana/web3.js';
import * as eccrypto from 'eccrypto';
import * as crypto from 'crypto';

export class CryptoUtils {
  static async generateKeyPair(): Promise<{ privateKey: Buffer; publicKey: Buffer }> {
    return await eccrypto.generateKeyPair();
  }

  static compressPublicKey(publicKey: Buffer): string {
    return publicKey.toString('hex');
  }

  static decompressPublicKey(compressedKey: string): Buffer {
    return Buffer.from(compressedKey, 'hex');
  }

  static async encrypt(publicKey: Buffer, message: string): Promise<string> {
    const encrypted = await eccrypto.encrypt(publicKey, Buffer.from(message));
    return JSON.stringify({
      iv: encrypted.iv.toString('hex'),
      ephemPublicKey: encrypted.ephemPublicKey.toString('hex'),
      ciphertext: encrypted.ciphertext.toString('hex'),
      mac: encrypted.mac.toString('hex'),
    });
  }

  static async decrypt(privateKey: Buffer, encryptedMessage: string): Promise<string> {
    const encryptedData = JSON.parse(encryptedMessage);
    const decrypted = await eccrypto.decrypt(privateKey, {
      iv: Buffer.from(encryptedData.iv, 'hex'),
      ephemPublicKey: Buffer.from(encryptedData.ephemPublicKey, 'hex'),
      ciphertext: Buffer.from(encryptedData.ciphertext, 'hex'),
      mac: Buffer.from(encryptedData.mac, 'hex'),
    });
    return decrypted.toString();
  }
}
export function isValidEthereumAddress(address: string): boolean {
  return ethers.utils.isAddress(address);
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateKeyPair(): { privateKey: any; publicKey: any; } | PromiseLike<{ privateKey: any; publicKey: any; }> {
    throw new Error('Function not implemented.');
}


export function compressPublicKey(publicKey: any): any {
    throw new Error('Function not implemented.');
}


export function encrypt(arg0: Buffer, message: any) {
    throw new Error('Function not implemented.');
}
