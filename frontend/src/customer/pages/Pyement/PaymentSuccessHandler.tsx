import { Backdrop, Button, CircularProgress, Alert } from "@mui/material";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { paymentSuccess } from "../../../Redux Toolkit/Customer/OrderSlice";
import { useLocation, useNavigate } from "react-router-dom";

const PaymentSuccessHandler = () => {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const orders = useAppSelector(state => state.orders);
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getQueryParam = (key: string): string | null => {
        const params = new URLSearchParams(location.search);
        return params.get(key);
    };
    
    // ✅ UPDATED: Get payment_order_id instead of razorpay_payment_id
    const paymentOrderId = getQueryParam("payment_order_id");
    
    // For backward compatibility, also check for Razorpay parameters
    const paymentId = getQueryParam("razorpay_payment_id");
    const paymentLinkId = getQueryParam("razorpay_payment_link_id");

    useEffect(() => {
        // ✅ Handle both new and old payment flows
        if (paymentOrderId) {
            // New flow: payment_order_id from our system
            setProcessing(true);
            dispatch(
                paymentSuccess({
                    paymentId: "", // Not needed for new flow
                    paymentLinkId: paymentOrderId, // Use paymentOrderId as paymentLinkId
                    jwt: localStorage.getItem("jwt") || "",
                })
            )
            .then(() => {
                setProcessing(false);
            })
            .catch((error: any) => {
                setError(error || 'Payment verification failed');
                setProcessing(false);
            });
        } 
        else if (paymentId && paymentLinkId) {
            // Old flow: Razorpay direct parameters (backward compatibility)
            setProcessing(true);
            dispatch(
                paymentSuccess({
                    paymentId,
                    paymentLinkId,
                    jwt: localStorage.getItem("jwt") || "",
                })
            )
            .then(() => {
                setProcessing(false);
            })
            .catch((error: any) => {
                setError(error || 'Payment verification failed');
                setProcessing(false);
            });
        } 
        else {
            setProcessing(false);
            setError('Invalid payment parameters');
        }
    }, [paymentOrderId, paymentId, paymentLinkId]);

    // Show loading spinner while processing
    if (processing || orders.loading) {
        return (
            <Backdrop
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={true}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        );
    }

    // Show error message if there's an error
    if (error || orders.error) {
        return (
            <div className="min-h-[90vh] flex justify-center items-center">
                <Alert severity="error">{error || orders.error}</Alert>
            </div>
        );
    }

    return (
        <div className="min-h-[90vh] flex justify-center items-center">
            <div className="bg-primary-color text-white p-8 w-[90%] lg:w-[25%] border rounded-md h-[40vh] flex flex-col gap-7 items-center justify-center">
                <h1 className="text-3xl font-semibold">Congratulations!</h1>
                <h1 className="text-2xl font-semibold">Your Order Get Success</h1>
                <div>
                    <Button onClick={()=>navigate("/")} color="secondary" variant="contained">Shopping More</Button>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessHandler;