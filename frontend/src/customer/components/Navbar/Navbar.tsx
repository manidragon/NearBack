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
  Card,
  CardMedia,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import "./Navbar.css";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import CategorySheet from "./CategorySheet";
import DrawerList from "./DrawerList";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { FavoriteBorder } from "@mui/icons-material";
import { selectCartItemCount } from "../../../Redux Toolkit/Customer/CartSlice";
import { fetchCategories } from "../../../Redux Toolkit/Admin/CategorySlice";

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

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  // ✅ FIXED: Sort Level 1 categories by ORDER field (not alphabetically)
  const levelOneCategories = React.useMemo(() => {
    return categories
      .filter(cat => cat.level === 1)
      .sort((a, b) => {
        // ✅ Primary sort by order field
        const orderA = a.order || 999999;
        const orderB = b.order || 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        // ✅ Secondary sort by name (for same order values)
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [categories]);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const becomeSellerClick = () => {
    if (sellers.profile?._id) {
      navigate("/seller");
    } else {
      navigate("/become-seller");
    }
  };

  const cartItemCount = useAppSelector(selectCartItemCount);

  return (
    <Box
      sx={{ zIndex: 2 }}
      className="sticky top-0 left-0 right-0 bg-white blur-bg bg-opacity-80"
    >
      <div className="flex items-center justify-between px-5 lg:px-20 h-[70px] border-b">
        <div className="flex items-center gap-9">
          <div className="flex items-center gap-2">
            {!isLarge && (
              <IconButton onClick={toggleDrawer(true)}>
                <MenuIcon className="text-gray-700" sx={{ fontSize: 29 }} />
              </IconButton>
            )}
            <h1
              onClick={() => navigate("/")}
              className="logo cursor-pointer text-lg md:text-2xl text-[#00927c]"
            >
              Near Look
            </h1>
          </div>
        </div>

        <div className="flex gap-1 lg:gap-6 items-center">
          <IconButton onClick={() => navigate("/search-products")}>
            <SearchIcon className="text-gray-700" sx={{ fontSize: 29 }} />
          </IconButton>

          {user.user ? (
            <Button
              onClick={() => navigate("/account/orders")}
              className="flex items-center gap-2"
            >
              <Avatar
                sx={{
                  width: 29,
                  height: 29,
                  border: '2px solid #00927c',
                  bgcolor: user.user?.profilePicture ? 'transparent' : '#00927c'
                }}
                src={user.user?.profilePicture || "https://cdn.pixabay.com/photo/2015/04/15/09/28/head-723540_640.jpg    "}
                alt={user.user?.fullName || "User"}
                imgProps={{
                  style: {
                    objectFit: 'cover'
                  }
                }}
              />
              <h1 className="font-semibold hidden lg:block">
                {user.user?.fullName?.split(" ")[0]}
              </h1>
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<AccountCircleIcon sx={{ fontSize: "12px" }} />}
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          )}

          <IconButton onClick={() => navigate("/wishlist")}>
            <FavoriteBorder sx={{ fontSize: 29 }} className="text-gray-700" />
          </IconButton>

          <IconButton onClick={() => navigate("/cart")}>
            <Badge badgeContent={cartItemCount} color="primary">
              <AddShoppingCartIcon
                sx={{ fontSize: 29 }}
                className="text-gray-700"
              />
            </Badge>
          </IconButton>

          {isLarge && (
            <Button
              onClick={becomeSellerClick}
              startIcon={<StorefrontIcon />}
              variant="outlined"
            >
              Become Seller
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between px-5 !py-2 lg:px-20 h-[100px] border-b">
        {isLarge && (
          <ul className="flex items-center font-medium  text-gray-800 gap-4 w-full justify-between">
            {levelOneCategories.map((category) => (
              <li
                key={category._id}
                onMouseLeave={() => setShowSheet(false)}
                onMouseEnter={() => {
                  setSelectedCategory(category._id);
                  setShowSheet(true);
                }}
                className="mainCategory hover:text-[#00927c] cursor-pointer h-[70px] px-2 flex flex-col items-center justify-center w-[200px] text-center"
              >
                {category.image && (
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      mb: 0.5,
                    }}
                  >
                    <img
                      src={category.image}
                      alt={category.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '10%',
                      }}
                    />
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
        <div
          onMouseLeave={() => setShowSheet(false)}
          onMouseEnter={() => setShowSheet(true)}
          className="categorySheet absolute top-[9.59rem] left-20 right-20 z-[9999] "
        >
          <CategorySheet
            setShowSheet={setShowSheet}
            selectedCategory={selectedCategory}
          />
        </div>
      )}
    </Box>
  );
};

export default Navbar;