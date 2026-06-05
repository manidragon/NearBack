// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Account\Profile.tsx
import { Alert, Divider, Snackbar, Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Order from './Order';
import UserDetails from './UserDetails';
import SavedCards from './SavedCards';
import OrderDetails from './OrderDetails';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { performLogout } from '../../../Redux Toolkit/Customer/AuthSlice';
import Addresses from './Adresses';
import WalletBalance from '../../components/Wallet/WalletBalance';

const menu = [
  { name: "Orders", path: "/account/orders" },
  { name: "Wallet", path: "/account/wallet" },
  { name: "Profile", path: "/account/profile" },
  { name: "Saved Cards", path: "/account/saved-card" },
  { name: "Addresses", path: "/account/addresses" },
  { name: "Logout", path: "/" }
];

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const orders = useAppSelector(state => state.orders);
  const user = useAppSelector(state => state.user);
  const [snackbarOpen, setOpenSnackbar] = useState(false);

 const handleLogout = () => {
  dispatch(performLogout());

  localStorage.clear();
  sessionStorage.clear();

  navigate("/", { replace: true });

  window.location.replace("/");
};

  const handleClick = (item: any) => {
    if (item.name === "Logout") {
      handleLogout();
    } else {
      navigate(item.path);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  useEffect(() => {
  const jwt = localStorage.getItem("jwt");

  if (!jwt) {
    navigate("/", { replace: true });
  }
}, [navigate]);

  useEffect(() => {
    if (user.profileUpdated || orders.orderCanceled || user.error) {
      setOpenSnackbar(true);
    }
  }, [user.profileUpdated, orders.orderCanceled, user.error]);

  return (
    <div className='px-5 lg:px-52 min-h-screen mt-10'>
      <div>
        <h1 className='text-xl font-bold pb-5'>{user.user?.fullName}</h1>
      </div>
      <Divider />
      <div className='grid grid-cols-1 lg:grid-cols-3 lg:min-h-[78vh]'>
        {/* Sidebar */}
        <div className="col-span-1 lg:border-r lg:pr-5 py-5 h-full flex flex-row flex-wrap lg:flex-col gap-3">
          {menu.map((item, index) => (
            <div
              key={item.path}
              onClick={() => handleClick(item)}
              className={`${index !== menu.length - 1 ? "border-b" : ""}
                ${item.path === location.pathname ? "bg-primary-color text-white" : ""}
                px-5 py-3 rounded-md hover:bg-teal-500 hover:text-white cursor-pointer`}
            >
              <p>{item.name}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className='lg:col-span-2 lg:pl-5 py-5'>
          <Routes>
            <Route path='/' element={<UserDetails />} />
            <Route path='/orders' element={<Order />} />
            <Route path='/orders/:orderId/item/:orderItemId' element={<OrderDetails />} />
            <Route path='/profile' element={<UserDetails />} />
            <Route path='/saved-card' element={<SavedCards />} />
            <Route path='/addresses' element={<Addresses />} />
            <Route
              path='/wallet'
              element={
                <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                    💳 My Wallet
                  </Typography>
                  <WalletBalance compact={false} />
                </Box>
              }
            />
          </Routes>
        </div>
      </div>

      {/* Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={user.error ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {user.error
            ? user.error
            : orders.orderCanceled
              ? "Order canceled successfully"
              : "Profile updated successfully"}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Profile;