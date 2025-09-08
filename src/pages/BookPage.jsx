import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBookById, getAllBooks } from '../api/booksApi'; // 假设您有 getAllBooks
import { createOrder } from '../api/apiService'; //
import { useAuthStore } from '../store/useAuthStore'; //
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

// 导入我们的 ZKP 辅助函数
import { getPoseidon, generateNonce, poseidonHash, buildMerkleTree } from '../lib/zkpUtils';

// Stripe 公钥
const stripePromise = loadStripe('pk_test_51Q6XWQKD7xEKEswAieTpHB683siSWLdEycgHyZgKqVqHC7RYHUOmf39w1s0OqwHGOQS36GsytMGrllo1rDbZzRi500UorAz8ZZ'); // 替换为您的 Stripe 公钥

// 内部支付表单组件
const CheckoutForm = ({ book, commitment, nonce, allBooksData }) => {
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
      // 1. 调用您的后端创建订单和 PaymentIntent
      // 这完全匹配您的 orders.ts
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
          // 3. 支付成功！这是关键：将私有秘密保存到 localStorage
          // 以便 VerifyDownloadPage 可以获取它们
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
      <CardElement />
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
  const { data: book, isLoading: isLoadingBook } = useQuery(['book', id], () => getBookById(id));
  
  // 我们需要获取所有书籍来构建 Merkle 树
  const { data: allBooksData, isLoading: isLoadingAllBooks } = useQuery(['allBooks'], getAllBooks);

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
    const poseidon = await getPoseidon();

    // 2. 生成私有秘密
    const nonce = generateNonce();

    // 3. 计算承诺 (Commitment)
    const commitment = poseidonHash([book.id.toString(), nonce]);

    // 准备好数据，以传递给 CheckoutForm
    setPurchaseData({ commitment, nonce });
    setShowPayment(true);
  };

  if (isLoadingBook || isLoadingAllBooks) return <div>Loading...</div>;

  return (
    <div>
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
            allBooksData={allBooksData} 
          />
        </Elements>
      )}
    </div>
  );
};

export default BookPage;