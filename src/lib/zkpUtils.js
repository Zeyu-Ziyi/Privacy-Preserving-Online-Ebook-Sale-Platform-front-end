import { buildPoseidon } from 'circomlibjs';
import { MerkleTree } from 'fixed-merkle-tree'; 
import { randomBytes, hexlify } from 'ethers';

/**
 * Convert UUID string (e.g. "5f2fc0b7-f335-4331-841d-a341fe9a73ca") 
 * to a BigInt string (decimal) that the circuit can use.
 * @param {string} uuid - The UUID string.
 * @returns {string} The BigInt as a decimal string.
 */
export const uuidToBigIntString = (uuid) => {
  // 1. Remove all hyphens
  const hex = uuid.replace(/-/g, '');
  // 2. Convert the pure hexadecimal string to BigInt, then convert to (decimal) string
  return BigInt('0x' + hex).toString();
};

// Ensure this matches TREE_LEVELS in your circuit (e.g. 8)
const TREE_LEVELS = 8;

// 1. Initialize Poseidon hash function
let poseidon;
export const getPoseidon = async () => {
  if (!poseidon) {
    poseidon = await buildPoseidon();
  }
  return poseidon;
};

export const generateNonce = () => {
  const bytes = randomBytes(31);
  const randomHex = hexlify(bytes);
  return BigInt(randomHex).toString();
};

export const poseidonHash = (inputs) => {
  const hash = poseidon(inputs);
  return poseidon.F.toString(hash);
};

export const buildMerkleTree = async (allBooks) => {
  await getPoseidon(); // Ensure poseidon is initialized
  const leaves = allBooks.map(book =>
    poseidonHash([uuidToBigIntString(book.id), book.price_cents.toString()]) // Ensure price is also a string
  );
  const tree = new MerkleTree(TREE_LEVELS, leaves, {
    hashFunction: (left, right) => poseidonHash([left, right]),
    zeroElement: '0'
  });
  return tree;
};


export const getMerkleProof = (tree, leafIndex) => {
    if (leafIndex < 0) {
        throw new Error('Book leaf not found in tree');
    }
    return tree.path(leafIndex);
};

export const generateZkpInputs = (book, nonce, merkleProof, merkleRoot, commitment) => {
  return {
    // Private inputs
    book_id: uuidToBigIntString(book.id),
    nonce: nonce,
    price: book.price_cents.toString(),
    merkle_proof: merkleProof.pathElements,
    merkle_path_indices: merkleProof.pathIndices,
    // Public inputs
    merkle_root: merkleRoot,
    commitment: commitment,
  };
};

