import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { TextField, Button } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { updateSeller } from "../../../Redux Toolkit/Seller/sellerSlice";
import { api } from "../../../Config/Api";

interface UpdateDetailsFormProps {
  onClose: () => void;
}

const PickupAddressForm = ({ onClose }: UpdateDetailsFormProps) => {
  const sellers = useAppSelector((state) => state.sellers);
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: "",
      mobile: "",
      pinCode: "",
      address: "",
      locality: "",
      city: "",
      state: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      mobile: Yup.string().required("Mobile number is required"),
      pinCode: Yup.string().required("Pin Code is required"),
      address: Yup.string().required("Address is required"),
      locality: Yup.string().required("Locality is required"),
      city: Yup.string().required("City is required"),
      state: Yup.string().required("State is required"),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      
      try {
        const pickupAddressField = sellers.profile?.pickupAddress;
        const pickupAddressId = typeof pickupAddressField === 'string' 
          ? pickupAddressField 
          : (pickupAddressField as any)?._id;

        if (!pickupAddressId) {
          // Create new address
          const response = await api.post(
            '/api/addresses',
            values,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
              },
            }
          );
          
          await dispatch(
            updateSeller({
              pickupAddress: response.data._id,
            })
          ).unwrap();
        } else {
          // Update existing address
          await api.put(
            `/api/addresses/${pickupAddressId}`,
            values,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
              },
            }
          );
          
          await dispatch(
            updateSeller({
              pickupAddress: pickupAddressId,
            })
          ).unwrap();
        }
        
        onClose();
      } catch (error) {
        console.error("Update failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });
  
  useEffect(() => {
    if (sellers.profile?.pickupAddress) {
      const addr = sellers.profile.pickupAddress;
      if (typeof addr !== 'string') {
        formik.setValues({
          name: addr.name || "",
          mobile: addr.mobile || "",
          pinCode: addr.pinCode || "",
          address: addr.address || "",
          locality: addr.locality || "",
          city: addr.city || "",
          state: addr.state || "",
        });
      }
    }
  }, [sellers.profile]);

  return (
    <>
      <h1 className="text-xl pb-5 text-center font-bold text-gray-600">
        Pickup Address
      </h1>
      <form className="space-y-5" onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          id="name"
          name="name"
          label="Contact Name"
          value={formik.values.name}
          onChange={formik.handleChange}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
        />
        <TextField
          fullWidth
          id="mobile"
          name="mobile"
          label="Mobile"
          value={formik.values.mobile}
          onChange={formik.handleChange}
          error={formik.touched.mobile && Boolean(formik.errors.mobile)}
          helperText={formik.touched.mobile && formik.errors.mobile}
        />
        <TextField
          fullWidth
          id="address"
          name="address"
          label="Address"
          value={formik.values.address}
          onChange={formik.handleChange}
          error={formik.touched.address && Boolean(formik.errors.address)}
          helperText={formik.touched.address && formik.errors.address}
        />
        <TextField
          fullWidth
          id="locality"
          name="locality"
          label="Locality"
          value={formik.values.locality}
          onChange={formik.handleChange}
          error={formik.touched.locality && Boolean(formik.errors.locality)}
          helperText={formik.touched.locality && formik.errors.locality}
        />
        <TextField
          fullWidth
          id="city"
          name="city"
          label="City"
          value={formik.values.city}
          onChange={formik.handleChange}
          error={formik.touched.city && Boolean(formik.errors.city)}
          helperText={formik.touched.city && formik.errors.city}
        />
        <TextField
          fullWidth
          id="state"
          name="state"
          label="State"
          value={formik.values.state}
          onChange={formik.handleChange}
          error={formik.touched.state && Boolean(formik.errors.state)}
          helperText={formik.touched.state && formik.errors.state}
        />
        <TextField
          fullWidth
          id="pinCode"
          name="pinCode"
          label="Pin Code"
          value={formik.values.pinCode}
          onChange={formik.handleChange}
          error={formik.touched.pinCode && Boolean(formik.errors.pinCode)}
          helperText={formik.touched.pinCode && formik.errors.pinCode}
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

export default PickupAddressForm;