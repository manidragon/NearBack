// D:\Mani\Code with Zosh\Backup\source code\frontend\src\types\categoryAttributeTypes.ts

/**
 * ✅ Attribute input types supported in forms
 */
export type AttributeInputType = 'text' | 'number' | 'select' | 'textarea' | 'boolean';

/**
 * ✅ Full Category Attribute model (matches MongoDB schema)
 * ✅ Includes variant control fields for Flipkart-style dynamic specs
 */
export interface CategoryAttribute {
  _id: string;                   // ✅ MongoDB _id (required for existing documents)
  categoryId: string;            // Level 3 category ID (string slug)
  name: string;                  // Internal key: "ram", "storage", "size"
  label: string;                 // Display label: "RAM", "Storage", "Size"
  type: AttributeInputType;      // Form input type
  options?: string[];            // For select type: ["4GB", "8GB", "16GB"]
  required: boolean;             // Is field required in form?
  placeholder?: string;          // Placeholder text for text/number inputs
  min?: number;                  // Min value for number inputs
  max?: number;                  // Max value for number inputs
  step?: number;                 // Step value for number inputs (default: 1)
  order: number;                 // Display order in form (lower = first)
  isActive: boolean;             // Soft delete support
  isFilterable?: boolean;
  // ✅ Metadata
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;

  // ✅✅✅ NEW: Variant Control Fields (Flipkart-Style Dynamic Specs)
  
  /**
   * If true, this attribute differentiates product variants
   * - Shown as selector cards in UI (Flipkart-style)
   * - Examples: Mobile → RAM/Storage | Dress → Size/Color | TV → Screen Size
   * - Default: false (backward compatible)
   */
  isVariantField?: boolean;
  
  /**
   * If true, show this attribute in Product Highlights section
   * - Same value shown for all variants (assumed consistent)
   * - Examples: Mobile → Processor/Camera | Dress → Material/Care
   * - Default: true (backward compatible)
   */
  displayInHighlights?: boolean;
  
  /**
   * Display order in UI for variant/highlight sections
   * - Lower values displayed first
   * - Independent of form `order` field
   * - Default: 0
   */
  sortOrder?: number;
}

/**
 * ✅ Frontend-friendly attribute definition (for form rendering)
 * ✅ Includes variant control fields
 */
export interface AttributeDefinition {
  _id: string;                   // ✅ Required for React list keys
  categoryId: string;
  name: string;
  label: string;
  type: AttributeInputType;
  options?: string[];
  required: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  order: number;
  isActive: boolean;
  
  isFilterable?: boolean;
  // ✅ Variant control fields
  isVariantField?: boolean;
  displayInHighlights?: boolean;
  sortOrder?: number;
}

/**
 * ✅ API Response Types
 */
export interface CategoryAttributeApiResponse {
  success: boolean;
  message?: string;
  data?: CategoryAttribute | CategoryAttribute[];
  count?: number;
}

export interface BulkCategoryAttributesResponse {
  success: boolean;
  message?: string;
  data?: Record<string, CategoryAttribute[]>;
}

export interface CategoryHasAttributesResponse {
  success: boolean;
  message?: string;
  data?: {
    categoryId: string;
    hasAttributes: boolean;
  };
}

/**
 * ✅ Form State Types
 */
export interface CategoryAttributeFormState {
  attributes: CategoryAttribute[];
  loading: boolean;
  error: string | null;
  selectedCategoryId: string | null;
}

/**
 * ✅ Helper: Type guard to check if attribute is select type with options
 */
export const isSelectType = (attr: AttributeDefinition): attr is AttributeDefinition & { options: string[] } => {
  return attr.type === 'select' && Array.isArray(attr.options) && attr.options.length > 0;
};

/**
 * ✅ Helper: Check if attribute should be used as variant selector
 */
export const isVariantSelector = (attr: CategoryAttribute): boolean => {
  return attr.isActive === true && attr.isVariantField === true;
};

/**
 * ✅ Helper: Check if attribute should be shown in Product Highlights
 */
export const shouldShowInHighlights = (attr: CategoryAttribute): boolean => {
  return attr.isActive === true && 
         attr.displayInHighlights === true && 
         attr.isVariantField !== true;
};

/**
 * ✅ Helper: Get default value based on attribute type
 */
