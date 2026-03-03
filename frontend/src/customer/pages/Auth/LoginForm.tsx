import { Button, CircularProgress, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import OTPInput from '../../components/OtpFild/OTPInput';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { useNavigate } from 'react-router-dom';
import { sendLoginSignupOtp, signin } from '../../../Redux Toolkit/Customer/AuthSlice';
import { useFormik } from 'formik';

const LoginForm = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState<number>(30);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    // Optional: add validation later
    onSubmit: (values) => {
      // This won't be used directly; we handle login via handleLogin
    }
  });

  const handleOtpChange = (otpValue: string) => {
    console.log("OTP updated:", otpValue); // 🔍 Debug log
    setOtp(otpValue);
  };

  const handleResendOTP = () => {
    if (!formik.values.email || auth.loading) return;
    dispatch(sendLoginSignupOtp({ email: formik.values.email }));
    setTimer(30);
    setIsTimerActive(true);
  };

  const handleSentOtp = () => {
    if (!formik.values.email.trim()) {
      // Optionally show error: "Please enter email"
      return;
    }
    handleResendOTP();
  };

  const handleLogin = () => {
    if (otp.length !== 6 || auth.loading) return;

    dispatch(signin({
      email: formik.values.email,
      otp,
      navigate
    }));
  };

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isTimerActive) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev === 1) {
            setIsTimerActive(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive]);

  return (
    <div>
      <h1 className='text-center font-bold text-xl text-primary-color pb-8'>Login</h1>
      <form className="space-y-5">

        <TextField
          fullWidth
          name="email"
          label="Enter Your Email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email ? formik.errors.email as string : undefined}
          disabled={auth.otpSent || auth.loading}
        />

        {auth.otpSent && (
          <div className="space-y-2">
            <p className="font-medium text-sm">
              * Enter OTP sent to your email
            </p>
            <OTPInput
              length={6}
              onChange={handleOtpChange}
              error={false}
            />
            <p className="text-xs space-x-2">
              {isTimerActive ? (
                <span>Resend OTP in {timer} seconds</span>
              ) : (
                <>
                  Didn’t receive OTP?{" "}
                  <span
                    onClick={handleResendOTP}
                    className="text-teal-600 cursor-pointer hover:text-teal-800 font-semibold"
                  >
                    Resend OTP
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        {auth.otpSent ? (
          <Button
            disabled={auth.loading || otp.length !== 6}
            onClick={handleLogin}
            fullWidth
            variant='contained'
            sx={{ py: "11px" }}
          >
            {auth.loading ? <CircularProgress size={24} /> : "Login"}
          </Button>
        ) : (
          <Button
            disabled={auth.loading || !formik.values.email.trim()}
            fullWidth
            variant='contained'
            onClick={handleSentOtp}
            sx={{ py: "11px" }}
          >
            {auth.loading ? <CircularProgress size={24} /> : "Send OTP"}
          </Button>
        )}

      </form>
    </div>
  );
};

export default LoginForm;