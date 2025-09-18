import { buildPoseidon } from 'circomlibjs';
import { MerkleTree } from 'fixed-merkle-tree'; // <-- 修复了导入名称
import { randomBytes, hexlify } from 'ethers';

/**
 * 将 UUID 字符串 (例如 "5f2fc0b7-f335-4331-841d-a341fe9a73ca") 
 * 转换为电路可以使用的 BigInt 字符串 (十进制)。
 * @param {string} uuid - The UUID string.
 * @returns {string} The BigInt as a decimal string.
 */
export const uuidToBigIntString = (uuid) => {
  // 1. 移除所有连字符
  const hex = uuid.replace(/-/g, '');
  // 2. 将纯十六进制字符串转换为 BigInt, 然后再转换为 (十进制) 字符串
  return BigInt('0x' + hex).toString();
};

// 确保这与您电路中的 TREE_LEVELS 匹配 (例如 8)
const TREE_LEVELS = 8;

// 1. 初始化 Poseidon 哈希器
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
  await getPoseidon(); // 确保 poseidon 已初始化
  const leaves = allBooks.map(book =>
    poseidonHash([uuidToBigIntString(book.id), book.price_cents.toString()]) // 确保价格也是字符串
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
    // 私有输入
    book_id: uuidToBigIntString(book.id),
    nonce: nonce,
    price: book.price_cents.toString(),
    merkle_proof: merkleProof.pathElements,
    merkle_path_indices: merkleProof.pathIndices,
    // 公开输入
    merkle_root: merkleRoot,
    commitment: commitment,
  };
};

