// src/pages/VerifyDownloadPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { getAllBooksRaw } from '../api/booksApi';
import * as snarkjs from 'snarkjs';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Alert, 
  Button, 
  CircularProgress, 
  Step, 
  Stepper, 
  StepLabel 
} from '@mui/material';
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

import { 
  getPoseidon, 
  buildMerkleTree, 
  getMerkleProof, 
  generateZkpInputs,
  uuidToBigIntString,
  poseidonHash
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
      setError('Cannot find purchase proof. Please start the purchase process again.');
      setStatus('Failed');
      return;
    }
    const secrets = JSON.parse(secretsJSON);
    const leafIndex = allBooks.findIndex(b => b.id === secrets.bookId);
    if (leafIndex === -1) {
        setError('Invalid book ID in purchase proof.');
        setStatus('Failed');
        return;
    }
    selectedBookRef.current = allBooks[leafIndex];

    const socket = new WebSocket(WS_URL + `/ws/api/purchase/${purchaseId}`);
    ws.current = socket;

    socket.onopen = () => {
      setStatus('Connected. Initializing verification...');
      socket.send(JSON.stringify({ type: 'INIT', token }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'ZKP_READY': {
            setStatus('Generating privacy proof...');
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
            setStatus('Sending proof for verification...');
            socket.send(JSON.stringify({ type: 'ZKP_PROVE', payload: { proof, publicSignals } }));
            break;
          }
          case 'OT_START': {
            setStatus('Proof verified! Starting secure download protocol...');
            const { numBooks } = data.payload;
            const choiceBitCount = numBooks > 1 ? Math.ceil(Math.log2(numBooks)) : 0;
            const choiceBinary = leafIndex.toString(2).padStart(choiceBitCount, '0');
            otState.current.choiceBits = choiceBinary.split('').map(Number).reverse();
            socket.send(JSON.stringify({ type: 'OT_ACK_START' }));
            break;
          }
          case 'OT_ROUND_START': {
            const { round } = data.payload;
            setStatus(`Executing secure exchange round ${round + 1} / ${otState.current.choiceBits.length}...`);
            
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

            setStatus(`Secure exchange round ${completedRound + 1} completed.`);
            
            if (completedRound + 1 === otState.current.choiceBits.length) {
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({ type: 'OT_ROUNDS_COMPLETE' }));
                }
            }
            break;
          }
          case 'OT_DELIVER': {
            setStatus('All rounds completed. Decrypting final book key...');
            const { encryptedSecrets } = data.payload;
            const masterKey = xorBuffers(otState.current.collectedSeeds, 32);
            const masterCryptoKey = await window.crypto.subtle.importKey('raw', masterKey, { name: 'AES-GCM'}, true, ['decrypt']);
            const encryptedBookKeyHex = encryptedSecrets[leafIndex];
            const bookSecretKey = await aesGcmDecrypt(encryptedBookKeyHex, masterCryptoKey);
            otState.current.finalBookKey = await window.crypto.subtle.importKey('raw', bookSecretKey, { name: 'AES-GCM'}, true, ['decrypt']);

            setStatus('Book key decryption successful. Requesting download link...');
            socket.send(JSON.stringify({ type: 'REQUEST_SIGNED_URL', payload: { bookIndex: leafIndex } }));
            break;
          }
          case 'SIGNED_URL': {
            setStatus('Downloading book file...');
            const { signedUrl } = data.payload;
            const response = await fetch(signedUrl);
            if (!response.ok) throw new Error(`Download failed, status code: ${response.status}`);
            const encryptedBookBuffer = await response.arrayBuffer();

            setStatus('Decrypting book...');
            const finalKey = otState.current.finalBookKey;
            const iv = encryptedBookBuffer.slice(0, 12);
            const dataToDecrypt = encryptedBookBuffer.slice(12);
            const decryptedBook = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, finalKey, dataToDecrypt);
            
            const blob = new Blob([decryptedBook], { type: 'application/pdf' });
            const objectUrl = URL.createObjectURL(blob);
            setDownloadUrl(objectUrl);
            setStatus('Download ready!');
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
        setError(`Error occurred at "${currentStatus}" stage: ${errorMessage}`);
        if(ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.close(4000, 'Client error');
        }
      }
    };
    
    socket.onerror = (event) => {
        console.error("WebSocket Error:", event);
        setError('WebSocket connection error.');
    };
    socket.onclose = (event) => { 
        if (!event.wasClean) {
            console.log(`WebSocket unclean close: Code=${event.code}, Reason=${event.reason}`);
            setStatus('Connection closed.');
        }
    };

    return () => {
        console.log("Cleanup function called. Closing WebSocket.");
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
        ws.current = null;
    };
  }, [purchaseId, token, allBooks, isLoadingBooks]);

  const steps = [
    'Initialize connection',
    'Generate privacy proof',
    'Secure key exchange',
    'Decrypt and download',
    'Completed',
  ];

  const getActiveStep = () => {
    if (error) {
        if (status.includes('proof')) return 1;
        if (status.includes('exchange')) return 2;
        if (status.includes('decrypt') || status.includes('download')) return 3;
        return 0;
    }
    if (downloadUrl) return 4;
    if (status.includes('decrypt') || status.includes('download')) return 3;
    if (status.includes('exchange') || status.includes('verified!')) return 2;
    if (status.includes('proof')) return 1;
    return 0;
  };

  const activeStep = getActiveStep();

  const renderContent = () => {
    if (error) {
      return (
        <Alert severity="error" icon={<ErrorIcon fontSize="inherit" />}>
          <Typography variant="h6">Operation failed</Typography>
          {error}
        </Alert>
      );
    }
    if (downloadUrl) {
      return (
        <Box sx={{ textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }}/>
          <Typography variant="h5" gutterBottom>Your book is ready!</Typography>
          <Button 
            href={downloadUrl} 
            download={`${selectedBookRef.current?.title || 'book'}.pdf`}
            variant="contained"
            size="large"
            startIcon={<DownloadForOfflineIcon />}
          >
            Download now
          </Button>
        </Box>
      );
    }
    // Loading or processing
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', p: 2 }}>
        <CircularProgress sx={{ mb: 2 }}/>
        <Typography variant="body1">{status}</Typography>
      </Box>
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Secure download process
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          We are verifying your purchase and protecting your privacy through zero-knowledge proofs and secure protocols.
        </Typography>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label} completed={activeStep > index || !!downloadUrl}>
              <StepLabel error={!!(error && activeStep === index)}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4, p: 3, border: '1px solid #eee', borderRadius: '8px', minHeight: 150, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {renderContent()}
        </Box>
      </Paper>
    </Container>
  );
};

export default VerifyDownloadPage;