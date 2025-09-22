// src/lib/otUtils.js
import { p256 } from '@noble/curves/nist';

// --- 辅助函数：用于在不同数据格式间转换 ---

/**
 * 将 Hex 字符串转换为 Uint8Array。
 * @param {string} hexString
 * @returns {Uint8Array}
 */
const hexToUint8Array = (hexString) => {
  if (hexString.length % 2 !== 0) {
    throw new Error("无效的Hex字符串：长度必须是偶数。");
  }
  return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
};

/**
 * 将 Uint8Array 转换为 Hex 字符串。
 * @param {Uint8Array} bytes
 * @returns {string}
 */
const uint8ArrayToHex = (bytes) => {
  return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
};


// --- 核心密码学函数 ---

/**
 * 客户端为OT的每一轮生成一个临时的私钥a和公钥A=aG。
 * @returns {{ privateKey: Uint8Array, publicKey: Uint8Array }}
 */
export const generateClientOtKeyPair = () => {
  // ✅ 核心修复：使用 noble-curves v2.0.0 的正确API来生成私钥
  const privateKey = p256.utils.randomSecretKey();
  const publicKey = p256.getPublicKey(privateKey);
  
  // --- DEBUG LOG ---
  console.log(`[OT-CRYPTO-CLIENT] 产生新的密钥对:`);
  console.log(`  - PrivKey: ${uint8ArrayToHex(privateKey).substring(0, 10)}...`);
  console.log(`  - PubKey:  ${uint8ArrayToHex(publicKey).substring(0, 10)}...`);
  // --- END DEBUG LOG ---

  return { privateKey, publicKey };
};

/**
 * 客户端使用其私钥和服务器的公钥派生共享密钥。
 * @param {Uint8Array} clientPrivateKey - 客户端本轮的私钥。
 * @param {Uint8Array} serverPublicKey - 服务器发来的公钥。
 * @returns {Promise<CryptoKey>} - 返回一个可用于AES-GCM解密的密钥。
 */
export const deriveClientSharedSecret = async (clientPrivateKey, serverPublicKey) => {
  // --- DEBUG LOG ---
  console.log(`[OT-CRYPTO-CLIENT] 正在派生共享密钥...`);
  console.log(`  - Client PrivKey: ${uint8ArrayToHex(clientPrivateKey).substring(0, 10)}...`);
  console.log(`  - Server PubKey:  ${uint8ArrayToHex(serverPublicKey).substring(0, 10)}...`);
  // --- END DEBUG LOG ---

  const sharedSecret = p256.getSharedSecret(clientPrivateKey, serverPublicKey);
  const hashedSecret = await crypto.subtle.digest('SHA-256', sharedSecret);

  // --- DEBUG LOG ---
  console.log(`  - 派生的共享密钥 (哈希后): ${uint8ArrayToHex(new Uint8Array(hashedSecret))}`);
  // --- END DEBUG LOG ---

  return await crypto.subtle.importKey('raw', hashedSecret, { name: 'AES-GCM' }, true, ['decrypt']);
};

/**
 * 使用派生的共享密钥进行 AES-GCM 解密。
 */
export const aesGcmDecrypt = async (ciphertextHex, key) => {
    const ciphertext = hexToUint8Array(ciphertextHex);
    const iv = ciphertext.slice(0, 12);
    const data = ciphertext.slice(12);
    return await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
};

/**
 * 将多个 ArrayBuffer (Buffer) XOR 在一起，并进行严格的长度检查。
 */
export const xorBuffers = (buffers, expectedLength) => {
    if (!buffers || buffers.length === 0) {
        throw new Error("xorBuffers 错误：输入数组为空或未定义。");
    }
    const bufferViews = buffers.map(b => new Uint8Array(b));
    for (let i = 0; i < bufferViews.length; i++) {
        if (bufferViews[i].length !== expectedLength) {
            throw new Error(`xorBuffers 错误：种子 #${i} 的长度为 ${bufferViews[i].length}字节，但期望为 ${expectedLength}字节。这通常意味着某一轮的OT解密失败了。`);
        }
    }
    const result = new Uint8Array(expectedLength);
    for (let i = 0; i < expectedLength; i++) {
        result[i] = bufferViews.reduce((acc, current) => acc ^ (current[i] || 0), 0);
    }
    return result.buffer;
};

// 导出辅助函数以便在页面组件中使用
export { uint8ArrayToHex, hexToUint8Array };