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
  poseidonHash
} from '../lib/zkpUtils';

// --- ✅ 导入最终的、基于 Web Crypto API 的 OT 辅助函数 ---
import { generateClientKeys, decryptChosenKey } from '../lib/otUtils';

const WS_URL = 'ws://localhost:3000';

const VerifyDownloadPage = () => {
  const { purchaseId } = useParams();
  const { token } = useAuthStore();
  const [status, setStatus] = useState('Preparing...');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const ws = useRef(null);
  // --- ✅ 现在存储整个密钥对，而不仅仅是私钥 ---
  const otClientKeyPair = useRef(null);
  const selectedBookRef = useRef(null); // 用于在下载时获取书名

  const { data: allBooks, isLoading: isLoadingBooks } = useQuery({
    queryKey: ['allBooksRaw'],
    queryFn: getAllBooksRaw,
  });

  useEffect(() => {
    if (!token || !purchaseId || isLoadingBooks || !allBooks || !Array.isArray(allBooks)) {
      if (isLoadingBooks) setStatus('Loading book data...');
      return;
    }
    
    const secretKey = `purchaseSecrets_${purchaseId}`;
    const secretsJSON = localStorage.getItem(secretKey);
    if (!secretsJSON) {
      setError('Purchase secrets not found. Please start the purchase process again.');
      setStatus('Failed');
      return;
    }
    
    const secrets = JSON.parse(secretsJSON);
    const selectedBook = allBooks.find(b => b.id === secrets.bookId);
    selectedBookRef.current = selectedBook; // 存储书本信息
    const leafIndex = allBooks.findIndex(b => b.id === secrets.bookId);

    if (!selectedBook || leafIndex === -1) {
      setError('Book data mismatch. Cannot proceed.');
      setStatus('Failed');
      return;
    }

    const socket = new WebSocket(WS_URL + `/ws/api/purchase/${purchaseId}`);
    ws.current = socket;

    socket.onopen = () => {
      setStatus('Connected. Initializing verification...');
      socket.send(JSON.stringify({ type: 'INIT', token }));
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'ZKP_READY':
          setStatus('Generating private proof (this may take a moment)...');
          try {
            await getPoseidon();
            const tree = await buildMerkleTree(allBooks);
            const proofPath = getMerkleProof(tree, leafIndex);
            const commitment = poseidonHash([uuidToBigIntString(secrets.bookId), secrets.nonce, secrets.price.toString()]);
            const inputs = generateZkpInputs(selectedBook, secrets.nonce, proofPath, tree.root, commitment);
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, "/zkp/circuit.wasm", "/zkp/circuit_final.zkey");
            setStatus('Sending proof for verification...');
            socket.send(JSON.stringify({ type: 'ZKP_PROVE', payload: { proof, publicSignals } }));
          } catch (err) {
            console.error('ZKP Generation Error:', err);
            setError('Failed to generate the private proof.');
            socket.close(4000, 'ZKP generation failed on client.');
          }
          break;
        
        // --- ✅ 使用新的 async OT 流程 ---
        case 'OT_READY':
          setStatus('Proof verified! Starting secure key exchange...');
          try {
            const { keyPair, publicKey } = await generateClientKeys();
            otClientKeyPair.current = keyPair; // 存储密钥对
            socket.send(JSON.stringify({ type: 'OT_START', payload: { publicKey } }));
          } catch (err) {
            console.error('OT Key Generation Error:', err);
            setError('Failed to generate cryptographic keys.');
            socket.close(4001, 'OT key generation failed.');
          }
          break;

        case 'OT_CHALLENGE':
          setStatus('Secure exchange complete. Decrypting final key...');
          try {
            const { otResponses, signedUrls } = data.payload;
            const chosenServerResponse = otResponses[leafIndex];
            const chosenSignedUrl = signedUrls[leafIndex];

            const decryptedBookKeyHex = await decryptChosenKey(
              otClientKeyPair.current.privateKey, // 传递私钥对象
              chosenServerResponse.serverTempPublicKey,
              chosenServerResponse.encryptedBookKey
            );

            setStatus('Downloading and decrypting book...');
            const encryptedBookResponse = await fetch(chosenSignedUrl);
            if (!encryptedBookResponse.ok) {
              throw new Error(`Failed to download book file: ${encryptedBookResponse.statusText}`);
            }
            const encryptedBookArrayBuffer = await encryptedBookResponse.arrayBuffer();
            
            const keyData = Uint8Array.from(Buffer.from(decryptedBookKeyHex, 'hex'));
            const cryptoKey = await window.crypto.subtle.importKey('raw', keyData, 'AES-GCM', false, ['decrypt']);
            
            const iv = encryptedBookArrayBuffer.slice(0, 12);
            const dataToDecrypt = encryptedBookArrayBuffer.slice(12);

            const decryptedFile = await window.crypto.subtle.decrypt(
              { name: 'AES-GCM', iv: iv },
              cryptoKey,
              dataToDecrypt
            );
            
            const blob = new Blob([decryptedFile], { type: 'application/pdf' });
            const objectUrl = URL.createObjectURL(blob);
            setDownloadUrl(objectUrl);
            setStatus('Download ready!');

            localStorage.removeItem(secretKey);
            socket.close(1000, 'Purchase completed.');

          } catch (err) {
            console.error('Decryption failed:', err);
            setError('Failed to decrypt the book file. The key may be incorrect or the file may be corrupt.');
            socket.close(4002, 'Decryption failed.');
          }
          break;
      }
    };
    
    socket.onerror = () => setError('Connection error. Please refresh the page.');
    socket.onclose = (event) => {
      if (!event.wasClean) setError(`Connection lost: ${event.reason || 'Please try again.'}`);
    };

    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) ws.current.close();
    };
  }, [purchaseId, token, allBooks, isLoadingBooks]);

  return (
    <div>
      <h1>Purchase Verification</h1>
      <p><strong>Purchase ID:</strong> {purchaseId}</p>
      <hr />
      <h3>Status: {status}</h3>
      {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
      
      {downloadUrl && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid green', borderRadius: '5px' }}>
          <h2>Your book is ready!</h2>
          <p>(This link is signed, temporary, and private)</p>
          <a href={downloadUrl} download={`${selectedBookRef.current?.title || 'book'}.pdf`}>
            Download Now
          </a>
        </div>
      )}
    </div>
  );
};

export default VerifyDownloadPage;

