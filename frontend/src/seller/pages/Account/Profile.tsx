import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../../Redux Toolkit/Store";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  Modal,
  Snackbar,
  Typography,
} from "@mui/material";
import ProfileFildCard from "./ProfileFildCard";
import EditIcon from "@mui/icons-material/Edit";
import PersonalDetailsForm from "./PersionalDetailsForm";
import BusinessDetailsForm from "./BussinessDetailsForm";
import PickupAddressForm from "./PickupAddressForm";
import BankDetailsForm from "./BankDetailsForm";
import LogoUploadForm from "./LogoUploadForm";

export const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const Profile = () => {
  const sellers = useAppSelector((state) => state.sellers);
  const [open, setOpen] = React.useState(false);
  const [selectedForm, setSelectedForm] = useState("personalDetails");
  const handleClose = () => setOpen(false);
  const [snackbarOpen, setOpenSnackbar] = useState(false);

  const handleOpen = (formName: string) => {
    setOpen(true);
    setSelectedForm(formName);
  };

  const renderSelectedForm = () => {
    switch (selectedForm) {
      case "personalDetails":
        return <PersonalDetailsForm onClose={handleClose} />;
      case "businessDetails":
        return <BusinessDetailsForm onClose={handleClose} />;
      case "pickupAddress":
        return <PickupAddressForm onClose={handleClose} />;
      case "bankDetails":
        return <BankDetailsForm onClose={handleClose} />;
      case "logo":
        return <LogoUploadForm onClose={handleClose} />;
      default:
        return null;
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  useEffect(() => {
    if (sellers.profileUpdated || sellers.error) {
      setOpenSnackbar(true);
    }
  }, [sellers.profileUpdated, sellers.error]);

  // ✅ Helper to safely get address data
  const getAddressField = (field: string) => {
    const addr = sellers.profile?.pickupAddress;
    if (!addr) return "Not provided";
    if (typeof addr === 'string') return "Loading...";
    return addr[field as keyof typeof addr] || "Not provided";
  };

  return (
    <div className="lg:px-20 pt-5 pb-20 space-y-20">
      {/* ✅ Logo Section */}
      <div className="w-full lg:w-[70%]">
        <div className="flex items-center pb-3 justify-between">
          <h1 className="text-2xl font-bold text-gray-600">
            Business Logo
          </h1>
          <div>
            <Button
              onClick={() => handleOpen("logo")}
              size="small"
              sx={{ borderRadius: "2.9rem" }}
              variant="contained"
              className="w-16 h-16"
            >
              <EditIcon />
            </Button>
          </div>
        </div>
        <div className="flex justify-center items-center p-5 bg-slate-50 rounded-md">
          {sellers.profile?.businessDetails?.logo ? (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={sellers.profile.businessDetails.logo}
                alt="Business Logo"
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  objectFit: 'contain',
                }}
              />
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                Your business logo
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', p: 5 }}>
              <Typography variant="body1" color="text.secondary">
                No logo uploaded yet
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Click edit to upload your business logo
              </Typography>
            </Box>
          )}
        </div>
      </div>

      <div className="w-full lg:w-[70%]">
        <div className="flex items-center pb-3 justify-between">
          <h1 className="text-2xl font-bold text-gray-600">
            Personal Details
          </h1>
          <div>
            <Button
              onClick={() => handleOpen("personalDetails")}
              size="small"
              sx={{ borderRadius: "2.9rem" }}
              variant="contained"
              className="w-16 h-16"
            >
              <EditIcon />
            </Button>
          </div>
        </div>
        <div className="space-y-5">
         
          <div>
            <ProfileFildCard
              keys={"Seller Name"}
              value={sellers.profile?.sellerName || "Not provided"}
            />
            <Divider />
            <ProfileFildCard
              keys={"Email"}
              value={sellers.profile?.email || "Not provided"}
            />
            <Divider />
            <ProfileFildCard
              keys={"Mobile"}
              value={sellers.profile?.mobile || "Not provided"}
            />
          </div>
        </div>
      </div>

      <div className="mt-10 lg:w-[70%]">
        <div className="flex items-center pb-3 justify-between">
          <h1 className="text-2xl font-bold text-gray-600">
            Business Details
          </h1>
          <div>
            <Button
              onClick={() => handleOpen("businessDetails")}
              size="small"
              sx={{ borderRadius: "2.9rem" }}
              variant="contained"
              className="w-16 h-16"
            >
              <EditIcon />
            </Button>
          </div>
        </div>

        <div className="">
          <ProfileFildCard
            keys={"Business Name"}
            value={sellers.profile?.businessDetails?.businessName || "Not provided"}
          />
          <Divider />
          <ProfileFildCard
            keys={"Business Email"}
            value={sellers.profile?.businessDetails?.businessEmail || "Not provided"}
          />
          <Divider />
          <ProfileFildCard
            keys={"Business Mobile"}
            value={sellers.profile?.businessDetails?.businessMobile || "Not provided"}
          />
          <Divider />
          <ProfileFildCard
            keys={"Business Address"}
            value={sellers.profile?.businessDetails?.businessAddress || "Not provided"}
          />
          <Divider />
          <ProfileFildCard
            keys={"GSTIN"}
            value={sellers.profile?.GSTIN || "Not provided"}
          />
          <Divider />
          <ProfileFildCard
            keys={"Account Status"}
            value={sellers.profile?.accountStatus || "Not provided"}
          />
        </div>
      </div>

      <div className="mt-10 lg:w-[70%]">
        <div className="flex items-center pb-3 justify-between">
          <h1 className="text-2xl font-bold text-gray-600">Pickup Address</h1>
          <div>
            <Button
              onClick={() => handleOpen("pickupAddress")}
              size="small"
              sx={{ borderRadius: "2.9rem" }}
              variant="contained"
              className="w-16 h-16"
            >
              <EditIcon />
            </Button>
          </div>
        </div>
        <div className="space-y-5">
          <div className="">
            <ProfileFildCard
              keys={"Address"}
              value={getAddressField("address")}
            />
            <Divider />
            <ProfileFildCard
              keys={"Locality"}
              value={getAddressField("locality")}
            />
            <Divider />
            <ProfileFildCard
              keys={"City"}
              value={getAddressField("city")}
            />
            <Divider />
            <ProfileFildCard
              keys={"State"}
              value={getAddressField("state")}
            />
            <Divider />
            <ProfileFildCard
              keys={"Pin Code"}
              value={getAddressField("pinCode")}
            />
            <Divider />
            <ProfileFildCard
              keys={"Mobile"}
              value={getAddressField("mobile")}
            />
          </div>
        </div>
      </div>

      <div className="mt-10 lg:w-[70%]">
        <div className="flex items-center pb-3 justify-between">
          <h1 className="text-2xl font-bold text-gray-600">Bank Details</h1>
          <div>
            <Button
              onClick={() => handleOpen("bankDetails")}
              size="small"
              sx={{ borderRadius: "2.9rem" }}
              variant="contained"
              className="w-16 h-16"
            >
              <EditIcon />
            </Button>
          </div>
        </div>
        <div className="space-y-5">
          <div className="">
            <ProfileFildCard
              keys={"Account Holder Name"}
              value={sellers.profile?.bankDetails?.accountHolderName || "Not provided"}
            />
            <Divider />
            <ProfileFildCard
              keys={"Account Number"}
              value={sellers.profile?.bankDetails?.accountNumber || "Not provided"}
            />
            <Divider />
            <ProfileFildCard
              keys={"IFSC Code"}
              value={sellers.profile?.bankDetails?.ifscCode || "Not provided"}
            />
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>{renderSelectedForm()}</Box>
      </Modal>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={sellers.error ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {sellers.error ? sellers.error : "Profile Updated Successfully"}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Profile;