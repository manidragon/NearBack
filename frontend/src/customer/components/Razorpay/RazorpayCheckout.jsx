// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\components\Razorpay\RazorpayCheckout.jsx
import { useEffect } from 'react';

const RazorpayCheckout = ({ orderData, onSuccess, onError, onClose }) => {
  
  useEffect(() => {
    if (!orderData) return;

    // ✅ Load Razorpay SDK dynamically
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const initializePayment = async () => {
      const scriptLoaded = await loadRazorpayScript();
      
      if (!scriptLoaded) {
        onError('Failed to load Razorpay SDK. Please check your internet connection.');
        return;
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID', // Your Key ID
        amount: orderData.amount,
        currency: orderData.currency,
        name: "MANIVASAGAN",
        description: "Order Payment",
        order_id: orderData.order_id,
        handler: function (response) {
          // ✅ Payment successful
          console.log("✅ Payment successful:", response);
          onSuccess(response);
        },
        prefill: {
          name: orderData.customer.name,
          email: orderData.customer.email,
          contact: orderData.customer.contact
        },
        theme: {
          color: "#3399cc",
          backdrop_color: "#ffffff"
        },
        modal: {
          ondismiss: function() {
            console.log("Payment modal closed by user");
            if (onClose) onClose();
          }
        },
        config: {
          display: {
            blocks: {
              utib: {
                name: 'Axis Bank',
                instruments: [
                  { method: 'card', issuers: ['UTIB'] },
                  { method: 'netbanking', issuers: ['UTIB'] }
                ]
              }
            },
            hide: [],
            sequence: ['block.utib', 'card', 'netbanking', 'upi', 'wallet'],
            preferences: {
              show_default_blocks: true
            }
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      // ✅ Handle payment errors
      rzp.on('payment.failed', function (response) {
        console.error("❌ Payment failed:", response.error);
        onError(response.error.description || response.error.reason);
      });

      // ✅ Open the modal (desktop view)
      rzp.open();
    };

    initializePayment();

  }, [orderData, onSuccess, onError, onClose]);

  return null; // This component doesn't render anything visible
};

export default RazorpayCheckout;