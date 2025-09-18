import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBookById, getAllBooks } from '../api/booksApi';
import { createOrder } from '../api/apiService'; // <-- 关键修改：从新的API文件导入
import { useAuthStore } from '../store/useAuthStore';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

// 导入所有需要的 ZKP 辅助函数
import { 
  getPoseidon, 
  generateNonce, 
  poseidonHash, 
  uuidToBigIntString
} from '../lib/zkpUtils';

// Stripe 公钥 (请确保这与您 Stripe 账户中的密钥匹配)
const stripePromise = loadStripe('pk_test_51Q6XWQKD7xEKEswAieTpHB683siSWLdEycgHyZgKqVqHC7RYHUOmf39w1s0OqwHGOQS36GsytMGrllo1rDbZzRi500UorAz8ZZ');

// 内部支付表单组件
const CheckoutForm = ({ book, commitment, nonce }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    try {
      // 1. --- 关键修改: 现在使用专用的 createOrder 函数 ---
      const response = await createOrder(commitment, book.price_cents);

      const { orderId, clientSecret } = response.data;

      // 2. 使用 Stripe.js 确认支付
      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (paymentResult.error) {
        setError(`Payment failed: ${paymentResult.error.message}`);
        setLoading(false);
      } else {
        if (paymentResult.paymentIntent.status === 'succeeded') {
          // 3. 支付成功！将私有秘密保存到 localStorage
          const secrets = { bookId: book.id, nonce: nonce, price: book.price_cents };
          localStorage.setItem(`purchaseSecrets_${orderId}`, JSON.stringify(secrets));

          // 4. 导航到 ZKP 验证页面
          navigate(`/verify/${orderId}`);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to create order. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Card details
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' },
            },
            invalid: { color: '#9e2146' },
          },
          hidePostalCode: true
        }} />
      </label>
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : `Pay $${(book.price_cents / 100).toFixed(2)}`}
      </button>
      {error && <div>{error}</div>}
    </form>
  );
};


// 您的主 BookPage 组件
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
  const { token } = useAuthStore();

  const handlePreparePurchase = async () => {
    if (!token) {
      alert('Please log in to purchase.');
      return;
    }
    if (!allBooksData || !book) return;

    // 1. 初始化 Poseidon
    await getPoseidon();

    // 2. 生成私有秘密 nonce
    const nonce = generateNonce();

    // 3. --- 关键修改: 计算新的三输入承诺 ---
    const commitment = poseidonHash([
      uuidToBigIntString(book.id), 
      nonce, 
      book.price_cents.toString()
    ]);

    setPurchaseData({ commitment, nonce });
    setShowPayment(true);
  };

  if (isLoadingBook || isLoadingAllBooks) return <div>Loading...</div>;

  return (
    <div>
      {book ? (
        <>
          <h1>{book.title}</h1>
          <p>{book.author}</p>
          <p>{book.description}</p>
          
          {!showPayment ? (
            <button onClick={handlePreparePurchase}>Purchase Now</button>
          ) : (
            <Elements stripe={stripePromise}>
              <CheckoutForm 
                book={book} 
                commitment={purchaseData.commitment} 
                nonce={purchaseData.nonce} 
              />
            </Elements>
          )}
        </>
      ) : (
        <p>Book not found.</p>
      )}
    </div>
  );
};

export default BookPage;