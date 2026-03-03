import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { TextField, Button } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { updateSeller } from "../../../Redux Toolkit/Seller/sellerSlice";

interface UpdateDetailsFormProps {
  onClose: () => void;
}

const BusinessDetailsForm = ({ onClose }: UpdateDetailsFormProps) => {
  const dispatch = useAppDispatch();
  const sellers = useAppSelector((state) => state.sellers);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      businessName: "",
      businessEmail: "",
      businessMobile: "",
      businessAddress: "",
      GSTIN: "",
    },
    validationSchema: Yup.object({
      businessName: Yup.string().required("Business Name is required"),
      businessEmail: Yup.string().email("Invalid email").required("Business Email is required"),
      businessMobile: Yup.string().required("Business Mobile is required"),
      businessAddress: Yup.string().required("Business Address is required"),
      GSTIN: Yup.string().required("GSTIN is required"),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      
      try {
        await dispatch(
          updateSeller({
            businessDetails: {
              businessName: values.businessName,
              businessEmail: values.businessEmail,
              businessMobile: values.businessMobile,
              businessAddress: values.businessAddress,
            },
            GSTIN: values.GSTIN,
          })
        ).unwrap();
        
        onClose();
      } catch (error) {
        console.error("Update failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (sellers.profile) {
      formik.setValues({
        businessName: sellers.profile?.businessDetails?.businessName || "",
        businessEmail: sellers.profile?.businessDetails?.businessEmail || "",
        businessMobile: sellers.profile?.businessDetails?.businessMobile || "",
        businessAddress: sellers.profile?.businessDetails?.businessAddress || "",
        GSTIN: sellers.profile?.GSTIN || "",
      });
    }
  }, [sellers.profile]);

  return (
    <>
      <h1 className="text-xl pb-5 text-center font-bold text-gray-600">
        Business Details
      </h1>
      <form className="space-y-5" onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          id="businessName"
          name="businessName"
          label="Business Name"
          value={formik.values.businessName}
          onChange={formik.handleChange}
          error={formik.touched.businessName && Boolean(formik.errors.businessName)}
          helperText={formik.touched.businessName && formik.errors.businessName}
        />
        <TextField
          fullWidth
          id="businessEmail"
          name="businessEmail"
          label="Business Email"
          value={formik.values.businessEmail}
          onChange={formik.handleChange}
          error={formik.touched.businessEmail && Boolean(formik.errors.businessEmail)}
          helperText={formik.touched.businessEmail && formik.errors.businessEmail}
        />
        <TextField
          fullWidth
          id="businessMobile"
          name="businessMobile"
          label="Business Mobile"
          value={formik.values.businessMobile}
          onChange={formik.handleChange}
          error={formik.touched.businessMobile && Boolean(formik.errors.businessMobile)}
          helperText={formik.touched.businessMobile && formik.errors.businessMobile}
        />
        <TextField
          fullWidth
          id="businessAddress"
          name="businessAddress"
          label="Business Address"
          value={formik.values.businessAddress}
          onChange={formik.handleChange}
          error={formik.touched.businessAddress && Boolean(formik.errors.businessAddress)}
          helperText={formik.touched.businessAddress && formik.errors.businessAddress}
        />
        <TextField
          fullWidth
          id="GSTIN"
          name="GSTIN"
          label="GSTIN"
          value={formik.values.GSTIN}
          onChange={formik.handleChange}
          error={formik.touched.GSTIN && Boolean(formik.errors.GSTIN)}
          helperText={formik.touched.GSTIN && formik.errors.GSTIN}
        />
        <Button
          sx={{ py: ".9rem" }}
          color="primary"
          variant="contained"
          fullWidth
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </>
  );
};

export default BusinessDetailsForm;