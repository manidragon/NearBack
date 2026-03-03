import { Button, CircularProgress, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import OTPInput from '../../components/OtpFild/OTPInput';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { useNavigate } from 'react-router-dom';
import { sendLoginSignupOtp, signup } from '../../../Redux Toolkit/Customer/AuthSlice';
import { useFormik } from 'formik';

const SignupForm = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState<number>(30);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  // Formik only for email (OTP handled separately)
  const formik = useFormik({
    initialValues: {
      email: '',
      name: ''
    },
    onSubmit: (values) => {
      // Not used directly; handled via handleSignup
    }
  });

  const handleOtpChange = (otpValue: string) => {
    setOtp(otpValue);
  };

  const handleResendOTP = () => {
    if (!formik.values.email.trim() || auth.loading) return;
    dispatch(sendLoginSignupOtp({ email: formik.values.email }));
    setTimer(30);
    setIsTimerActive(true);
  };

  const handleSendOtp = () => {
    if (!formik.values.email.trim()) {
      // Optionally show error: "Please enter a valid email"
      return;
    }
    handleResendOTP();
  };

  const handleSignup = () => {
    if (otp.length !== 6 || auth.loading) return;
    dispatch(signup({
      fullName: formik.values.name,
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
      <h1 className='text-center font-bold text-xl text-primary-color pb-5'>Signup</h1>
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
          disabled={auth.otpSent || auth.loading} // Lock after OTP sent
        />

        {/* Only show OTP & Name AFTER OTP is successfully sent */}
        {auth.otpSent && (
          <>
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

            <TextField
              fullWidth
              name="name"
              label="Enter Your Full Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name ? formik.errors.name as string : undefined}
            />

            <Button
              disabled={auth.loading || otp.length !== 6 || !formik.values.name.trim()}
              onClick={handleSignup}
              fullWidth
              variant='contained'
              sx={{ py: "11px" }}
            >
              {auth.loading ? <CircularProgress size={24} /> : "Sign Up"}
            </Button>
          </>
        )}

        {/* Show "Send OTP" button ONLY if OTP not sent yet */}
        {!auth.otpSent && (
          <Button
            disabled={auth.loading || !formik.values.email.trim()}
            fullWidth
            variant='contained'
            onClick={handleSendOtp}
            sx={{ py: "11px" }}
          >
            {auth.loading ? <CircularProgress size={24} /> : "Send OTP"}
          </Button>
        )}
      </form>
    </div>
  );
};

export default SignupForm;