// frontend/src/customer/pages/Products/FilterSection.tsx

import {
  Button,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Collapse,
  IconButton,
} from "@mui/material";

import { price } from "../../../data/Filter/price";
import { discount } from "../../../data/Filter/discount";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  fetchCategoryAttributes,
  selectCategoryAttributes,
} from "../../../Redux Toolkit/Admin/CategoryAttributeSlice";

import type { CategoryAttribute } from "../../../types/categoryAttributeTypes";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

interface FilterSectionProps {
  categoryId?: string;
}

interface ExpandedSections {
  [key: string]: boolean;
  color: boolean;
  price: boolean;
  discount: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({ categoryId: propCategoryId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const categoryAttributes = useAppSelector(selectCategoryAttributes);
  const categoryState = useAppSelector((state: any) => state.category);

  // ✅ NEW: get products from redux
  const products = useAppSelector((state) => state.products.products);

  const [attributeSearches, setAttributeSearches] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    color: false,
    price: false,
    discount: false,
  });

  const urlCategoryId = searchParams.get("category");
  const reduxCategoryId =
    categoryState?.selectedCategory?.categoryId ||
    categoryState?.selectedCategory?._id;

  const categoryId = propCategoryId || urlCategoryId || reduxCategoryId;

  // ✅ Fetch attributes
  useEffect(() => {
    if (categoryId) {
      dispatch(fetchCategoryAttributes({ categoryId, includeInactive: false }));
    }
  }, [categoryId, dispatch]);

  // ✅ ONLY show filterable attributes
  const allAttributes = useMemo(() => {
    return categoryAttributes
      .filter((attr: CategoryAttribute) => {
        return (
          attr.isActive &&
          attr.type === "select" &&
          Array.isArray(attr.options) &&
          attr.options.length > 0 &&
          attr.isFilterable === true
        );
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [categoryAttributes]);

  // ✅ NEW: Extract available values from products
  const getAvailableOptions = (attrName: string): string[] => {
    const values = new Set<string>();

    products?.forEach((product: any) => {
      product?.variants?.forEach((variant: any) => {
        const val = variant?.specifications?.[attrName];
        if (val) {
          values.add(String(val));
        }
      });
    });

    return Array.from(values);
  };

  const handleToggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAttributeFilterChange = (attrName: string, value: string, checked: boolean) => {
    const currentValues = searchParams.get(attrName)?.split(",") || [];

    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);

    if (newValues.length > 0) {
      searchParams.set(attrName, newValues.join(","));
    } else {
      searchParams.delete(attrName);
    }

    setSearchParams(searchParams);
  };

  const getSelectedValues = (name: string) =>
    searchParams.get(name)?.split(",") || [];

  const setSearch = (name: string, value: string) => {
    setAttributeSearches((prev) => ({ ...prev, [name]: value }));
  };

  const filterOptions = (options: string[], search: string) => {
    if (!search) return options;
    return options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));
  };

  const renderHeader = (title: string, key: string) => (
    <Box
      onClick={() => handleToggleSection(key)}
      sx={{ display: "flex", justifyContent: "space-between", cursor: "pointer", py: 1 }}
    >
      <Typography fontWeight={600}>{title}</Typography>
      <IconButton size="small">
        {expandedSections[key] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </Box>
  );

  return (
    <div className="bg-white space-y-5">

      {/* HEADER */}
      <div className="flex justify-between px-6">
        <p className="font-semibold text-lg">Filters</p>
        <Button onClick={() => setSearchParams({})}>Clear All</Button>
      </div>

      <Divider />

      <div className="px-6 space-y-5">

        {/* ✅ DYNAMIC FILTERS */}
        {allAttributes.map((attr) => {
          const key = `attr_${attr.name}`;
          const selected = getSelectedValues(attr.name);

          // ✅ NEW: Get only available values from products
          const availableOptions = getAvailableOptions(attr.name);

          // ✅ Filter only available options
          const options = filterOptions(
            (attr.options || []).filter(opt => availableOptions.includes(opt)),
            attributeSearches[attr.name] || ""
          );

          // ✅ HIDE attribute if no values exist
          if (options.length === 0) return null;

          return (
            <section key={attr.name}>
              {renderHeader(attr.label, key)}

              <Collapse in={expandedSections[key]}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={`Search ${attr.label}`}
                  value={attributeSearches[attr.name] || ""}
                  onChange={(e) => setSearch(attr.name, e.target.value)}
                  sx={{ mb: 1 }}
                />

                <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                  {options.map((opt) => (
                    <FormControlLabel
                      key={opt}
                      control={
                        <Checkbox
                          checked={selected.includes(opt)}
                          onChange={(e) =>
                            handleAttributeFilterChange(attr.name, opt, e.target.checked)
                          }
                        />
                      }
                      label={opt}
                    />
                  ))}
                </Box>
              </Collapse>

              <Divider />
            </section>
          );
        })}

        {/* LOADING */}
        {categoryAttributes.length === 0 && (
          <Box textAlign="center">
            <CircularProgress size={24} />
          </Box>
        )}

        {/* PRICE */}
        <section>
          {renderHeader("Price", "price")}
          <Collapse in={expandedSections.price}>
            <RadioGroup
              onChange={(e) => {
                searchParams.set("price", e.target.value);
                setSearchParams(searchParams);
              }}
            >
              {price.map((p) => (
                <FormControlLabel key={p.value} value={p.value} control={<Radio />} label={p.name} />
              ))}
            </RadioGroup>
          </Collapse>
        </section>

        {/* DISCOUNT */}
        <section>
          {renderHeader("Discount", "discount")}
          <Collapse in={expandedSections.discount}>
            <RadioGroup
              onChange={(e) => {
                searchParams.set("discount", e.target.value);
                setSearchParams(searchParams);
              }}
            >
              {discount.map((d) => (
                <FormControlLabel key={d.value} value={d.value} control={<Radio />} label={d.name} />
              ))}
            </RadioGroup>
          </Collapse>
        </section>

      </div>
    </div>
  );
};

export default FilterSection;