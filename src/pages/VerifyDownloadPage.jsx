import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore'; //
import { useQuery } from '@tanstack/react-query';
import { getAllBooks } from '../api/booksApi'; // 我们需要所有书籍来构建树和获取索引

// 导入 SNARKJS 和 ZKP 辅助函数
import * as snarkjs from 'snarkjs';
import { getPoseidon, buildMerkleTree, getMerkleProof, generateZkpInputs, poseidonHash } from '../lib/zkpUtils';

// 假设您的后端 WebSocket 运行在同一主机的 3000 端口
// 在生产环境中，您需要使用 'wss://your-api-domain.com'
const WS_URL = 'ws://localhost:3000'; // 或者您的 API 基础 URL 的 WS 版本

const VerifyDownloadPage = () => {
  const { purchaseId } = useParams();
  const { token } = useAuthStore();
  const [status, setStatus] = useState('Preparing...');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const ws = useRef(null);

  // 1. 我们需要获取所有书籍数据
  const { data: allBooks, isLoading: isLoadingBooks } = useQuery(['allBooks'], getAllBooks);

  useEffect(() => {
    // 确保我们已获取书籍数据并且拥有token
    if (!token || !purchaseId || isLoadingBooks || !allBooks) {
      if (isLoadingBooks) setStatus('Loading book data...');
      return;
    }

    // --- 准备阶段：检索秘密 ---
    const secretKey = `purchaseSecrets_${purchaseId}`;
    const secretsJSON = localStorage.getItem(secretKey);

    if (!secretsJSON) {
      setError('Error: Could not find purchase secrets. Please start the purchase process again.');
      return;
    }
    
    const secrets = JSON.parse(secretsJSON);
    const selectedBook = allBooks.find(b => b.id === secrets.bookId);
    const leafIndex = allBooks.findIndex(b => b.id === secrets.bookId);

    if (!selectedBook || leafIndex === -1) {
         setError('Book data mismatch. Cannot proceed.');
         return;
    }

    // --- WebSocket 连接 ---
    // 构建 WebSocket URL 以匹配您的后端路由
    const wsPath = `/api/purchase/${purchaseId}`; 
    const socket = new WebSocket(WS_URL + wsPath);
    ws.current = socket;

    socket.onopen = () => {
      setStatus('Connected. Initializing verification...');
      // 1. 发送 INIT 消息 (匹配 purchase.ts)
      socket.send(JSON.stringify({
        type: 'INIT',
        token: token,
      }));
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        // 2. 收到 ZKP_READY：这是我们生成并发送证明的信号
        case 'ZKP_READY': {
          setStatus('Server ready. Generating ZK-Proof (this may take a minute)...');
          
          try {
            const poseidon = await getPoseidon();
            
            // 2a. 重建 Merkle 树并获取证明
            const tree = await buildMerkleTree(allBooks);
            const proofPath = getMerkleProof(tree, leafIndex);
            
            // 2b. 重新计算承诺 (以防万一，并用于公开输入)
            const commitment = poseidonHash([secrets.bookId.toString(), secrets.nonce]);

            // 2c. 准备电路的完整输入
            const inputs = generateZkpInputs(selectedBook, secrets.nonce, proofPath, tree.root, commitment);

            // 2d. 生成证明！这是 CPU 密集型操作
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
              inputs,
              "/zkp/circuit.wasm",           // URL 指向 public 文件夹
              "/zkp/circuit_final.zkey"  // URL 指向 public 文件夹
            );

            // 2e. 发送证明到服务器
            setStatus('Proof generated. Sending for verification...');
            socket.send(JSON.stringify({
              type: 'ZKP_PROVE',
              payload: { proof, publicSignals },
            })); //

          } catch (err) {
            console.error('ZKP Generation Error:', err);
            setError('Failed to generate ZK-Proof.');
            socket.close(1011, 'ZKP generation failed.');
          }
          break;
        }

        // 3. 收到 OT_READY：证明已验证！是时候选择我们的书了
        case 'OT_READY': {
          setStatus('Proof verified! Preparing secure download...');
          // 发送我们想要的书籍的索引
          socket.send(JSON.stringify({
            type: 'OT_SELECT',
            payload: { choiceIndex: leafIndex },
          })); //
          break;
        }

        // 4. 收到 OT_RESULT：这是包含我们链接的加密数组
        case 'OT_RESULT': {
          setStatus('Secure download ready!');
          const encryptedLinks = data.payload;
          
          // "解密" (在您的简化 OT 设计中, 我们只需在已知索引处选取正确的链接)
          const realLink = encryptedLinks[leafIndex].replace('ENCRYPTED(', '').replace(')', '');
          
          setDownloadUrl(realLink);
          
          // 清理 localStorage 中的秘密
          localStorage.removeItem(secretKey);
          socket.close(1000, 'Purchase completed.');
          break;
        }
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket Error:', err);
      setError('A connection error occurred.');
    };

    socket.onclose = (event) => {
      setStatus(`Connection closed. Code: ${event.code}`);
      if (!event.wasClean) {
          setError(`Connection closed unexpectedly: ${event.reason || 'Unknown error'}`);
      }
    };

    // 清理函数
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, [purchaseId, token, allBooks, isLoadingBooks]); // 依赖数组

  return (
    <div>
      <h1>Purchase Verification</h1>
      <p>Purchase ID: {purchaseId}</p>
      <hr />
      <h3>Status: {status}</h3>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {downloadUrl && (
        <div>
          <h2>Your download is ready!</h2>
          <p>(This link is signed, temporary, and private)</p>
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
            Download Your Book
          </a>
        </div>
      )}
    </div>
  );
};

export default VerifyDownloadPage;