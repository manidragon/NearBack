// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Checkout\CheckoutPage.jsx
import { useState } from 'react';
import axios from 'axios';
import RazorpayCheckout from '../components/RazorpayCheckout';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState(null);
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [error, setError] = useState(null);

  const handleProceedToCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get cart and address from your state/context
      const cart = JSON.parse(localStorage.getItem('cart'));
      const shippingAddress = JSON.parse(localStorage.getItem('shippingAddress'));

      const response = await axios.post(
        'http://localhost:8080/api/orders?paymentMethod=RAZORPAY',
        {
          shippingAddress: shippingAddress,
          fulfillmentType: 'DELIVERY'
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success && response.data.type === 'RAZORPAY_ORDER') {
        // ✅ Store payment order ID for callback
        setPaymentOrderId(response.data.paymentOrderId);
        // ✅ Open Razorpay modal
        setRazorpayOrder(response.data.razorpayOrder);
      } else if (response.data.type === 'PAYMENT_LINK') {
        // Fallback to payment link
        window.open(response.data.payment_link_url, '_blank');
      }

    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.response?.data?.message || 'Failed to proceed to checkout');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    console.log("Payment success response:", response);
    
    try {
      // ✅ Notify backend about successful payment
      await axios.get(
        `http://localhost:8080/api/payment/${response.razorpay_payment_id}?paymentLinkId=${paymentOrderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // ✅ Clear cart and redirect
      localStorage.removeItem('cart');
      navigate('/payment-success', { 
        state: { 
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature
        }
      });

    } catch (err) {
      console.error("Payment verification error:", err);
      setError('Payment succeeded but verification failed. Please contact support.');
    }
  };

  const handlePaymentError = (errorMsg) => {
    console.error("Payment error:", errorMsg);
    setError(errorMsg);
    setRazorpayOrder(null);
  };

  const handleModalClose = () => {
    setRazorpayOrder(null);
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h2>Checkout</h2>
        
        {error && (
          <div className="error-message" style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>
            {error}
          </div>
        )}

        <div className="order-summary">
          <h3>Order Summary</h3>
          <p>Total Amount: ₹{cart?.totalSellingPrice || 0}</p>
        </div>

        <button
          onClick={handleProceedToCheckout}
          disabled={loading}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            backgroundColor: '#3399cc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'Proceed to Checkout'}
        </button>
      </div>

      {/* ✅ Razorpay Modal Component */}
      {razorpayOrder && (
        <RazorpayCheckout
          orderData={razorpayOrder}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default CheckoutPage;