export const getDefaultValueForAttribute = (attr: AttributeDefinition): string | number | boolean => {
  switch (attr.type) {
    case 'number':
      return attr.min ?? 0;
    case 'boolean':
      return false;
    case 'select':
      return attr.options?.[0] || '';
    default:
      return '';
  }
};

/**
 * ✅ Helper: Validate attribute value based on type
 */
export const validateAttributeValue = (
  attr: AttributeDefinition,
  value: string | number | boolean
): { valid: boolean; error?: string } => {
  // Check required
  if (attr.required && (value === '' || value === null || value === undefined)) {
    return { valid: false, error: `${attr.label} is required` };
  }

  // Allow empty for optional fields
  if (!attr.required && (value === '' || value === null || value === undefined)) {
    return { valid: true };
  }

  // Number validation
  if (attr.type === 'number' && typeof value === 'number') {
    if (attr.min !== undefined && value < attr.min) {
      return { valid: false, error: `${attr.label} must be at least ${attr.min}` };
    }
    if (attr.max !== undefined && value > attr.max) {
      return { valid: false, error: `${attr.label} must be at most ${attr.max}` };
    }
  }

  // Select validation
  if (attr.type === 'select' && attr.options && !attr.options.includes(String(value))) {
    return { valid: false, error: `Invalid option for ${attr.label}` };
  }

  return { valid: true };
};

/**
 * ✅ Helper: Transform API response to frontend-friendly format
 * ✅ Preserves all fields including variant control fields
 */
export const transformApiAttribute = (apiAttr: CategoryAttribute): AttributeDefinition => {
  const { createdBy, updatedBy, createdAt, updatedAt, ...rest } = apiAttr;
  return {
    ...rest,
    isVariantField: apiAttr.isVariantField ?? false,
    displayInHighlights: apiAttr.displayInHighlights ?? true,
    sortOrder: apiAttr.sortOrder ?? 0,
    // ✅✅✅ NEW: Default to true for backward compatibility
    isFilterable: apiAttr.isFilterable ?? true,
  } as AttributeDefinition;
};

/**
 * ✅ Helper: Transform form values to API payload
 * ✅ Includes variant control fields
 */
export const transformFormToApiPayload = (
  formValues: Partial<AttributeDefinition>,
  categoryId: string
): Partial<CategoryAttribute> => {
  return {
    ...formValues,
    categoryId,
    isActive: formValues.isActive ?? true,
    name: formValues.name?.toLowerCase().trim().replace(/\s+/g, '_'),
    isVariantField: formValues.isVariantField ?? false,
    displayInHighlights: formValues.displayInHighlights ?? true,
    sortOrder: formValues.sortOrder ?? 0,
    // ✅✅✅ NEW: Include isFilterable in payload
    isFilterable: formValues.isFilterable ?? true,
  };
};

/**
 * ✅ Helper: Separate attributes by type (variant vs highlight)
 * ✅ Used in AddProductForm and ProductDetails for Flipkart-style UI
 */
export const separateAttributesByType = (
  attributes: CategoryAttribute[]
): {
  variantAttributes: CategoryAttribute[];
  highlightAttributes: CategoryAttribute[];
  otherAttributes: CategoryAttribute[];
} => {
  const variantAttributes: CategoryAttribute[] = [];
  const highlightAttributes: CategoryAttribute[] = [];
  const otherAttributes: CategoryAttribute[] = [];

  attributes.forEach((attr) => {
    if (!attr.isActive) return; // Skip inactive attributes
    
    if (isVariantSelector(attr)) {
      variantAttributes.push(attr);
    } else if (shouldShowInHighlights(attr)) {
      highlightAttributes.push(attr);
    } else {
      otherAttributes.push(attr);
    }
  });

  // ✅ Sort by sortOrder for consistent UI order
  const sortBySortOrder = (a: CategoryAttribute, b: CategoryAttribute) => 
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

  return {
    variantAttributes: variantAttributes.sort(sortBySortOrder),
    highlightAttributes: highlightAttributes.sort(sortBySortOrder),
    otherAttributes: otherAttributes.sort(sortBySortOrder),
  };
};

/**
 * ✅ Helper: Get unique values for a variant attribute from sub-variants
 * ✅ Used to populate Flipkart-style selector chips
 */
export const getUniqueValuesForAttribute = (
  attributeName: string,
  subVariants: Array<{ specifications?: Record<string, string | number | boolean> }>
): string[] => {
  const values = subVariants
    .map((sv) => sv.specifications?.[attributeName])
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '');
  
  return [...new Set(values)].sort();
};