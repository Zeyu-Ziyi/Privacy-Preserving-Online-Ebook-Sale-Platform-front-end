// src/pages/BookPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBookById, getAllBooks } from '../api/booksApi';
import { createOrder } from '../api/apiService';
import { useAuthStore } from '../store/useAuthStore';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  useStripe, 
  useElements, 
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement
} from '@stripe/react-stripe-js';
import { 
  getPoseidon, 
  generateNonce, 
  poseidonHash, 
  uuidToBigIntString
} from '../lib/zkpUtils';
import { 
  Container, 
  Grid, 
  Typography, 
  Button, 
  Box, 
  CircularProgress, 
  Divider,
  Alert 
} from '@mui/material';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// --- Internal payment form component  ---
const CheckoutForm = ({ book, commitment, nonce }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    try {
      const response = await createOrder(commitment, book.price_cents);
      const { orderId, clientSecret } = response.data;

      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
        },
      });

      if (paymentResult.error) {
        setError(`Payment failed: ${paymentResult.error.message}`);
        setLoading(false);
      } else {
        if (paymentResult.paymentIntent.status === 'succeeded') {
          const secrets = { bookId: book.id, nonce: nonce, price: book.price_cents };
          localStorage.setItem(`purchaseSecrets_${orderId}`, JSON.stringify(secrets));
          navigate(`/verify/${orderId}`);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Create order failed, please try again.');
      setLoading(false);
    }
  };
  
  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  };

  const inputWrapperStyle = {
    p: '12px 16px',
    border: '1px solid #ddd', 
    borderRadius: '4px',
    backgroundColor: '#fff',
    width: '100px',
  };

  const inputNumberStyle = {
    p: '12px 16px',
    border: '1px solid #ddd', 
    borderRadius: '4px',
    backgroundColor: '#fff',
    width: '250px',
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Credit card information
      </Typography>
      
      <Grid container spacing={2}>
        {/* Card number input box */}
        <Grid item xs={12}>
          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>Card number</Typography>
          <Box sx={inputNumberStyle}>
            <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
          </Box>
        </Grid>
        {/* Expiration date input box */}

        <Grid item xs={12}>
          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>Expiration date (MM/YY)</Typography>
          <Box sx={inputWrapperStyle}>
            <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
          </Box>
        </Grid>
        {/* CVC input box */}
        <Grid item xs={12}>
          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>CVC</Typography>
          <Box sx={inputWrapperStyle}>
            <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
          </Box>
        </Grid>
      </Grid>
      
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      <Button 
        type="submit" 
        disabled={!stripe || loading}
        fullWidth 
        variant="contained" 
        size="large"
        sx={{ mt: 3 }} 
      >
        {loading ? <CircularProgress size={24} /> : `Confirm payment $${(book.price_cents / 100).toFixed(2)}`}
      </Button>
    </form>
  );
};


// --- Main BookPage component ---
const BookPage = () => {
  const { id } = useParams();
  
  const { data: book, isLoading: isLoadingBook } = useQuery({ 
    queryKey: ['book', id], 
    queryFn: () => getBookById(id) 
  });
  
  const { data: allBooksData, isLoading: isLoadingAllBooks } = useQuery({ 
    queryKey: ['allBooks'], 
    queryFn: getAllBooks 
  });

  const [showPayment, setShowPayment] = useState(false);
  const [purchaseData, setPurchaseData] = useState(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handlePreparePurchase = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!allBooksData || !book) return;
    
    setIsPreparing(true);
    await getPoseidon();
    const nonce = generateNonce();
    const commitment = poseidonHash([
      uuidToBigIntString(book.id), 
      nonce, 
      book.price_cents.toString()
    ]);
    
    setPurchaseData({ commitment, nonce });
    setShowPayment(true);
    setIsPreparing(false);
  };

  if (isLoadingBook || isLoadingAllBooks) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!book) {
    return <Typography variant="h5" align="center" sx={{ mt: 4 }}>Book not found.</Typography>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            {book.title}
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary" gutterBottom>
            Author: {book.author}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
            {book.description}
          </Typography>
          
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
              ${(book.price_cents / 100).toFixed(2)}
            </Typography>

            {!showPayment ? (
              <Button 
                variant="contained" 
                color="primary" 
                size="large" 
                fullWidth 
                onClick={handlePreparePurchase}
                disabled={isPreparing}
                sx={{ maxWidth: '400px' }}
              >
                {isPreparing ? <CircularProgress size={24} /> : 'Buy now'}
              </Button>
            ) : (
              <Elements stripe={stripePromise}>
                <CheckoutForm 
                  book={book} 
                  commitment={purchaseData.commitment} 
                  nonce={purchaseData.nonce} 
                />
              </Elements>
            )}


        </Grid>
      </Grid>
    </Container>
  );
};

export default BookPage;