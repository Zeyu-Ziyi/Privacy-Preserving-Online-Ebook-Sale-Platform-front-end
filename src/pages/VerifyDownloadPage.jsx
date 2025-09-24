// src/pages/VerifyDownloadPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { getAllBooksRaw } from '../api/booksApi';
import * as snarkjs from 'snarkjs';

import { 
  getPoseidon, 
  buildMerkleTree, 
  getMerkleProof, 
  generateZkpInputs,
  uuidToBigIntString,
  poseidonHash,
  generateNonce
} from '../lib/zkpUtils';

import {
  generateClientOtKeyPair,
  deriveClientSharedSecret,
  aesGcmDecrypt,
  xorBuffers,
  uint8ArrayToHex,
  hexToUint8Array,
} from '../lib/otUtils';

const WS_URL = 'ws://localhost:3000';

const VerifyDownloadPage = () => {
  const { purchaseId } = useParams();
  const { token } = useAuthStore();
  const [status, setStatus] = useState('准备中...');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  
  const ws = useRef(null);
  const otState = useRef({
    choiceBits: [],
    collectedSeeds: [],
    roundKeys: [],
    finalBookKey: null,
  });

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const selectedBookRef = useRef(null);

  const { data: allBooks, isLoading: isLoadingBooks } = useQuery({
    queryKey: ['allBooksRaw'],
    queryFn: getAllBooksRaw,
  });

  useEffect(() => {
    if (!token || !purchaseId || isLoadingBooks || !allBooks || !Array.isArray(allBooks)) return;
    
    const secretKey = `purchaseSecrets_${purchaseId}`;
    const secretsJSON = localStorage.getItem(secretKey);
    if (!secretsJSON) {
      setError('找不到购买凭证。请重新开始购买流程。');
      setStatus('失败');
      return;
    }
    const secrets = JSON.parse(secretsJSON);
    const leafIndex = allBooks.findIndex(b => b.id === secrets.bookId);
    if (leafIndex === -1) {
        setError('购买凭证中的书籍ID无效。');
        setStatus('失败');
        return;
    }
    selectedBookRef.current = allBooks[leafIndex];

    // ✅ **核心修复：将 socket 实例的创建和事件绑定放在 useEffect 内部**
    const socket = new WebSocket(WS_URL + `/ws/api/purchase/${purchaseId}`);
    ws.current = socket;

    socket.onopen = () => {
      setStatus('已连接。正在初始化验证...');
      socket.send(JSON.stringify({ type: 'INIT', token }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'ZKP_READY': {
            setStatus('正在生成隐私证明...');
            await getPoseidon();
            const tree = await buildMerkleTree(allBooks);
            const proofPath = getMerkleProof(tree, leafIndex);
            
            const priceCents = selectedBookRef.current.price_cents;
            const commitment = poseidonHash([uuidToBigIntString(secrets.bookId), secrets.nonce, priceCents.toString()]);
            
            const inputs = generateZkpInputs(
                selectedBookRef.current, 
                secrets.nonce, 
                proofPath, 
                tree.root.toString(),
                commitment
            );
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, "/zkp/circuit.wasm", "/zkp/circuit_final.zkey");
            setStatus('正在发送证明以供验证...');
            socket.send(JSON.stringify({ type: 'ZKP_PROVE', payload: { proof, publicSignals } }));
            break;
          }

          case 'OT_START': {
            setStatus('证明已验证！正在启动安全下载协议...');
            const { numBooks } = data.payload;
            const choiceBitCount = numBooks > 1 ? Math.ceil(Math.log2(numBooks)) : 0;
            const choiceBinary = leafIndex.toString(2).padStart(choiceBitCount, '0');
            otState.current.choiceBits = choiceBinary.split('').map(Number).reverse();
            socket.send(JSON.stringify({ type: 'OT_ACK_START' }));
            break;
          }

          case 'OT_ROUND_START': {
            const { round } = data.payload;
            setStatus(`正在执行安全交换第 ${round + 1} / ${otState.current.choiceBits.length} 轮...`);
            
            const clientKeyPair = generateClientOtKeyPair();
            otState.current.roundKeys.push(clientKeyPair);

            socket.send(JSON.stringify({
              type: 'OT_ROUND_RESPONSE',
              payload: { round, clientPublicKey: uint8ArrayToHex(clientKeyPair.publicKey) }
            }));
            break;
          }

          case 'OT_ROUND_CHALLENGE': {
            const { round: completedRound, g0, g1, e0, e1 } = data.payload;
            
            const choice = otState.current.choiceBits[completedRound];
            const serverPublicKeyHex = choice === 0 ? g0 : g1;
            const serverPublicKey = hexToUint8Array(serverPublicKeyHex);
            
            const clientPrivateKey = otState.current.roundKeys[completedRound].privateKey;
            
            const sharedSecretKey = await deriveClientSharedSecret(clientPrivateKey, serverPublicKey);
            
            const encryptedSeedHex = choice === 0 ? e0 : e1;
            
            const decryptedSeed = await aesGcmDecrypt(encryptedSeedHex, sharedSecretKey);
            otState.current.collectedSeeds.push(decryptedSeed);

            setStatus(`安全交换第 ${completedRound + 1} 轮完成。`);
            
            if (completedRound + 1 === otState.current.choiceBits.length) {
                console.log('[OT-CLIENT] 所有轮次挑战已处理，向服务器请求最终数据...');
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({ type: 'OT_ROUNDS_COMPLETE' }));
                }
            }
            break;
          }

          case 'OT_DELIVER': {
            setStatus('所有轮次完成。正在解密最终的书籍密钥...');
            const { encryptedSecrets } = data.payload;

            const masterKey = xorBuffers(otState.current.collectedSeeds, 32);
            
            const masterCryptoKey = await window.crypto.subtle.importKey('raw', masterKey, { name: 'AES-GCM'}, true, ['decrypt']);
            
            const encryptedBookKeyHex = encryptedSecrets[leafIndex];
            
            const bookSecretKey = await aesGcmDecrypt(encryptedBookKeyHex, masterCryptoKey);
            otState.current.finalBookKey = await window.crypto.subtle.importKey('raw', bookSecretKey, { name: 'AES-GCM'}, true, ['decrypt']);

            setStatus('书籍密钥解密成功。正在请求下载链接...');
            socket.send(JSON.stringify({ type: 'REQUEST_SIGNED_URL', payload: { bookIndex: leafIndex } }));
            break;
          }
        
          case 'SIGNED_URL': {
            setStatus('正在下载书籍文件...');
            const { signedUrl } = data.payload;
            const response = await fetch(signedUrl);
            if (!response.ok) throw new Error(`下载失败，状态码: ${response.status}`);
            const encryptedBookBuffer = await response.arrayBuffer();

            setStatus('正在解密书籍...');
            const finalKey = otState.current.finalBookKey;
            const iv = encryptedBookBuffer.slice(0, 12);
            const dataToDecrypt = encryptedBookBuffer.slice(12);
            const decryptedBook = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, finalKey, dataToDecrypt);
            
            const blob = new Blob([decryptedBook], { type: 'application/pdf' });
            const objectUrl = URL.createObjectURL(blob);
            setDownloadUrl(objectUrl);
            setStatus('下载已就绪！');
            localStorage.removeItem(secretKey);
            
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ type: 'DOWNLOAD_READY' }));
            }
            break;
          }
        }
      } catch (err) {
        const currentStatus = statusRef.current;
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`错误发生于 "${currentStatus}" 阶段: ${errorMessage}`);
        if(ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.close(4000, '客户端错误');
        }
      }
    };
    
    socket.onerror = (event) => {
        console.error("WebSocket Error:", event);
        setError('WebSocket连接发生错误。');
    };
    socket.onclose = (event) => { 
        if (!event.wasClean) {
            console.log(`WebSocket unclean close: Code=${event.code}, Reason=${event.reason}`);
            setStatus('连接已断开。');
        }
    };

    // ✅ **核心修复：返回一个更健壮的清理函数**
    return () => {
        console.log("Cleanup function called. Closing WebSocket.");
        // 在关闭之前，移除所有事件监听器，防止它们在卸载后意外触发
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        // 关闭连接
        socket.close();
        ws.current = null;
    };
  }, [purchaseId, token, allBooks, isLoadingBooks]);

  return (
    <div>
      <h1>购买验证</h1>
      <p><strong>状态:</strong> {status}</p>
      {error && <p style={{ color: 'red' }}><strong>错误:</strong> {error}</p>}
      {downloadUrl && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid green', borderRadius: '5px' }}>
          <h2>您的书籍已准备就绪！</h2>
          <a href={downloadUrl} download={`${selectedBookRef.current?.title || 'book'}.pdf`}>
            立即下载
          </a>
        </div>
      )}
    </div>
  );
};

export default VerifyDownloadPage;