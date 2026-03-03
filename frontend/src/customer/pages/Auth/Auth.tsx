import { useEffect, useState } from 'react';
import LoginForm from './LoginForm';
import { Alert, Button, Snackbar } from '@mui/material';
import SignupForm from './SignupForm';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { resetAuth } from '../../../Redux Toolkit/Customer/AuthSlice'; // 👈 Add this import

const Auth = () => {
  const [isLoginPage, setIsLoginPage] = useState(true);
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Handle snackbar open on otpSent or error
  useEffect(() => {
    if (auth.otpSent || auth.error) {
      setSnackbarOpen(true);
      console.log("store ", auth.error);
    }
  }, [auth.otpSent, auth.error]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const toggleAuthMode = () => {
    // Reset auth state to clear otpSent, error, loading
    dispatch(resetAuth());
    // Close snackbar immediately
    setSnackbarOpen(false);
    // Toggle view
    setIsLoginPage(!isLoginPage);
  };

  return (
    <div className='flex justify-center h-[90vh] items-center'>
      <div className='max-w-md h-[85vh] rounded-md border shadow-lg'>
        <img className='w-full rounded-t-md' src="/login_banner.png" alt="" />
        <div className='mt-8 px-10'>
          {isLoginPage ? <LoginForm /> : <SignupForm />}

          <div className='flex items-center gap-1 justify-center mt-5'>
            <p>{isLoginPage ? "Don't" : ""} have an account?</p>
            <Button onClick={toggleAuthMode} size='small'>
              {isLoginPage ? "Create account" : "Login"}
            </Button>
          </div>
        </div>
      </div>

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={auth.error ? "error" : "success"}
          variant="filled"
          sx={{ width: '100%' }}
        >
                   {auth.error || "OTP sent to your email!"}

        </Alert>
      </Snackbar>
    </div>
  );
};

export default Auth;