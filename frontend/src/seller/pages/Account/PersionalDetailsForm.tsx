// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Account\PersionalDetailsForm.tsx
import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { TextField, Button } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { updateSeller } from "../../../Redux Toolkit/Seller/sellerSlice";

interface UpdateDetailsFormProps {
  onClose: () => void;
}

const PersonalDetailsForm = ({ onClose }: UpdateDetailsFormProps) => {
    const sellers = useAppSelector(state => state.sellers);
    const dispatch = useAppDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formik = useFormik({
        initialValues: {
            sellerName: '',
            email: '',
            mobile: '',
        },
        validationSchema: Yup.object({
            sellerName: Yup.string().required("Seller Name is required"),
            email: Yup.string().email("Invalid email address").required("Email is required"),
            mobile: Yup.string().required("Mobile number is required"),
        }),
        onSubmit: async (values) => {
            setIsSubmitting(true);
            
            try {
                await dispatch(updateSeller(values)).unwrap();
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
                sellerName: sellers.profile?.sellerName || "",
                email: sellers.profile?.email || "",
                mobile: sellers.profile?.mobile || "",
            });
        }
    }, [sellers.profile]);

    return (
        <>
            <h1 className="text-xl pb-5 text-center font-bold text-gray-600">
                Personal Details
            </h1>
            <form className="space-y-5" onSubmit={formik.handleSubmit}>
                <TextField
                    fullWidth
                    id="sellerName"
                    name="sellerName"
                    label="Seller Name"
                    value={formik.values.sellerName}
                    onChange={formik.handleChange}
                    error={formik.touched.sellerName && Boolean(formik.errors.sellerName)}
                    helperText={formik.touched.sellerName && formik.errors.sellerName}
                />
                <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
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

export default PersonalDetailsForm;