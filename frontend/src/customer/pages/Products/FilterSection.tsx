// frontend/src/customer/pages/Products/FilterSection.tsx

import {
  Button,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Box,
  Typography,
  Collapse,
  IconButton,
} from "@mui/material";


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

  useEffect(() => {
    if (categoryId) {
      dispatch(fetchCategoryAttributes({ categoryId, includeInactive: false }));
    }
  }, [categoryId, dispatch]);

  const allAttributes = useMemo(() => {
    return categoryAttributes
      .filter((attr: CategoryAttribute) => {
        return (
          attr.isActive &&
          attr.type === "select" &&
          attr.isFilterable === true
        );
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [categoryAttributes]);

  // ✅ FIXED COLOR LOGIC
  const getAvailableColors = () => {
    const map = new Map<string, string>();

    products?.forEach((product: any) => {
      product?.availableColors?.forEach((color: string) => {
        if (!color) return;

        const normalized = color.trim().toLowerCase(); // normalize
        const display =
          normalized.charAt(0).toUpperCase() + normalized.slice(1); // Title Case

        map.set(normalized, display);
      });
    });

    return Array.from(map.values());
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

  const filterOptions = (options: string[], search: string) => {
    if (!search) return options;
    return options.filter((o) =>
      o.toLowerCase().includes(search.toLowerCase())
    );
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

  // ✅ Dynamic price ranges from DB
const getAvailablePriceRanges = () => {
  if (!products || products.length === 0) return [];

  const ranges = [
    { min: 0, max: 500 },
    { min: 500, max: 1000 },
    { min: 1000, max: 2000 },
    { min: 2000, max: 5000 },
    { min: 5000, max: 10000 },
    { min: 10000, max: 50000 },
  ];

  const availableRanges = ranges.filter((range) => {
    return products.some((product: any) => {
      return (
        product.minPrice >= range.min &&
        product.minPrice < range.max
      );
    });
  });

  return availableRanges;
};


// ✅ FILTER DISCOUNT BASED ON DB
const getAvailableDiscountRanges = () => {
  if (!products || products.length === 0) return [];

  return discount.filter((range) => {
    const [min, max] = range.value.split("-").map(Number);

    return products.some((product: any) =>
      product.variants?.some((variant: any) =>
        variant.offers?.some((offer: any) => {
          if (!offer.mrpPrice || !offer.sellingPrice) return false;

          const discountPercent =
            ((offer.mrpPrice - offer.sellingPrice) / offer.mrpPrice) * 100;

          return discountPercent >= min && discountPercent <= max;
        })
      )
    );
  });
};

  return (
    <div className="bg-white space-y-5">

      {/* HEADER */}
      <div className="flex justify-between px-6">
        <p className="font-semibold text-lg">Filters</p>
        <Button onClick={() => setSearchParams({})}>Clear All</Button>
      </div>

      <Divider />

      <div className="px-6 space-y-5">

        {/* ✅ COLOR FILTER */}
        <section>
          {renderHeader("Color", "color")}

          <Collapse in={expandedSections.color}>
            <Box sx={{ maxHeight: 200, overflow: "auto" }}>
              {getAvailableColors().map((color) => (
                <FormControlLabel
                  key={color}
                  control={
                    <Checkbox
                      checked={getSelectedValues("color").includes(color.toLowerCase())}
                      onChange={(e) =>
                        handleAttributeFilterChange(
                          "color",
                          color.toLowerCase(), // store normalized
                          e.target.checked
                        )
                      }
                    />
                  }
                  label={color} // display formatted
                />
              ))}
            </Box>
          </Collapse>

          <Divider />
        </section>

        {/* ✅ ATTRIBUTE FILTERS */}
        {allAttributes.map((attr) => {
          const key = `attr_${attr.name}`;
          const selected = getSelectedValues(attr.name);

          let options: string[] = [];
          const hasProducts = products && products.length > 0;

          if (hasProducts) {
            const productValues = new Set<string>();

            products.forEach((product: any) => {
              const value = product?.highlights?.[attr.name];

              if (value !== undefined && value !== null) {
                if (typeof value === "boolean") {
                  productValues.add(value ? "Yes" : "No");
                } else {
                  productValues.add(String(value).trim());
                }
              }

              product?.variants?.forEach((variant: any) => {
                const specValue =
                  variant?.specifications?.[attr.name] ||
                  variant?.[attr.name];

                if (specValue) {
                  productValues.add(String(specValue).trim());
                }
              });
            });

            options = Array.from(productValues);
          } else {
            options = attr.options || [];
          }

          options = filterOptions(options, attributeSearches[attr.name] || "");

          if (options.length === 0) return null;

          return (
            <section key={attr.name}>
              {renderHeader(attr.label, key)}

              <Collapse in={expandedSections[key]}>
                <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                  {options.map((opt) => (
                    <FormControlLabel
                      key={opt}
                      control={
                        <Checkbox
                          checked={selected.includes(opt)}
                          onChange={(e) =>
                            handleAttributeFilterChange(
                              attr.name,
                              opt,
                              e.target.checked
                            )
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

        {/* PRICE */}
      {/* ✅ PRICE (DYNAMIC - FIXED) */}
<section>
  {renderHeader("Price", "price")}

  <Collapse in={expandedSections.price}>
    <RadioGroup
      onChange={(e) => {
        const [min, max] = e.target.value.split("-");
        searchParams.set("minPrice", min);
        searchParams.set("maxPrice", max);
        setSearchParams(searchParams);
      }}
    >
      {getAvailablePriceRanges().map((range, i) => (
        <FormControlLabel
          key={i}
          value={`${range.min}-${range.max}`}
          control={<Radio />}
          label={`₹${range.min} - ₹${range.max}`}
        />
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
    const value = e.target.value;      // "10-20"
    const [min, max] = value.split("-"); // ["10", "20"]

    searchParams.set("minDiscount", min);
    searchParams.set("maxDiscount", max);

    setSearchParams(searchParams);
  }}
>
              {getAvailableDiscountRanges().map((d) => (
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