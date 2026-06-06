// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\components\SideBar\DrawerList.tsx

import DrawerList from "../../../admin seller/components/drawerList/DrawerList";

import {
  AccountBox,
  Replay,
  SwapHoriz,
} from "@mui/icons-material";

import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import InventoryIcon from "@mui/icons-material/Inventory";
import AddIcon from "@mui/icons-material/Add";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import EmailIcon from "@mui/icons-material/Email";

const menu = [
  {
    name: "Dashboard",
    path: "/seller",
    icon: <DashboardIcon className="text-primary-color" />,
    activeIcon: <DashboardIcon className="text-white" />,
  },
  {
    name: "Orders",
    path: "/seller/orders",
    icon: <ShoppingBagIcon className="text-primary-color" />,
    activeIcon: <ShoppingBagIcon className="text-white" />,
  },

  {
    name: "Returns",
    path: "/seller/returns",
    icon: <Replay className="text-primary-color" />,
    activeIcon: <Replay className="text-white" />,
  },
  {
    name: "Replacements",
    path: "/seller/replacements",
    icon: <SwapHoriz className="text-primary-color" />,
    activeIcon: <SwapHoriz className="text-white" />,
  },
  {
    name: "Products",
    path: "/seller/products",
    icon: <InventoryIcon className="text-primary-color" />,
    activeIcon: <InventoryIcon className="text-white" />,
  },
  {
    name: "Stock Management",
    path: "/seller/stock",
    icon: <WarehouseIcon className="text-primary-color" />,
    activeIcon: <WarehouseIcon className="text-white" />,
  },
  {
    name: "Offline Sale",
    path: "/seller/offline-sale",
    icon: <ReceiptLongIcon className="text-primary-color" />,
    activeIcon: <ReceiptLongIcon className="text-white" />,
  },
  {
    name: "Add Product",
    path: "/seller/add-product",
    icon: <AddIcon className="text-primary-color" />,
    activeIcon: <AddIcon className="text-white" />,
  },
  {
    name: "Payment",
    path: "/seller/payment",
    icon: <AccountBalanceWalletIcon className="text-primary-color" />,
    activeIcon: <AccountBalanceWalletIcon className="text-white" />,
  },
  {
    name: "Transaction",
    path: "/seller/transaction",
    icon: <ReceiptIcon className="text-primary-color" />,
    activeIcon: <ReceiptIcon className="text-white" />,
  },
  {
  name: "Enquiries",
  path: "/seller/enquiries",
  icon: <EmailIcon className="text-primary-color" />,
  activeIcon: <EmailIcon className="text-white" />,
},
];

const menu2 = [
  {
    name: "Account",
    path: "/seller/account",
    icon: <AccountBox className="text-primary-color" />,
    activeIcon: <AccountBox className="text-white" />,
  },
  {
    name: "Logout",
    path: "/",
    icon: <LogoutIcon className="text-primary-color" />,
    activeIcon: <LogoutIcon className="text-white" />,
  },
];

interface DrawerListProps {
  toggleDrawer?: any;
}

const SellerDrawerList = ({ toggleDrawer }: DrawerListProps) => {
  return (
    <DrawerList
      menu={menu}
      menu2={menu2}
      toggleDrawer={toggleDrawer}
    />
  );
};

export default SellerDrawerList;