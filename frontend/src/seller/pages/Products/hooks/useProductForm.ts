// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Products\hooks\useProductForm.ts
import { useFormik, type FormikHelpers, type FormikConfig } from 'formik';
import { defaultInitialValues, type ProductFormValues } from '../types/productFormTypes';
import { useMemo } from 'react';

interface UseProductFormProps {
  initialValues?: ProductFormValues;
  mode?: "add" | "edit";
  onSubmit: (values: ProductFormValues, formikHelpers: FormikHelpers<ProductFormValues>) => void | Promise<void>;
  validationSchema?: any;
  context?: { 
    isCatalogProduct?: boolean; 
    category3?: string;
  };  // ✅ FIX 1: Added missing closing brace
}

export const useProductForm = ({
  initialValues = defaultInitialValues,
  mode = "add",
  onSubmit,
  validationSchema,
  context,
}: UseProductFormProps) => {
  
  // ✅ FIX 2: Move useMemo to TOP LEVEL of hook (not inside object)
  const formikContext = useMemo(() => ({
    isCatalogProduct: context?.isCatalogProduct ?? initialValues?.catalogMode?.isCatalogProduct ?? false,
    category3: initialValues?.category3 ?? '',
  }), [context?.isCatalogProduct, initialValues?.catalogMode?.isCatalogProduct, initialValues?.category3]);

  // ✅ FIX 3: Use full FormikConfig type (no Omit)
 const formikConfig = {
  initialValues,
  enableReinitialize: false,
  validateOnMount: false,
  validateOnChange: true,
  validateOnBlur: true,
  
  validationSchema: validationSchema,
  
  // ✅ Add context (Yup uses this for conditional validation)
  context: formikContext,
  
  onSubmit: async (values, formikHelpers) => {
    console.log('🔍 [useProductForm] onSubmit triggered', {
      mode,
      title: values.title,
      variantCount: values.variants?.length,
      isCatalog: values.catalogMode?.isCatalogProduct
    });
    
    return onSubmit(values, formikHelpers);
  },
} as FormikConfig<ProductFormValues> & { context?: { isCatalogProduct?: boolean; category3?: string } };

  // ✅ No type assertion needed now
  return useFormik<ProductFormValues>(formikConfig);
};