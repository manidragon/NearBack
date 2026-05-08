// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\components\Navbar\Navbar.tsx
import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Divider,
  TextField,
  CircularProgress,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import "./Navbar.css";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CategorySheet from "./CategorySheet";
import DrawerList from "./DrawerList";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { FavoriteBorder } from "@mui/icons-material";
import { selectCartItemCount } from "../../../Redux Toolkit/Customer/CartSlice";
import { fetchCategories } from "../../../Redux Toolkit/Admin/CategorySlice";
// ✅ FIX 1: Comment out setLocationFilter import temporarily (we'll add it next)
import { setLocationFilter } from "../../../Redux Toolkit/Customer/ProductSlice";

// ✅ Tamil Nadu districts list
const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram',
  'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Viluppuram', 'Virudhunagar'
];

const Navbar = () => {
  const [showSheet, setShowSheet] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const theme = useTheme();
  const isLarge = useMediaQuery(theme.breakpoints.up("lg"));
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const auth = useAppSelector((state) => state.auth);
  const sellers = useAppSelector((state) => state.sellers);
  const { categories, loading } = useAppSelector((state) => state.category);

  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  // ✅ Location selector state
  const [locationAnchorEl, setLocationAnchorEl] = useState<null | HTMLElement>(null);
  const [locationMode, setLocationMode] = useState<'current' | 'district' | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  // ✅ Sort Level 1 categories by ORDER field
  const levelOneCategories = React.useMemo(() => {
    return categories
      .filter(cat => cat.level === 1)
      .sort((a, b) => {
        const orderA = a.order || 999999;
        const orderB = b.order || 999999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [categories]);

  const toggleDrawer = (newOpen: boolean) => () => setOpen(newOpen);
  const becomeSellerClick = () => {
    if (sellers.profile?._id) {
      navigate("/seller");
    } else {
      navigate("/become-seller");
    }
  };

  // ✅ FIX 2: Remove duplicate - keep only ONE cartItemCount declaration
  const cartItemCount = useAppSelector(selectCartItemCount);

  // ✅ Location menu handlers
  const handleLocationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLocationAnchorEl(event.currentTarget);
  };

  const handleLocationMenuClose = () => {
    setLocationAnchorEl(null);
  };

  useEffect(() => {
    // Load saved location from localStorage
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        setLocationMode(parsed.mode);
        setUserCoords(parsed.coordinates || null);
        setSelectedDistrict(parsed.district || '');

        // Dispatch to Redux
        if (parsed.mode === 'current' && parsed.coordinates) {
          dispatch(setLocationFilter({
            type: 'current',
            coordinates: parsed.coordinates,
            radiusKm: parsed.radiusKm || 50
          }));
        } else if (parsed.mode === 'district' && parsed.district) {
          dispatch(setLocationFilter({
            type: 'district',
            district: parsed.district
          }));
        }
      } catch (error) {
        console.error('Failed to parse saved location:', error);
      }
    }
  }, [dispatch]);

  const handleLocationSelect = (mode: 'current' | 'district') => {
    setLocationMode(mode);
    handleLocationMenuClose();

    if (mode === 'current') {
      handleGetCurrentLocation();
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };

        setUserCoords(coords);
        setLocationLoading(false);

        // ✅ Save to localStorage
        const locationData = {
          mode: 'current' as const,
          coordinates: coords,
          radiusKm: 50,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('userLocation', JSON.stringify(locationData));

        // Dispatch to Redux
        dispatch(setLocationFilter({
          type: 'current',
          coordinates: coords,
          radiusKm: 50
        }));
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(error.message || 'Failed to get location');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);

    // ✅ Save to localStorage
    const locationData = {
      mode: 'district' as const,
      district,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('userLocation', JSON.stringify(locationData));

    // Dispatch to Redux
    dispatch(setLocationFilter({
      type: 'district',
      district
    }));

    handleLocationMenuClose();
  };


  const handleClearLocation = () => {
    setLocationMode(null);
    setUserCoords(null);
    setSelectedDistrict('');

    // ✅ Remove from localStorage
    localStorage.removeItem('userLocation');

    // Clear Redux
    dispatch(setLocationFilter(null));
  };

  // ✅ Render location selector UI
const renderLocationSelector = () => {
  // ✅ Helper: Build menu items array (avoids JSX syntax issues)
  const getMenuItems = () => {
    const items: React.ReactNode[] = [];
    
    // 1. Current Location option
    items.push(
      <MenuItem 
        key="current-location"
        onClick={() => handleLocationSelect('current')} 
        disabled={locationLoading} 
        sx={{ gap: 1 }}
      >
        <LocationOnIcon sx={{ fontSize: 18, color: '#00927c' }} />
        <Typography variant="body2">Use Current Location</Typography>
      </MenuItem>
    );
    
    // 2. Divider
    items.push(<Divider key="divider-1" />);
    
    // 3. District selector
    items.push(
      <MenuItem key="district-select" sx={{ px: 2, py: 1, minWidth: 280 }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Select District"
          value={selectedDistrict}
          onChange={(e) => handleDistrictChange(e.target.value)}
          sx={{ minWidth: 220 }}
          SelectProps={{ native: false }}
        >
          {TN_DISTRICTS.map((dist) => (
            <MenuItem key={dist} value={dist}>{dist}</MenuItem>
          ))}
        </TextField>
      </MenuItem>
    );
    
    // 4. Clear Location (conditional)
    if (locationMode) {
      items.push(<Divider key="divider-2" />);
      items.push(
        <MenuItem 
          key="clear-location" 
          onClick={handleClearLocation} 
          sx={{ color: 'error.main', justifyContent: 'center' }}
        >
          <Typography variant="body2">Clear Location</Typography>
        </MenuItem>
      );
    }
    
    // 5. Loading state (conditional)
    if (locationLoading) {
      items.push(
        <MenuItem key="loading" disabled sx={{ justifyContent: 'center' }}>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography variant="body2">Detecting location...</Typography>
        </MenuItem>
      );
    }
    
    // 6. Error state (conditional)
    if (locationError) {
      items.push(
        <MenuItem key="error" disabled sx={{ color: 'error.main' }}>
          <Typography variant="body2">{locationError}</Typography>
        </MenuItem>
      );
    }
    
    return items;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Button
        size="small"
        startIcon={
          locationLoading ? (
            <CircularProgress size={16} />
          ) : locationMode === 'current' ? (
            <LocationOnIcon sx={{ color: '#00927c' }} />
          ) : locationMode === 'district' ? (
            <LocationOnIcon sx={{ color: '#1976d2' }} />
          ) : (
            <LocationOnIcon sx={{ color: 'text.secondary' }} />
          )
        }
        onClick={handleLocationMenuOpen}
        sx={{ 
          textTransform: 'none', 
          color: locationMode ? 'primary.main' : 'text.secondary',
          fontWeight: locationMode ? 500 : 400,
          minWidth: 'auto',
          px: 1
        }}
      >
        {locationLoading ? 'Detecting...' : 
         locationMode === 'current' && userCoords 
          ? `${userCoords.lat.toFixed(2)}°, ${userCoords.lng.toFixed(2)}°`
          : locationMode === 'district' && selectedDistrict
            ? selectedDistrict
            : 'Location'}
      </Button>
      
      {/* ✅ Menu with helper function - NO syntax errors */}
      <Menu
        anchorEl={locationAnchorEl}
        open={Boolean(locationAnchorEl)}
        onClose={handleLocationMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 1 }}
      >
        {getMenuItems()}
      </Menu>
    </Box>
  );
};

return (
  <Box sx={{ zIndex: 2 }} className="sticky top-0 left-0 right-0 bg-white blur-bg bg-opacity-80">
    <div className="flex items-center justify-between px-5 lg:px-20 h-[70px] border-b">
      <div className="flex items-center gap-9">
        <div className="flex items-center gap-2">
          {!isLarge && (
            <IconButton onClick={toggleDrawer(true)}>
              <MenuIcon className="text-gray-700" sx={{ fontSize: 29 }} />
            </IconButton>
          )}
          <h1 onClick={() => navigate("/")} className="logo cursor-pointer text-lg md:text-2xl text-[#00927c]">
            Near Look
          </h1>
        </div>
      </div>

      <div className="flex gap-1 lg:gap-6 items-center">
        <IconButton onClick={() => navigate("/search-products")}>
          <SearchIcon className="text-gray-700" sx={{ fontSize: 29 }} />
        </IconButton>

        {user.user ? (
          <Button onClick={() => navigate("/account/orders")} className="flex items-center gap-2">
            <Avatar
              sx={{
                width: 29, height: 29,
                border: '2px solid #00927c',
                bgcolor: user.user?.profilePicture ? 'transparent' : '#00927c'
              }}
              src={user.user?.profilePicture || "https://cdn.pixabay.com/photo/2015/04/15/09/28/head-723540_640.jpg"}
              alt={user.user?.fullName || "User"}
              imgProps={{ style: { objectFit: 'cover' } }}
            />
            <h1 className="font-semibold hidden lg:block">{user.user?.fullName?.split(" ")[0]}</h1>
          </Button>
        ) : (
          <Button variant="contained" startIcon={<AccountCircleIcon sx={{ fontSize: "12px" }} />} onClick={() => navigate("/login")}>
            Login
          </Button>
        )}

        <IconButton onClick={() => navigate("/wishlist")}>
          <FavoriteBorder sx={{ fontSize: 29 }} className="text-gray-700" />
        </IconButton>

        <IconButton onClick={() => navigate("/cart")}>
          <Badge badgeContent={cartItemCount} color="primary">
            <AddShoppingCartIcon sx={{ fontSize: 29 }} className="text-gray-700" />
          </Badge>
        </IconButton>

        {/* ✅ ADD: Location Selector */}
        {renderLocationSelector()}

        {isLarge && (
          <Button onClick={becomeSellerClick} startIcon={<StorefrontIcon />} variant="outlined">
            Become Seller
          </Button>
        )}
      </div>
    </div>

    {/* Category bar */}
    <div className="flex items-center justify-between px-5 !py-2 lg:px-20 h-[100px] border-b">
      {isLarge && (
        <ul className="flex items-center font-medium text-gray-800 gap-4 w-full justify-between">
          {levelOneCategories.map((category) => (
            <li
              key={category._id}
              onMouseLeave={() => setShowSheet(false)}
              onMouseEnter={() => { setSelectedCategory(category._id); setShowSheet(true); }}
              className="mainCategory hover:text-[#00927c] cursor-pointer h-[70px] px-2 flex flex-col items-center justify-center w-[200px] text-center"
            >
              {category.image && (
                <Box sx={{ width: 60, height: 60, mb: 0.5 }}>
                  <img src={category.image} alt={category.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10%' }} />
                </Box>
              )}
              <span className="text-sm">{category.name || 'Unnamed Category'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>

    <Drawer open={open} onClose={toggleDrawer(false)}>
      <DrawerList toggleDrawer={toggleDrawer} />
    </Drawer>

    {showSheet && selectedCategory && (
      <div onMouseLeave={() => setShowSheet(false)} onMouseEnter={() => setShowSheet(true)} className="categorySheet absolute top-[9.59rem] left-20 right-20 z-[9999]">
        <CategorySheet setShowSheet={setShowSheet} selectedCategory={selectedCategory} />
      </div>
    )}
  </Box>
);
};

export default Navbar;