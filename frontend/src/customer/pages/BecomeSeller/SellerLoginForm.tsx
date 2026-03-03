import { Button, CircularProgress, TextField, Snackbar, Alert } from "@mui/material";
import { useEffect, useState } from "react";
import OTPInput from "../../components/OtpFild/OTPInput";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  sendSellerLoginOtp,
  verifyLoginOtp,
} from "../../../Redux Toolkit/Seller/sellerAuthenticationSlice";
import { useNavigate } from "react-router-dom";

const SellerLoginForm = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sellerAuth = useAppSelector((state) => state.sellerAuth);

  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState(""); // ✅ NEW
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success"); // ✅ NEW

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
    }),
    onSubmit: () => {},
  });

  const handleOtpChange = (otpValue: string) => {
    setOtp(otpValue);
  };

  const handleSendOtp = () => {
    if (!formik.isValid || !formik.values.email.trim() || sellerAuth.loading) return;
    dispatch(sendSellerLoginOtp(formik.values.email));
    setTimer(30);
    setIsTimerActive(true);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6 || sellerAuth.loading) return;
    dispatch(
      verifyLoginOtp({
        email: formik.values.email,
        otp,
        navigate,
      })
    );
  };

  // 🔔 Show snackbar on state changes (prevents double showing)
  useEffect(() => {
    if (sellerAuth.otpSent) {
      setSnackbarMessage("OTP sent successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } else if (sellerAuth.error) {
      // ✅ Format error message based on account status
      const formattedMessage = formatErrorMessage(sellerAuth.error);
      setSnackbarMessage(typeof formattedMessage === 'string' ? formattedMessage : sellerAuth.error);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } else if (sellerAuth.jwt) {
      setSnackbarMessage("Login successful! Redirecting...");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    }
  }, [sellerAuth.otpSent, sellerAuth.error, sellerAuth.jwt]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    // ✅ Reset message after closing to prevent stale messages
    setTimeout(() => {
      setSnackbarMessage("");
    }, 300);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval!);
  }, [isTimerActive]);

  // ✅ Helper function to format error messages
  const formatErrorMessage = (error: string) => {
    if (error.toLowerCase().includes("pending")) {
      return "⏳ Your application is still pending. Please wait for admin approval.";
    } else if (error.toLowerCase().includes("suspended")) {
      return "⚠️ Your account has been suspended. Please contact support.";
    } else if (error.toLowerCase().includes("banned")) {
      return "❌ Your account has been banned.";
    } else if (error.toLowerCase().includes("deactivated")) {
      return "⏸️ Your account has been deactivated.";
    } else if (error.toLowerCase().includes("closed")) {
      return "🗑️ Your account has been closed.";
    } else {
      return error;
    }
  };

  return (
    <div>
      <h1 className="text-center font-bold text-xl text-primary-color pb-5">
        Login As Seller
      </h1>

      <form className="space-y-5">
        {/* EMAIL */}
        <TextField
          fullWidth
          name="email"
          label="Email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          disabled={sellerAuth.otpSent || sellerAuth.loading}
        />

        {/* OTP & Verify Button — ONLY after OTP sent */}
        {sellerAuth.otpSent && (
          <>
            <div className="space-y-2">
              <p className="font-medium text-sm">* Enter OTP sent to your email</p>
              <OTPInput length={6} onChange={handleOtpChange} error={false} />
              <p className="text-xs">
                {isTimerActive ? (
                  <span>Resend OTP in {timer}s</span>
                ) : (
                  <span
                    onClick={() => {
                      dispatch(sendSellerLoginOtp(formik.values.email));
                      setIsTimerActive(true);
                      setTimer(30);
                    }}
                    className="text-orange-600 cursor-pointer hover:text-orange-800 font-semibold"
                  >
                    Resend OTP
                  </span>
                )}
              </p>
            </div>

            <Button
              fullWidth
              variant="contained"
              onClick={handleVerifyOtp}
              disabled={sellerAuth.loading || otp.length !== 6}
              sx={{ py: "11px" }}
            >
              {sellerAuth.loading ? <CircularProgress size={24} /> : "Verify OTP"}
            </Button>
          </>
        )}

        {/* Send OTP Button — ONLY before OTP sent */}
        {!sellerAuth.otpSent && (
          <Button
            fullWidth
            variant="contained"
            onClick={handleSendOtp}
            disabled={!formik.isValid || sellerAuth.loading}
            sx={{ py: "11px" }}
          >
            {sellerAuth.loading ? <CircularProgress size={24} /> : "Send OTP"}
          </Button>
        )}
      </form>

      {/* ✅ Enhanced Snackbar - prevents double showing */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SellerLoginForm;