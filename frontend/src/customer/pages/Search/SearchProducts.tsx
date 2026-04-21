// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Search\SearchProducts.tsx
import { type ChangeEvent, useState, useEffect } from 'react';
import { searchProduct } from '../../../Redux Toolkit/Customer/ProductSlice';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import ProductCard from '../Products/ProductCard/ProductCard';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  InputAdornment, 
  TextField 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { Product } from '../../../types/productTypes';

const SearchProducts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const dispatch = useAppDispatch();
  const products = useAppSelector(state => state.products);

const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setSearchQuery(value);
  
  // Auto-search with debounce (Flipkart-style: search as you type)
  if (value.trim().length >= 2) { // Lower threshold for better UX
    const timer = setTimeout(() => {
      if (value.trim()) {
        setHasSearched(true);
        dispatch(searchProduct(value.trim()));
      }
    }, 400); // 400ms debounce - balances responsiveness & performance
    return () => clearTimeout(timer);
  } else if (value.trim().length === 0) {
    // Clear results when query is empty
    setHasSearched(false);
  }
};

  const handleProductSearch = () => {
    if (searchQuery.trim()) {
      setHasSearched(true);
      dispatch(searchProduct(searchQuery.trim()));
    }
  };

const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    // Force immediate search on Enter (bypass debounce)
    if (searchQuery.trim()) {
      setHasSearched(true);
      dispatch(searchProduct(searchQuery.trim()));
    }
  }
};

  // ✅ Reset search state when component unmounts or query clears
  useEffect(() => {
    if (!searchQuery) {
      setHasSearched(false);
    }
  }, [searchQuery]);

  return (
    <div className='min-h-screen px-4 lg:px-20 py-8'>
      {/* Search Input */}
      <div className="flex justify-center py-5">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search products by name, brand, or category..."
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: products.loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
          }}
          sx={{ 
            maxWidth: '600px', 
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'background.paper',
            }
          }}
          aria-label="Search products"
        />
      </div>

      {/* Results Section */}
      <section>
        {/* Loading State */}
        {products.loading && !hasSearched && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Search Results */}
        {products.searchProduct && products.searchProduct.length > 0 ? (
          <section className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 px-2 lg:px-5 justify-center">
            {products.searchProduct.map((item: Product) => (
              <div key={item._id}> {/* ✅ Use product _id as key */}
                <ProductCard item={item} />
              </div>
            ))}
          </section>
        ) : 
        // No Results State
        hasSearched && searchQuery.trim() && !products.loading ? (
          <Box className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No products found for "{searchQuery}"
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try different keywords or check your spelling
            </Typography>
            <button
              onClick={() => { setSearchQuery(''); setHasSearched(false); }}
              className="mt-4 text-primary-color hover:underline font-medium"
            >
              Clear search
            </button>
          </Box>
        ) : 
        // Initial Empty State
        !hasSearched ? (
          <Box className='h-[60vh] flex flex-col justify-center items-center text-center px-4'>
            <Typography variant="h4" fontWeight="bold" color="text.secondary" gutterBottom>
              🔍 Search Products
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter a product name, brand, or keyword to find what you're looking for
            </Typography>
          </Box>
        ) : null}

        {/* Error State */}
        {products.error && (
          <Box className="text-center py-10">
            <Typography color="error" variant="body1">
              ⚠️ {products.error}
            </Typography>
            <button
              onClick={() => dispatch(searchProduct(searchQuery))}
              className="mt-4 text-primary-color hover:underline"
            >
              Try again
            </button>
          </Box>
        )}
      </section>
    </div>
  );
};

export default SearchProducts;