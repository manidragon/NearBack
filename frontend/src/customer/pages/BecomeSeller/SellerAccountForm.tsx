// SellerAccountForm.tsx
import { Button, CircularProgress, Step, StepLabel, Stepper } from "@mui/material";
import { useFormik } from "formik";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  createSeller,
  sendSellerLoginOtp,
} from "../../../Redux Toolkit/Seller/sellerAuthenticationSlice";
import BecomeSellerFormStep1 from "./BecomeSellerFormStep1";
import BecomeSellerFormStep2 from "./BecomeSellerFormStep2";
import BecomeSellerFormStep3 from "./BecomeSellerFormStep3";
import BecomeSellerFormStep4 from "./BecomeSellerFormStep4";
import OTPInput from "../../components/OtpFild/OTPInput";
import { useNavigate } from 'react-router-dom';

const steps = [
  "Tax Details & Mobile",
  "Pickup Address",
  "Bank Details",
  "Supplier Details",
];

const SellerAccountForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [otp, setOtp] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null); // ✅ NEW
  const dispatch = useAppDispatch();
  const sellerAuth = useAppSelector((state) => state.sellerAuth);
  const navigate = useNavigate();

  useEffect(() => {
    if (sellerAuth.sellerCreated) {
      setShowSuccessMessage(true);
      setShowOtpSection(false);
      // ✅ Navigate to home page after 3 seconds
      setTimeout(() => {
        navigate("/");
      }, 3000);
    }
  }, [sellerAuth.sellerCreated, navigate]);

  const formik = useFormik({
    initialValues: {
      mobile: "",
      GSTIN: "",
      pickupAddress: {
        name: "",
        mobile: "",
        pinCode: "",
        address: "",
        locality: "",
        city: "",
        state: "",
      },
      bankDetails: {
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
      },
      sellerName: "",
      email: "",
      businessDetails: {
        businessName: "",
        businessEmail: "",
        businessMobile: "",
        logo: "",
        banner: "",
        businessAddress: "",
      },
      password: "",
    },
    onSubmit: () => { },
  });

  const handleOtpChange = (otpValue: string) => {
    setOtp(otpValue);
  };

  // ✅ Per-step validation
  const isCurrentStepValid = () => {
    switch (activeStep) {
      case 0:
        return (
          formik.values.mobile.trim() !== "" &&
          formik.values.GSTIN.trim() !== ""
        );
      case 1:
        const addr = formik.values.pickupAddress;
        return (
          addr.name.trim() !== "" &&
          addr.mobile.trim() !== "" &&
          addr.pinCode.trim() !== "" &&
          addr.address.trim() !== "" &&
          addr.locality.trim() !== "" &&
          addr.city.trim() !== "" &&
          addr.state.trim() !== ""
        );
      case 2:
        const bank = formik.values.bankDetails;
        return (
          bank.accountNumber.trim() !== "" &&
          bank.ifscCode.trim() !== "" &&
          bank.accountHolderName.trim() !== ""
        );
      case 3:
        return (
          formik.values.sellerName.trim() !== "" &&
          formik.values.email.trim() !== "" &&
          formik.values.businessDetails.businessName.trim() !== "" &&
          formik.values.password.trim() !== ""
        );
      default:
        return true;
    }
  };

  // ✅ Validate ALL steps before sending OTP
  const validateAllSteps = (): string | null => {
    // Step 0: Tax Details & Mobile
    if (!formik.values.mobile.trim()) return "Mobile is required";
    if (!formik.values.GSTIN.trim()) return "GSTIN is required";

    // Step 1: Pickup Address
    const addr = formik.values.pickupAddress;
    if (!addr.name.trim()) return "Pickup address name is required";
    if (!addr.mobile.trim()) return "Pickup address mobile is required";
    if (!addr.pinCode.trim()) return "Pickup address pin code is required";
    if (!addr.address.trim()) return "Pickup address is required";
    if (!addr.locality.trim()) return "Pickup address locality is required";
    if (!addr.city.trim()) return "Pickup address city is required";
    if (!addr.state.trim()) return "Pickup address state is required";

    // Step 2: Bank Details
    const bank = formik.values.bankDetails;
    if (!bank.accountNumber.trim()) return "Account number is required";
    if (!bank.ifscCode.trim()) return "IFSC code is required";
    if (!bank.accountHolderName.trim()) return "Account holder name is required";

    // Step 3: Supplier Details
    if (!formik.values.sellerName.trim()) return "Seller name is required";
    if (!formik.values.email.trim()) return "Email is required";
    if (!formik.values.businessDetails.businessName.trim()) return "Business name is required";
    if (!formik.values.password.trim()) return "Password is required";

    return null; // No errors
  };

  const handleFinalSubmit = () => {
    // ✅ Validate ALL fields before sending OTP
    const validationError = validateAllSteps();
    
    if (validationError) {
      setValidationError(validationError);
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationError(null);
    dispatch(sendSellerLoginOtp(formik.values.email));
    setShowOtpSection(true);
  };

  const handleVerifyAndCreate = () => {
    if (otp.length !== 6 || sellerAuth.loading) return;

    const payload = {
      ...formik.values,
      otp,
    };

    dispatch(createSeller({ sellerData: payload, navigate: null }));
  };

  return (
    <div>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <div className="mt-20 space-y-10">
        {!showOtpSection && !showSuccessMessage ? (
          <>
            {/* ✅ Show validation error at the top */}
            {validationError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Validation Error: </strong>
                <span className="block sm:inline">{validationError}</span>
              </div>
            )}

            <div>
              {activeStep === 0 ? (
                <BecomeSellerFormStep1 formik={formik} />
              ) : activeStep === 1 ? (
                <BecomeSellerFormStep2 formik={formik} />
              ) : activeStep === 2 ? (
                <BecomeSellerFormStep3 formik={formik} />
              ) : (
                <BecomeSellerFormStep4 formik={formik} />
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button
                disabled={activeStep === 0}
                onClick={() => setActiveStep(activeStep - 1)}
                variant="outlined"
              >
                Back
              </Button>
              <Button
                disabled={sellerAuth.loading || !isCurrentStepValid()}
                onClick={
                  activeStep === steps.length - 1
                    ? handleFinalSubmit // ✅ Validates ALL steps before sending OTP
                    : () => setActiveStep(activeStep + 1)
                }
                variant="contained"
              >
                {activeStep === steps.length - 1 ? (
                  sellerAuth.loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Send OTP & Verify"
                  )
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </>
        ) : showOtpSection && !showSuccessMessage ? (
          // ✅ OTP Verification Section
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-center">Verify Your Email</h2>
            <p className="text-center">
              Enter OTP sent to <strong>{formik.values.email}</strong>
            </p>

            <OTPInput length={6} onChange={handleOtpChange} />

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => {
                  setShowOtpSection(false);
                  setValidationError(null);
                }}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyAndCreate}
                disabled={otp.length !== 6 || sellerAuth.loading}
                variant="contained"
              >
                {sellerAuth.loading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Verify & Submit Application"
                )}
              </Button>
            </div>
          </div>
        ) : showSuccessMessage ? (
          // ✅ Success Message - Navigate to Home
          <div className="space-y-6 text-center py-10">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Application Submitted!</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Thank you for registering as a seller. Your application is now pending admin approval.
            </p>
            <p className="text-orange-600 font-medium">
              ⏳ Please wait for admin verification before you can login.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to home page in 3 seconds...
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SellerAccountForm;