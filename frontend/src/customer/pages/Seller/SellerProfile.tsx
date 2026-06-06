// src/customer/pages/SellerProfile/SellerProfile.tsx
import "./seller.css";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../../../Config/Api";
import { CircularProgress, Alert, Box } from "@mui/material";

import Header from "./Header";
import Products from "./Products";
import About from "./About";
import Reviews from "./Reviews";
import Policies from "./Policies";
import Contact from "./Contact";

export default function SellerProfile() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    if (!sellerId) {
      setLoading(false);
      setError("Seller ID not found");
      return;
    }

    setLoading(true);
    setError(null);

    // ✅ FIX: Use configured `api` instance instead of raw fetch
    // This ensures auth headers, base URL, and interceptors are applied
    api
      .get(`/sellers/${sellerId}`)
      .then((res) => {
        setSeller(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch seller:", err);
        setError(
          err.response?.data?.message || "Failed to load seller profile"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sellerId]);

  if (loading) {
    return (
      <Box
        sx={{
          height: "60vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !seller) {
    return (
      <Box sx={{ maxWidth: 400, mx: "auto", mt: 8, px: 2 }}>
        <Alert severity="error">{error || "Seller not found"}</Alert>
      </Box>
    );
  }

  return (
    <div className="seller-page">
      <Header
        seller={seller}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {(activeTab === "all" || activeTab === "products") && (
        <Products seller={seller} />
      )}

      {(activeTab === "all" || activeTab === "about") && (
        <About seller={seller} />
      )}

      {(activeTab === "all" || activeTab === "reviews") && (
        <Reviews seller={seller} />
      )}

      {(activeTab === "all" || activeTab === "policies") && (
        <Policies seller={seller} />
      )}

      {(activeTab === "all" || activeTab === "contact") && (
        <Contact seller={seller} />
      )}
    </div>
  );
}