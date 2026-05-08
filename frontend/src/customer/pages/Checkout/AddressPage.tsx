// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Checkout\AddressPage.tsx
import React, { useState, useEffect } from 'react';
import PricingCard from '../Cart/PricingCard';
import { Box, Button, FormControlLabel, Modal, Radio, RadioGroup, Alert, Snackbar, CircularProgress, Typography, TextField } from '@mui/material';
import AddressForm from './AddresssForm';
import AddressCard from './AddressCard';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { selectCart } from '../../../Redux Toolkit/Customer/CartSlice';
import { createOrder } from '../../../Redux Toolkit/Customer/OrderSlice';
import { clearCartAfterOrder } from '../../../Redux Toolkit/Customer/CartSlice';
import { useNavigate } from 'react-router-dom';
import type { Address } from '../../../types/addressTypes';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 450,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

const paymentGatewayList = [
    {
        value: "RAZORPAY",
        image: "https://razorpay.com/newsroom-content/uploads/2020/12/output-onlinepngtools-1-1.png",
        label: "Razorpay",
        icon: null
    },
    {
        value: "CASH_ON_DELIVERY",
        image: "",
        label: "Cash on Delivery",
        icon: <CurrencyRupeeIcon />
    }
];

const fulfillmentOptions = [
    { value: 'DELIVERY', label: 'Home Delivery', icon: <LocalShippingIcon /> },
    { value: 'SELF_PICKUP', label: 'Self Pickup', icon: <StorefrontIcon /> }
];

const AddressPage = () => {
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'SELF_PICKUP'>('DELIVERY');
    const [selectedPickupTime, setSelectedPickupTime] = useState<Dayjs | null>(null);
    const [pickupTimeError, setPickupTimeError] = useState<string>('');

    // ✅ NEW: State for Razorpay modal
    const [razorpayOrderData, setRazorpayOrderData] = useState<any>(null);
    const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);

    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const cart = useAppSelector(selectCart);
    const [paymentGateway, setPaymentGateway] = useState(paymentGatewayList[0].value);
    const [open, setOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user.user?.addresses && user.user.addresses.length > 0) {
            setSelectedAddressId(user.user.addresses[0]._id);
        }
    }, [user.user?.addresses]);

    // ✅ NEW: useEffect to trigger Razorpay modal when data is ready
    useEffect(() => {
        if (razorpayOrderData && typeof window !== 'undefined' && (window as any).Razorpay) {
            openRazorpayModal(razorpayOrderData, paymentOrderId!);
        }
    }, [razorpayOrderData, paymentOrderId]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleAddressChange = (addressId: string) => {
        setSelectedAddressId(addressId);
    };

    const handleFulfillmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedValue = (event.target as HTMLInputElement).value as 'DELIVERY' | 'SELF_PICKUP';
        setFulfillmentType(selectedValue);

        if (selectedValue === 'SELF_PICKUP') {
            setSelectedAddressId(null);
            setSelectedPickupTime(null);
        } else if (user.user?.addresses && user.user.addresses.length > 0) {
            setSelectedAddressId(user.user.addresses[0]._id);
        }
    };

    // ✅ NEW: Razorpay Modal Function
    const openRazorpayModal = (orderData: any, paymentOrderId: string) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SmO760j2VBTxSH',
            amount: orderData.amount,
            currency: orderData.currency,
            name: "MANIVASAGAN",
            description: "Order Payment",
            order_id: orderData.order_id,

            handler: async function (response: any) {
                console.log("✅ Payment successful:", response);

                try {
                    // ✅ Notify backend to verify payment & create actual orders
                    const verifyResp = await axios.get(
                        `http://localhost:8080/api/payment/${response.razorpay_payment_id}?paymentLinkId=${paymentOrderId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('jwt')}`
                            }
                        }
                    );

                    console.log("✅ Orders created:", verifyResp.data.orders);

                    // ✅ Clear cart via Redux
                    dispatch(clearCartAfterOrder());

                    // ✅ Redirect to success page
                    navigate('/payment-success', {
                        state: {
                            paymentId: response.razorpay_payment_id,
                            orderId: response.razorpay_order_id,
                            signature: response.razorpay_signature
                        }
                    });

                } catch (err: any) {
                    console.error("❌ Payment verification failed:", err);
                    setSnackbarMessage('Payment succeeded but order creation failed. Please contact support.');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                } finally {
                    setRazorpayOrderData(null);
                    setPaymentOrderId(null);
                }
            },

            prefill: {
                name: orderData.customer.name,
                email: orderData.customer.email,
                contact: orderData.customer.contact
            },

            theme: {
                color: "#3399cc"
            },

            modal: {
                ondismiss: function () {
                    console.log("Modal closed by user");
                    setRazorpayOrderData(null);
                    setPaymentOrderId(null);
                }
            }
        };

        // ✅ Open desktop modal
        const rzp = new (window as any).Razorpay(options);

        // Handle payment errors
        rzp.on('payment.failed', function (response: any) {
            console.error("❌ Payment failed:", response.error);
            setSnackbarMessage(response.error.description || 'Payment failed');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setRazorpayOrderData(null);
            setPaymentOrderId(null);
        });

        rzp.open();
    };

    const handleCreateOrder = async () => {
        if (!cart || cart.cartItems.length === 0) {
            setSnackbarMessage('Your cart is empty');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        // ✅ Validate pickup time for self-pickup orders
        if (fulfillmentType === 'SELF_PICKUP') {
            if (!selectedPickupTime) {
                setSnackbarMessage('Please select a pickup time');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
                return;
            }

            if (selectedPickupTime.isBefore(dayjs())) {
                setSnackbarMessage('Pickup time must be in the future');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
                return;
            }
        }

        if (fulfillmentType === 'DELIVERY' && !selectedAddressId) {
            setSnackbarMessage('Please select a delivery address');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        let selectedAddress: Address | undefined = undefined;
        if (fulfillmentType === 'DELIVERY' && selectedAddressId) {
            selectedAddress = user.user?.addresses?.find(a => a._id === selectedAddressId);
            if (!selectedAddress) {
                setSnackbarMessage('Selected address not found');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
                return;
            }
        }

        setCheckoutLoading(true);

        try {
             const subtotal = cart.totalSellingPrice;
  const shippingCost = 0;  // ✅ Changed from: 60
  const platformFee = 7;
  const discount = cart.couponPrice || 0;
  
  const finalAmount = subtotal + shippingCost + platformFee - discount;

  console.log("💰 Calculated final amount (NO SHIPPING):", finalAmount);
  console.log("  - Subtotal:", subtotal);
  console.log("  - Shipping:", shippingCost);  // Will show 0
  console.log("  - Platform fee:", platformFee);
  console.log("  - Discount:", discount);

  const result: any = await dispatch(createOrder({
    address: selectedAddress,
    fulfillmentType,
    pickupTime: selectedPickupTime ? selectedPickupTime.toISOString() : undefined,
    jwt: localStorage.getItem('jwt') || "",
    paymentGateway,
    finalAmount  // ✅ Send final calculated amount (without shipping)
  })).unwrap();

            // ✅ Type Guard 1: Check for Razorpay Order (NEW)
            if (result && result.type === 'RAZORPAY_ORDER' && result.razorpayOrder) {
                console.log("🎯 Razorpay Order received:", result.razorpayOrder);

                // ✅ Store data to trigger modal via useEffect
                setRazorpayOrderData(result.razorpayOrder);
                setPaymentOrderId(result.paymentOrderId);

                // ✅ Modal will open automatically via useEffect
                return;
            }

            // ✅ Type Guard 2: Check for Payment Link (OLD fallback)
            if (result && typeof result === 'object' && 'payment_link_url' in result && result.payment_link_url) {
                window.location.href = result.payment_link_url;
                return;
            }

            // ✅ Type Guard 3: Check for COD success
            if (result && typeof result === 'object' && 'success' in result && result.success && 'orders' in result && result.orders) {
                // Clear cart via Redux
                dispatch(clearCartAfterOrder());
                navigate('/account/orders');
                return;
            }

            // Default fallback
            navigate('/account/orders');

        } catch (error: any) {
            setSnackbarMessage(error || 'Failed to create order');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handlePaymentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedValue = (event.target as HTMLInputElement).value;
        setPaymentGateway(selectedValue);
    };

    const handleFormSuccess = () => {
        setSnackbarMessage('Address added successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        setTimeout(() => {
            if (user.user?.addresses && user.user.addresses.length > 0) {
                setSelectedAddressId(user.user.addresses[user.user.addresses.length - 1]._id);
            }
        }, 500);
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className='pt-10 px-5 sm:px-10 md:px-44 lg:px-60 min-h-screen'>
                <div className='space-y-5 lg:space-y-0 lg:grid grid-cols-3 lg:gap-9'>
                    <div className="col-span-2 space-y-5">
                        {fulfillmentType === 'DELIVERY' ? (
                            <>
                                <div className='flex justify-between items-center'>
                                    <span className='font-semibold text-lg'>Select Delivery Address</span>
                                    <Button
                                        onClick={handleOpen}
                                        variant='contained'
                                        startIcon={<AddIcon />}
                                    >
                                        Add New Address
                                    </Button>
                                </div>

                                {user.user?.addresses && user.user.addresses.length > 0 ? (
                                    <div className='space-y-3'>
                                        {user.user.addresses.map((item: Address) => (
                                            <AddressCard
                                                key={item._id}
                                                item={item}
                                                selectedAddressId={selectedAddressId}
                                                onAddressSelect={handleAddressChange}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <Alert severity="info" className='mt-4'>
                                        No saved addresses. Please add a new address to proceed.
                                    </Alert>
                                )}
                            </>
                        ) : (
                            <div className='p-4 bg-blue-50 rounded-md border border-blue-200'>
                                <div className='flex items-start gap-3'>
                                    <StorefrontIcon sx={{ color: 'blue', mt: 0.5 }} />
                                    <div>
                                        <Typography variant="h6" color="primary" fontWeight="bold">
                                            Self Pickup from Store
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            You'll pick up your order directly from the seller's store.
                                            The pickup address will be shown in your order details.
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="col-span-1 text-sm space-y-3">
                        <section className='space-y-3 border p-5 rounded-md'>
                            <h1 className='text-primary-color font-medium pb-2 text-center'>
                                Choose Fulfillment Type
                            </h1>

                            <RadioGroup
                                aria-labelledby="fulfillment-type-group"
                                name="fulfillment-type"
                                className='flex flex-col gap-3'
                                onChange={handleFulfillmentChange}
                                value={fulfillmentType}
                            >
                                {fulfillmentOptions.map((item) => (
                                    <FormControlLabel
                                        key={item.value}
                                        value={item.value}
                                        control={<Radio />}
                                        label={
                                            <div className='flex items-center gap-3'>
                                                <span className='text-primary-color'>{item.icon}</span>
                                                <span>{item.label}</span>
                                            </div>
                                        }
                                        className={`border rounded-md p-2 ${fulfillmentType === item.value
                                            ? "border-primary-color bg-primary-color/10"
                                            : ""
                                            }`}
                                    />
                                ))}
                            </RadioGroup>
                        </section>

                        {fulfillmentType === 'SELF_PICKUP' && (
                            <section className='space-y-3 border p-5 rounded-md'>
                                <h1 className='text-primary-color font-medium pb-2 text-center'>
                                    <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Schedule Pickup Time
                                </h1>
                                <DateTimePicker
                                    label="Select Pickup Date & Time"
                                    value={selectedPickupTime}
                                    onChange={(newValue) => {
                                        setSelectedPickupTime(newValue);
                                        setPickupTimeError('');
                                    }}
                                    minDateTime={dayjs().add(1, 'hour')}
                                    disablePast
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            error: !!pickupTimeError,
                                            helperText: pickupTimeError || 'Minimum 1 hour from now',
                                            margin: 'normal',
                                            size: 'small'
                                        }
                                    }}
                                />
                                <Typography variant='body2' color='text.secondary' className='text-center text-xs'>
                                    Please arrive at the store at your scheduled time
                                </Typography>
                            </section>
                        )}

                        <section className='space-y-3 border p-5 rounded-md'>
                            <h1 className='text-primary-color font-medium pb-2 text-center'>
                                Choose Payment Method
                            </h1>

                            <RadioGroup
                                aria-labelledby="payment-gateway-group"
                                name="payment-gateway"
                                className='flex flex-col gap-3'
                                onChange={handlePaymentChange}
                                value={paymentGateway}
                            >
                                {paymentGatewayList.map((item) => (
                                    <FormControlLabel
                                        key={item.value}
                                        value={item.value}
                                        control={<Radio />}
                                        label={
                                            <div className='flex items-center gap-3'>
                                                {item.image ? (
                                                    <img
                                                        className='h-8 object-contain'
                                                        src={item.image}
                                                        alt={item.label}
                                                    />
                                                ) : item.icon ? (
                                                    <span className='text-primary-color'>{item.icon}</span>
                                                ) : null}
                                                <span>{item.label}</span>
                                            </div>
                                        }
                                        className={`border rounded-md p-2 ${paymentGateway === item.value
                                            ? "border-primary-color bg-primary-color/10"
                                            : ""
                                            }`}
                                    />
                                ))}
                            </RadioGroup>
                        </section>

                        <section className='border rounded-md'>
                            <PricingCard />
                            <div className='p-5'>
                                <Button
                                    onClick={handleCreateOrder}
                                    sx={{ py: "14px" }}
                                    variant='contained'
                                    fullWidth
                                    disabled={
                                        checkoutLoading ||
                                        (fulfillmentType === 'DELIVERY' && !selectedAddressId) ||
                                        (fulfillmentType === 'SELF_PICKUP' && !selectedPickupTime)
                                    }
                                >
                                    {checkoutLoading ? (
                                        <CircularProgress size={24} sx={{ color: 'white' }} />
                                    ) : (
                                        'Proceed to Checkout'
                                    )}
                                </Button>
                            </div>
                        </section>
                    </div>
                </div>

                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Box sx={style}>
                        <AddressForm
                            handleClose={handleClose}
                            onSuccess={handleFormSuccess}
                        />
                    </Box>
                </Modal>

                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert
                        onClose={handleSnackbarClose}
                        severity={snackbarSeverity}
                        sx={{ width: '100%' }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </div>
        </LocalizationProvider>
    );
};

export default AddressPage;