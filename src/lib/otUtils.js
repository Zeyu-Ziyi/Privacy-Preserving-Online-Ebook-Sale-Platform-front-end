// 辅助函数：将十六进制字符串转换为 ArrayBuffer
const hexToArrayBuffer = (hex) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
};

// 辅助函数：将 ArrayBuffer 转换为十六进制字符串
const arrayBufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * [OT Step 1] 客户端使用 Web Crypto API 生成其密钥对。
 * @returns {Promise<{ keyPair: CryptoKeyPair, publicKey: string }>} 客户端的密钥对和十六进制公钥。
 */
export const generateClientKeys = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, // 可提取
    ['deriveBits'] // 授予 'deriveBits' 权限
  );
  const publicKeyBuffer = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
  return {
    keyPair,
    publicKey: arrayBufferToHex(publicKeyBuffer),
  };
};

/**
 * [OT Step 3] 客户端计算并解密出它选择的书籍的真实密钥。
 * @param {CryptoKey} clientPrivateKey - 客户端的私钥对象。
 * @param {string} serverTempPublicKeyHex - 服务器发送的临时公钥。
 * @param {string} encryptedBookKeyHex - 服务器发送的加密书籍密钥。
 * @returns {Promise<string>} 解密后的书籍密钥 (十六进制)。
 */
export const decryptChosenKey = async (clientPrivateKey, serverTempPublicKeyHex, encryptedBookKeyHex) => {
  // 1. 将服务器的十六进制公钥导入为 CryptoKey 对象
  const serverTempPublicKey = await window.crypto.subtle.importKey(
    'raw',
    hexToArrayBuffer(serverTempPublicKeyHex),
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );

  // 2. 使用 ECDH 派生原始共享秘密
  const sharedSecretBits = await window.crypto.subtle.deriveBits(
    { name: 'ECDH', public: serverTempPublicKey },
    clientPrivateKey,
    256 // 派生出 256 位 (32 字节)
  );

  // 3. 使用 SHA-256 对原始秘密进行哈希，以生成最终的加密密钥
  const encryptionKeyBuffer = await window.crypto.subtle.digest('SHA-256', sharedSecretBits);

  // 4. 将最终的哈希密钥导入为 AES-GCM 密钥
  const aesKey = await window.crypto.subtle.importKey(
    'raw', 
    encryptionKeyBuffer, 
    'AES-GCM', 
    false, 
    ['decrypt']
  );

  // 5. --- 关键修复: 正确解析 IV + Ciphertext + AuthTag 格式 ---
  const encryptedData = new Uint8Array(hexToArrayBuffer(encryptedBookKeyHex));
  const iv = encryptedData.slice(0, 12);
  // Web Crypto API 的 decrypt 函数期望接收一个包含了 Ciphertext 和 AuthTag 的数据块。
  // 我们的后端正是将这两部分拼接在了一起。
  const dataToDecrypt = encryptedData.slice(12);
  
  // 6. 执行 AES-GCM 解密
  const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    aesKey,
    dataToDecrypt
  );

  return arrayBufferToHex(decryptedKeyBuffer);
};

