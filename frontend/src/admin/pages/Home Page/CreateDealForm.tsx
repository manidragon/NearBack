// D:\Mani\Code with Zosh\Backup\source code\frontend\src\admin\pages\Home Page\CreateDealForm.tsx

import { Box, Button, FormControl, FormHelperText, InputLabel, MenuItem, Select, TextField, Typography, Alert } from '@mui/material'
import { useFormik } from 'formik';
import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { createDeal, getAllDeals } from '../../../Redux Toolkit/Admin/DealSlice';

const CreateDealForm = () => {
  const homePage = useAppSelector(state => state.homePage);
  const dealState = useAppSelector(state => state.deal);
  const dispatch = useAppDispatch();
  const [showSuccess, setShowSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      discount: 0,
      category: "",
    },
    onSubmit: async (values) => {
      try {
        await dispatch(createDeal({
          discount: values.discount, 
          category: {
            _id: values.category
          }
        }));
        setShowSuccess(true);
        formik.resetForm();
        setTimeout(() => {
          setShowSuccess(false);
          dispatch(getAllDeals()); // ✅ Refresh deals list
        }, 1500);
      } catch (error) {
        console.error("Create failed:", error);
      }
    },
  });

  return (
    <Box
      component="form"
      onSubmit={formik.handleSubmit}
      sx={{ maxWidth: 500, margin: "auto", padding: 3 }}
      className="space-y-6"
    >
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Deal created successfully!
        </Alert>
      )}

      <Typography className='text-center' variant="h4" gutterBottom>
        Create Deal
      </Typography>

      <TextField
        fullWidth
        id="discount"
        name="discount"
        label="Discount (%)"
        type="number"
        value={formik.values.discount}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.discount && Boolean(formik.errors.discount)}
        helperText={formik.touched.discount && formik.errors.discount}
      />

      <FormControl
        fullWidth
        error={formik.touched.category && Boolean(formik.errors.category)}
        required
      >
        <InputLabel id="category-label">Category</InputLabel>
        <Select
          labelId="category-label"
          id="category"
          name="category"
          value={formik.values.category}
          onChange={formik.handleChange}
          label="Category"
        >
          <MenuItem value="">
            <em>Select Category</em>
          </MenuItem>
          {homePage.homePageData?.dealCategories?.map((item: any) => (
            <MenuItem key={item._id} value={item._id}>
              {item.name || item.categoryId}
            </MenuItem>
          ))}
        </Select>
        {formik.touched.category && formik.errors.category && (
          <FormHelperText>{formik.errors.category}</FormHelperText>
        )}
      </FormControl>

      <Button
        color="primary"
        variant="contained"
        fullWidth
        type="submit"
        disabled={dealState.loading}
        sx={{ py: ".9rem" }}
      >
        {dealState.loading ? "Creating..." : "Create Deal"}
      </Button>
    </Box>
  )
}

export default CreateDealForm;