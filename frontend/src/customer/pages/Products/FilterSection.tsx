// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Products\FilterSection.tsx
import {
  Button,
  Divider,
  FormControl,
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
import { teal } from "@mui/material/colors";
import { colors } from "../../../data/Filter/color";
import { price } from "../../../data/Filter/price";
import { discount } from "../../../data/Filter/discount";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchCategoryAttributes, selectCategoryAttributes } from "../../../Redux Toolkit/Admin/CategoryAttributeSlice";
import type { CategoryAttribute } from "../../../types/categoryAttributeTypes";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// ✅ Props interface for FilterSection
interface FilterSectionProps {
  categoryId?: string;
}

// ✅ Type definition for expanded sections (dynamic keys allowed)
interface ExpandedSections {
  [key: string]: boolean;
  color: boolean;
  price: boolean;
  discount: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({ categoryId: propCategoryId }) => {
  const [expendColor, setExpendColor] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const categoryAttributes = useAppSelector(selectCategoryAttributes);
  const categoryState = useAppSelector((state: any) => state.category);
  
  // ✅ Individual search state for EACH attribute (dynamic)
  const [attributeSearches, setAttributeSearches] = useState<Record<string, string>>({});

  // ✅ All sections collapsed by default
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    color: false,
    price: false,
    discount: false,
  });
  
  // ✅ Category resolution: prop → URL → Redux
  const urlCategoryId = searchParams.get("category");
  const reduxCategoryId = categoryState?.selectedCategory?.categoryId || 
                          categoryState?.selectedCategory?._id;
  const categoryId = propCategoryId || urlCategoryId || reduxCategoryId;

  // ✅ Fetch category attributes when category changes
  useEffect(() => {
    if (categoryId) {
      dispatch(fetchCategoryAttributes({ 
        categoryId, 
        includeInactive: false 
      }));
    }
  }, [categoryId, dispatch]);

  const handleExpendColor = () => {
    setExpendColor(!expendColor);
  };

  // ✅ Toggle any section (static or dynamic attribute)
  const handleToggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const updateFilterParams = (e: any) => {
    const { value, name } = e.target;
    if (value) {
      searchParams.set(name, value);
    } else {
      searchParams.delete(name);
    }
    setSearchParams(searchParams);
  };

  // ✅ Handle category attribute filter (checkbox multi-select)
  const handleAttributeFilterChange = (attrName: string, value: string, checked: boolean) => {
    const currentValues = searchParams.get(attrName)?.split(",") || [];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, value].filter(Boolean);
    } else {
      newValues = currentValues.filter(v => v !== value);
    }
    
    if (newValues.length > 0) {
      searchParams.set(attrName, newValues.join(","));
    } else {
      searchParams.delete(attrName);
    }
    setSearchParams(searchParams);
  };

  const clearAllFilters = () => {
    searchParams.forEach((value: any, key: any) => {
      searchParams.delete(key);
    });
    setSearchParams(searchParams);
    // ✅ Clear all attribute searches
    setAttributeSearches({});
  };

  // ✅ Get ALL active select-type attributes (NO grouping)
 const allAttributes = useMemo(() => {
  const activeAttrs = categoryAttributes.filter((attr: CategoryAttribute) => {
    return attr.isActive && 
           attr.type === 'select' && 
           attr.options && 
           attr.options.length > 0 &&
           // ✅✅✅ NEW: Only include if marked as filterable
           (attr.isFilterable !== false); // Default true if undefined
  });
  
  // Sort by sortOrder → order → label
  activeAttrs.sort((a: CategoryAttribute, b: CategoryAttribute) => {
    const sortOrderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (sortOrderDiff !== 0) return sortOrderDiff;
    
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    
    return (a.label || '').localeCompare(b.label || '');
  });
  
  return activeAttrs;
}, [categoryAttributes]);

  // ✅ Get currently selected values for an attribute
  const getSelectedValues = (attrName: string): string[] => {
    return searchParams.get(attrName)?.split(",") || [];
  };

  // ✅ Get search query for a specific attribute
  const getAttributeSearch = (attrName: string): string => {
    return attributeSearches[attrName] || '';
  };

  // ✅ Set search query for a specific attribute
  const setAttributeSearch = (attrName: string, value: string) => {
    setAttributeSearches(prev => ({
      ...prev,
      [attrName]: value
    }));
  };

  // ✅ Filter options based on search query
  const filterOptions = (options: string[], searchQuery: string): string[] => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((option: string) => 
      option.toLowerCase().includes(query)
    );
  };

  // ✅ Render section header with toggle button
  const renderSectionHeader = (title: string, sectionKey: string) => {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          py: 1,
          '&:hover': { bgcolor: 'action.hover' }
        }}
        onClick={() => handleToggleSection(sectionKey)}
      >
        <Typography variant="subtitle2" fontWeight="600" color="text.primary">
          {title}
        </Typography>
        <IconButton size="small">
          {expandedSections[sectionKey] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>
    );
  };

  // ✅ Render individual attribute section (dropdown style)
  const renderAttributeSection = (attr: CategoryAttribute) => {
    const sectionKey = `attr_${attr.name}`;
    const filteredOptions = filterOptions(attr.options || [], getAttributeSearch(attr.name));
    const selectedValues = getSelectedValues(attr.name);
    
    return (
      <section key={attr._id || attr.name}>
        {renderSectionHeader(attr.label, sectionKey)}
        <Collapse in={expandedSections[sectionKey] || false}>
          <FormControl>
            {/* Search Input */}
            <TextField
              fullWidth
              size="small"
              placeholder={`Search ${attr.label}...`}
              value={getAttributeSearch(attr.name)}
              onChange={(e) => setAttributeSearch(attr.name, e.target.value)}
              sx={{ mb: 1 }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SearchIcon fontSize="small" color="action" />
                  </Box>
                ),
                endAdornment: getAttributeSearch(attr.name) && (
                  <IconButton
                    size="small"
                    onClick={() => setAttributeSearch(attr.name, '')}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                ),
              }}
            />
            
            {/* Options List with Scroll */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: '200px', overflow: 'auto' }}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option: string) => {
                  const isChecked = selectedValues.includes(option);
                  
                  return (
                    <FormControlLabel
                      key={option}
                      control={
                        <Checkbox
                          size="small"
                          checked={isChecked}
                          onChange={(e) => 
                            handleAttributeFilterChange(attr.name, option, e.target.checked)
                          }
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.secondary">
                          {option}
                        </Typography>
                      }
                      sx={{ ml: 0 }}
                    />
                  );
                })
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: 'center' }}>
                  No results found
                </Typography>
              )}
            </Box>
          </FormControl>
        </Collapse>
      </section>
    );
  };

  return (
    <div className="-z-50 space-y-5 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between h-[40px] px-9 lg:border-r">
        <p className="text-lg font-semibold">Filters</p>
        <Button
          onClick={clearAllFilters}
          size="small"
          className="text-teal-600 cursor-pointer font-semibold"
        >
          clear all
        </Button>
      </div>
      <Divider />
      
      <div className="px-9 space-y-6">
        
        {/* ✅ Color Filter - Collapsed by Default */}
        <section>
          {renderSectionHeader('Color', 'color')}
          <Collapse in={expandedSections.color}>
            <FormControl sx={{ zIndex: 0 }}>
              <RadioGroup
                onChange={updateFilterParams}
                aria-labelledby="color"
                defaultValue=""
                name="color"
                value={searchParams.get("color") || ""}
              >
                {colors
                  .slice(0, expendColor ? colors.length : 5)
                  .map((item) => (
                    <FormControlLabel
                      sx={{ fontSize: "12px" }}
                      key={item.name}
                      value={item.name}
                      control={<Radio size="small" />}
                      label={
                        <div className="flex items-center gap-3">
                          <p>{item.name}</p>
                          <span
                            style={{ backgroundColor: item.hex }}
                            className={` h-5 w-5 rounded-full ${
                              item.name === "White" ? "border" : "border"
                            }`}
                          ></span>
                        </div>
                      }
                    />
                  ))}
              </RadioGroup>
            </FormControl>
            <div>
              <button
                onClick={handleExpendColor}
                className="text-teal-600 cursor-pointer hover:text-teal-900 flex items-center"
              >
                {expendColor ? "hide" : `+ ${colors.length - 5} more`}
              </button>
            </div>
          </Collapse>
        </section>
        <Divider />

        {/* ✅ ALL Category Attributes - Individual Dropdowns, Collapsed by Default */}
        {allAttributes.length > 0 && (
          <>
            {allAttributes.map((attr: CategoryAttribute) => renderAttributeSection(attr))}
            <Divider />
          </>
        )}

        {/* Loading state */}
        {categoryAttributes.length === 0 && categoryId && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* ✅ Price Filter - Collapsed by Default */}
        <section>
          {renderSectionHeader('Price', 'price')}
          <Collapse in={expandedSections.price}>
            <FormControl>
              <RadioGroup
                name="price"
                onChange={updateFilterParams}
                aria-labelledby="price"
                defaultValue=""
                value={searchParams.get("price") || ""}
              >
                {price.map((item) => (
                  <FormControlLabel
                    key={item.name}
                    value={item.value}
                    control={<Radio size="small" />}
                    label={item.name}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Collapse>
        </section>
        <Divider />
        
        {/* ✅ Discount Filter - Collapsed by Default */}
        <section>
          {renderSectionHeader('Discount', 'discount')}
          <Collapse in={expandedSections.discount}>
            <FormControl>
              <RadioGroup
                name="discount"
                onChange={updateFilterParams}
                aria-labelledby="discount"
                defaultValue=""
                value={searchParams.get("discount") || ""}
              >
                {discount.map((item) => (
                  <FormControlLabel
                    key={item.name}
                    value={item.value}
                    control={<Radio size="small" />}
                    label={item.name}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Collapse>
        </section>
        
      </div>
    </div>
  );
};

export default FilterSection;