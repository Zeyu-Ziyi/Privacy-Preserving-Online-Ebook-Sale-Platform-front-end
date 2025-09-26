// src/lib/otUtils.test.js
import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import {
  xorBuffers,
  uint8ArrayToHex,
} from './otUtils.js';

async function aesGcmEncrypt(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const ciphertext = new Uint8Array(iv.length + encryptedData.byteLength);
  ciphertext.set(iv);
  ciphertext.set(new Uint8Array(encryptedData), iv.length);
  return uint8ArrayToHex(ciphertext);
}

describe('Oblivious Transfer (OT) Utility Functions (Stress Test)', () => {
  const TEST_COUNT = 100;

  
  describe('xorBuffers with 100 sets of random buffers', () => {
    it('should correctly XOR buffers of random lengths and values', () => {
      for (let i = 0; i < TEST_COUNT; i++) {
        const bufferCount = faker.number.int({ min: 2, max: 10 });
        const bufferLength = faker.number.int({ min: 16, max: 64 });
        
        const buffers = Array.from({ length: bufferCount }, () => 
            crypto.getRandomValues(new Uint8Array(bufferLength)).buffer
        );

        const expected = new Uint8Array(bufferLength);
        for (let byteIndex = 0; byteIndex < bufferLength; byteIndex++) {
            let xorValue = 0;
            for (const buffer of buffers) {
                xorValue ^= new Uint8Array(buffer)[byteIndex];
            }
            expected[byteIndex] = xorValue;
        }

        const result = xorBuffers(buffers, bufferLength);
        expect(new Uint8Array(result)).toEqual(expected);
      }
    });
  });
});