import { buildPoseidon } from 'circomlibjs';
import { FixedMerkleTree } from 'fixed-merkle-tree';
import { ethers } from 'ethers';

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

// 2. 辅助函数：生成一个安全的随机 nonce
export const generateNonce = () => {
  // 生成一个31字节的安全随机数，使其适合 Poseidon 哈希输入
  return ethers.BigNumber.from(ethers.utils.randomBytes(31)).toString();
};

// 3. 辅助函数：Poseidon 哈希 (circomlibjs 的 poseidon.F.toString 是必需的)
export const poseidonHash = (inputs) => {
  const hash = poseidon(inputs);
  return poseidon.F.toString(hash);
};

// 4. 构建 Merkle 树的函数
export const buildMerkleTree = async (allBooks) => {
  const poseidon = await getPoseidon();
  
  // 1. 计算所有书籍的叶子节点
  const leaves = allBooks.map(book =>
    poseidonHash([book.id, book.price_cents]) // 必须匹配电路中的 leaf_hasher
  );

  // 2. 创建树
  const tree = new FixedMerkleTree(TREE_LEVELS, leaves, {
    hashFunction: (left, right) => poseidonHash([left, right]),
    zeroElement: '0' // 使用 0 作为空叶子，如果书籍数量不是 2^LEVELS
  });

  return tree;
};

// 5. 为特定书籍生成 Merkle 证明
export const getMerkleProof = (tree, leafIndex) => {
    if (leafIndex < 0) {
        throw new Error('Book leaf not found in tree');
    }
    const proof = tree.path(leafIndex);
    return proof; // 这将返回一个包含 { root, pathElements, pathIndices } 的对象
};

// 6. 生成 snarkjs.fullProve 所需的完整输入
export const generateZkpInputs = (book, nonce, merkleProof, merkleRoot, commitment) => {
  return {
    // --- 私有输入 ---
    book_id: book.id.toString(),
    nonce: nonce,
    merkle_proof: merkleProof.pathElements, // 来自 fixed-merkle-tree
    merkle_path_indices: merkleProof.pathIndices, // 来自 fixed-merkle-tree

    // --- 公开输入 ---
    merkle_root: merkleRoot,
    price: book.price_cents.toString(),
    commitment: commitment,
    // (nullifier 是电路的输出, 不是输入)
  };
};