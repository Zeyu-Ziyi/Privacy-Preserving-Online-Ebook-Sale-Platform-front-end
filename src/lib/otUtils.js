// src/lib/otUtils.js
import { p256 } from '@noble/curves/nist';

// --- Utility functions for converting between different data formats ---

/**
 * Convert Hex string to Uint8Array.
 * @param {string} hexString
 * @returns {Uint8Array}
 */
const hexToUint8Array = (hexString) => {
  if (hexString.length % 2 !== 0) {
    throw new Error("Invalid Hex string: length must be even.");
  }
  return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
};

/**
 * Convert Uint8Array to Hex string.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
const uint8ArrayToHex = (bytes) => {
  return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
};


// --- Core cryptographic functions ---

/**
 * Generate a temporary private key a and public key A=aG for each round of OT.
 * @returns {{ privateKey: Uint8Array, publicKey: Uint8Array }}
 */
export const generateClientOtKeyPair = () => {
  const privateKey = p256.utils.randomSecretKey();
  const publicKey = p256.getPublicKey(privateKey);
  
  // --- DEBUG LOG ---
  console.log(`[OT-CRYPTO-CLIENT] Generate new key pair:`);
  console.log(`  - PrivKey: ${uint8ArrayToHex(privateKey).substring(0, 10)}...`);
  console.log(`  - PubKey:  ${uint8ArrayToHex(publicKey).substring(0, 10)}...`);
  // --- END DEBUG LOG ---

  return { privateKey, publicKey };
};

/**
 * The client uses its private key and the server's public key to derive the shared key.
 * @param {Uint8Array} clientPrivateKey - The private key of the client for this round.
 * @param {Uint8Array} serverPublicKey - The public key sent by the server.
 * @returns {Promise<CryptoKey>} - Returns a key that can be used for AES-GCM decryption.
 */
export const deriveClientSharedSecret = async (clientPrivateKey, serverPublicKey) => {
  // --- DEBUG LOG ---
  console.log(`[OT-CRYPTO-CLIENT] Deriving shared key...`);
  console.log(`  - Client PrivKey: ${uint8ArrayToHex(clientPrivateKey).substring(0, 10)}...`);
  console.log(`  - Server PubKey:  ${uint8ArrayToHex(serverPublicKey).substring(0, 10)}...`);
  // --- END DEBUG LOG ---

  const sharedSecret = p256.getSharedSecret(clientPrivateKey, serverPublicKey);
  const hashedSecret = await crypto.subtle.digest('SHA-256', sharedSecret);

  // --- DEBUG LOG ---
  console.log(`  - Derived shared key (hashed): ${uint8ArrayToHex(new Uint8Array(hashedSecret))}`);
  // --- END DEBUG LOG ---

  return await crypto.subtle.importKey('raw', hashedSecret, { name: 'AES-GCM' }, true, ['decrypt']);
};

/**
 * Use the derived shared key for AES-GCM decryption.
 */
export const aesGcmDecrypt = async (ciphertextHex, key) => {
    const ciphertext = hexToUint8Array(ciphertextHex);
    const iv = ciphertext.slice(0, 12);
    const data = ciphertext.slice(12);
    return await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
};

/**
 * XOR multiple ArrayBuffers (Buffers) together and perform strict length checks.
 */
export const xorBuffers = (buffers, expectedLength) => {
    if (!buffers || buffers.length === 0) {
        throw new Error("xorBuffers error: input array is empty or undefined.");
    }
    const bufferViews = buffers.map(b => new Uint8Array(b));
    for (let i = 0; i < bufferViews.length; i++) {
        if (bufferViews[i].length !== expectedLength) {
            throw new Error(`xorBuffers error: seed #${i} has length ${bufferViews[i].length} bytes, but expected ${expectedLength} bytes. This usually means that one round of OT decryption failed.`);
        }
    }
    const result = new Uint8Array(expectedLength);
    for (let i = 0; i < expectedLength; i++) {
        result[i] = bufferViews.reduce((acc, current) => acc ^ (current[i] || 0), 0);
    }
    return result.buffer;
};

// Export utility functions for use in page components
export { uint8ArrayToHex, hexToUint8Array };