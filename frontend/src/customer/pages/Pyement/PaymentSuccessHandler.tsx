// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Pyement/PaymentSuccessHandler.tsx
import { Backdrop, Button, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PaymentSuccessHandler = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(true);

    // ✅ Get params from BOTH query string AND location.state
    const getParam = (key: string): string | null => {
        // Try query string first (URL: ?key=value)
        const params = new URLSearchParams(location.search);
        const queryValue = params.get(key);
        if (queryValue) return queryValue;
        
        // Fallback to location.state (from navigate() state object)
        const state = location.state as Record<string, string> | null;
        return state?.[key] || null;
    };
    
    // ✅ Support multiple parameter name variations for flexibility
    const paymentOrderId = 
        getParam("payment_order_id") || 
        getParam("paymentId") || 
        getParam("orderId") ||
        getParam("paymentLinkId");

    const paymentId = 
        getParam("razorpay_payment_id") || 
        getParam("paymentId");

    useEffect(() => {
        // ✅ NO verification needed here - already done in AddressPage.tsx
        // Just display the success page
        
        console.log("📄 Payment success page loaded:", {
            paymentOrderId,
            paymentId,
            locationState: location.state
        });
        
        // ✅ Just set processing to false - no API call needed
        setProcessing(false);
        
    }, []);  // Empty dependency array - runs once on mount

    // Show loading spinner briefly (for better UX)
    if (processing) {
        return (
            <Backdrop
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={true}
            >
                <CircularProgress color="inherit" size={60} />
            </Backdrop>
        );
    }

    // ✅ Always show success page (verification already done in AddressPage)
    return (
        <div className="min-h-[90vh] flex justify-center items-center px-4">
            <div className="bg-primary-color text-white p-8 w-[90%] lg:w-[25%] border rounded-md h-auto min-h-[40vh] flex flex-col gap-7 items-center justify-center">
                {/* Success Icon */}
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                    <svg 
                        className="w-12 h-12 text-white" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M5 13l4 4L19 7" 
                        />
                    </svg>
                </div>

                {/* Success Messages */}
                <h1 className="text-3xl font-semibold text-center">Congratulations!</h1>
                <h1 className="text-2xl font-semibold text-center">Your Order Was Successful</h1>
                
                {/* Optional: Show order details if available */}
                {paymentOrderId && (
                    <div className="text-center text-sm opacity-90">
                        <p>Order ID: {paymentOrderId.slice(0, 12)}...</p>
                    </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                    {/* View Orders Button */}
                    <Button 
                        onClick={() => navigate('/account/orders')} 
                        variant="contained" 
                        color="secondary"
                        fullWidth
                        sx={{ maxWidth: 200 }}
                    >
                        View Orders
                    </Button>
                    
                    {/* Continue Shopping Button */}
                    <Button 
                        onClick={() => navigate('/')} 
                        variant="outlined"
                        fullWidth
                        sx={{ 
                            color: 'white', 
                            borderColor: 'white',
                            maxWidth: 200,
                            '&:hover': { 
                                borderColor: 'white', 
                                backgroundColor: 'rgba(255,255,255,0.1)' 
                            } 
                        }}
                    >
                        Continue Shopping
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessHandler;