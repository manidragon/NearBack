// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\BecomeSeller\BecomeSeller.tsx
import { Alert, Button, Snackbar } from "@mui/material";
import { useState, useEffect } from "react";
import SellerAccountForm from "./SellerAccountForm";
import SellerLoginForm from "./SellerLoginForm";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { resetSellerAuthState } from "../../../Redux Toolkit/Seller/sellerAuthenticationSlice"; // 👈 Add dispatch

const BecomeSeller = () => {
  const dispatch = useAppDispatch(); // 👈 Add this
  const [isLoginPage, setIsLoginPage] = useState(false);
  const sellerAuth = useAppSelector(state => state.sellerAuth);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (sellerAuth.otpSent || sellerAuth.error) {
      setSnackbarOpen(true);
    }
    // Note: We remove sellerAuth.sellerCreated from condition for now
  }, [sellerAuth.otpSent, sellerAuth.error]);

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  // ✅ Reset state when switching between login/register
  useEffect(() => {
    dispatch(resetSellerAuthState());
  }, [isLoginPage, dispatch]);

  return (
    <div className="grid md:gap-10 grid-cols-3 min-h-screen ">
      <section className="lg:col-span-1 md:col-span-2 col-span-3  p-10 shadow-lg rounded-b-md">
        {!isLoginPage ? (
          <SellerAccountForm />
        ) : (
          <SellerLoginForm />
        )}

        <div className='mt-10 space-y-2'>
          <h1 className='text-center text-sm font-medium'>
            {isLoginPage ? "Don't" : ""} have an account?
          </h1>
          <Button 
            onClick={() => setIsLoginPage(!isLoginPage)} 
            fullWidth 
            sx={{ py: "11px" }} 
            variant='outlined'
          >
            {isLoginPage ? "Register" : "Login"}
          </Button>
        </div>
      </section>

      {/* Right banner section */}
      <section className="hidden md:col-span-1 md:flex lg:col-span-2 justify-center items-center">
        <div className="lg:w-[70%] px-5 space-y-10">
          <div className="borderr rounded-md space-y-2 font-bold text-center">
            <p className="text-2xl">Join the Marketplace Revolution</p>
            <p className="text-lg text-teal-500">Boost Your Sales Today</p>
          </div>
          <img className="" src={"/seller.jpg"} alt="" />
        </div>
      </section>

      {/* ✅ Simplified Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={sellerAuth.error ? "error" : "success"}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {sellerAuth.error || "OTP sent successfully!"}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default BecomeSeller;