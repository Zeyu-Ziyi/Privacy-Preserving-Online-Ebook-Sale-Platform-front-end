// src/lib/zkpUtils.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import { faker } from '@faker-js/faker';
import {
  uuidToBigIntString,
  getPoseidon,
  buildMerkleTree,
  getMerkleProof,
  poseidonHash,
} from './zkpUtils.js';

// Initialize Poseidon hash function before any tests run
beforeAll(async () => {
  await getPoseidon();
});

describe('ZKP Utility Functions (Stress Test)', () => {
  const TEST_COUNT = 100;

  // --- Test uuidToBigIntString ---
  const uuidTestCases = Array.from({ length: TEST_COUNT }, () => {
    const uuid = faker.string.uuid();
    const expected = BigInt('0x' + uuid.replace(/-/g, '')).toString();
    return { uuid, expected };
  });

  it.each(uuidTestCases)('should correctly convert UUID "$uuid"', ({ uuid, expected }) => {
    expect(uuidToBigIntString(uuid)).toBe(expected);
  });

  it('should be deterministic for 100 random inputs', () => {
    for (let i = 0; i < TEST_COUNT; i++) {
      const input = [faker.string.numeric(10), faker.string.numeric(10)];
      const hash1 = poseidonHash(input);
      const hash2 = poseidonHash([...input]); // Create a copy to ensure purity
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
    }
  });

  // --- Merkle Tree and Proofs Test (This structure was already correct) ---
  describe('Merkle Tree and Proofs with 100 random leaves', () => {
    const bookCount = 256;
    let mockBooks, tree, leaves;

    beforeAll(async () => {
      mockBooks = Array.from({ length: bookCount }, () => ({
        id: faker.string.uuid(),
        price_cents: faker.number.int({ min: 100, max: 10000 }),
      }));
      
      leaves = mockBooks.map(book =>
        poseidonHash([uuidToBigIntString(book.id), book.price_cents.toString()])
      );
      tree = await buildMerkleTree(mockBooks);
    });

    it('should generate and verify valid proofs for 100 random leaves', () => {
      for (let i = 0; i < TEST_COUNT; i++) {
        const randomIndex = faker.number.int({ min: 0, max: bookCount - 1 });
        const leaf = leaves[randomIndex];
        const proof = getMerkleProof(tree, randomIndex);

        let computedHash = leaf;
        for (let i = 0; i < proof.pathElements.length; i++) {
          const proofElement = proof.pathElements[i];
          const pathIndex = proof.pathIndices[i];
          
          if (pathIndex === 0) {
            computedHash = poseidonHash([computedHash, proofElement]);
          } else {
            computedHash = poseidonHash([proofElement, computedHash]);
          }
        }
        expect(computedHash).toBe(tree.root);
      }
    });
  });
});