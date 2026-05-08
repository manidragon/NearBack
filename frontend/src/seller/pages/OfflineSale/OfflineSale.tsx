// src/seller/pages/OfflineSale/OfflineSale.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchSellerProducts } from "../../../Redux Toolkit/Seller/sellerProductSlice";
import {
  Box, Typography, Paper, Chip, Button, CircularProgress,
  Divider, TextField, Snackbar, Alert, Checkbox, Avatar,
  IconButton, Tooltip, Badge,
} from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import StorageIcon from "@mui/icons-material/Storage";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import StoreIcon from "@mui/icons-material/Store";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfferRow {
  _id?: string;
  sellerId: string;
  mrpPrice: number;
  sellingPrice: number;
  stock: number;
  sku?: string;
  isActive: boolean;
}

interface FlatVariant {
  productId: string;
  productTitle: string;
  productImage: string;
  variantId: string;
  color: string;
  colorImage: string;
  specifications: Record<string, any>;
  offer: OfferRow;
}

interface CartItem extends FlatVariant {
  qty: number;
}

interface BillingInfo {
  customerName: string;
  customerPhone: string;
  discount: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getCurrentSellerId = (): string => {
  try {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) return "";
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    return payload._id || payload.userId || payload.id || payload.sellerId || "";
  } catch {
    return "";
  }
};

const flattenProducts = (products: any[], sellerId: string): FlatVariant[] => {
  const flat: FlatVariant[] = [];
  products.forEach((product) => {
    (product.variants || []).forEach((cv: any) => {
      const myOffer = (cv.offers || []).find((o: any) => {
        const sid = typeof o.seller === "string" ? o.seller : o.seller?._id || o.seller?.$oid || "";
        return sid === sellerId;
      });
      if (!myOffer) return;
      const specs = cv.specifications
        ? cv.specifications instanceof Map
          ? Object.fromEntries(cv.specifications)
          : { ...cv.specifications }
        : {};
      flat.push({
        productId: product._id,
        productTitle: product.title,
        productImage: cv.images?.[0] || "",
        variantId: cv._id?.$oid || cv._id || "",
        color: cv.color || "",
        colorImage: cv.images?.[0] || "",
        specifications: specs,
        offer: {
          _id: myOffer._id?.$oid || myOffer._id || "",
          sellerId,
          mrpPrice: Number(myOffer.mrpPrice) || 0,
          sellingPrice: Number(myOffer.sellingPrice) || 0,
          stock: Number(myOffer.stock) || 0,
          sku: myOffer.sku || "",
          isActive: myOffer.isActive !== false,
        },
      });
    });
  });
  return flat;
};

const specLabel = (specs: Record<string, any>) =>
  [specs.storage, specs.ram].filter(Boolean).join(" • ") || "Variant";

const cartKey = (v: FlatVariant) => `${v.productId}_${v.variantId}`;

// ─── Invoice Component (printable) ────────────────────────────────────────────

const Invoice: React.FC<{
  cart: CartItem[];
  billing: BillingInfo;
  sellerName: string;
  onBack: () => void;
}> = ({ cart, billing, sellerName, onBack }) => {
  const subtotal = cart.reduce((s, i) => s + i.offer.sellingPrice * i.qty, 0);
  const mrpTotal = cart.reduce((s, i) => s + i.offer.mrpPrice * i.qty, 0);
  const discount = Number(billing.discount) || 0;
  const total = Math.max(0, subtotal - discount);
  const savings = mrpTotal - subtotal;
  const invoiceNo = `INV-${Date.now().toString().slice(-8)}`;
  const invoiceDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const handlePrint = () => {
    const itemRows = cart.map((item, idx) => `
      <tr style="background:${idx % 2 === 0 ? "#fff" : "#f8fafc"}">
        <td style="text-align:center;color:#64748b;padding:10px 12px">${idx + 1}</td>
        <td style="padding:10px 12px;vertical-align:middle">
          <div style="display:flex;align-items:center;gap:10px">
            ${item.colorImage
              ? `<img src="${item.colorImage}" alt="" style="width:36px;height:36px;border-radius:6px;object-fit:cover;border:1px solid #e2e8f0;flex-shrink:0"/>`
              : ""}
            <span style="font-weight:600;font-size:13px">${item.productTitle}</span>
          </div>
        </td>
        <td style="padding:10px 12px;color:#475569;font-size:13px">${item.color} • ${specLabel(item.specifications)}</td>
        <td style="padding:10px 12px;color:#94a3b8;text-decoration:line-through;font-size:12px">₹${item.offer.mrpPrice}</td>
        <td style="padding:10px 12px;color:#0d9488;font-weight:700;font-size:13px">₹${item.offer.sellingPrice}</td>
        <td style="padding:10px 12px;text-align:center;font-weight:700;font-size:13px">${item.qty}</td>
        <td style="padding:10px 12px;font-weight:800;color:#1a1a2e;font-size:14px">₹${item.offer.sellingPrice * item.qty}</td>
      </tr>
    `).join("");

    const summaryRows = [
      { label: "Subtotal", value: `₹${subtotal}`, color: "#1a1a2e", strike: false },
      { label: "MRP Total", value: `₹${mrpTotal}`, color: "#94a3b8", strike: true },
      { label: "You Save (on MRP)", value: `₹${savings}`, color: "#16a34a", strike: false },
      ...(discount > 0 ? [{ label: "Extra Discount", value: `-₹${discount}`, color: "#16a34a", strike: false }] : []),
    ].map(row => `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #e2e8f0">
        <span style="font-size:13px;color:#475569">${row.label}</span>
        <span style="font-size:13px;font-weight:600;color:${row.color};text-decoration:${row.strike ? "line-through" : "none"}">${row.value}</span>
      </div>
    `).join("");

    const invoiceHTML = `
      <div id="print-invoice-root" style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a2e;background:#fff;position:fixed;inset:0;z-index:99999;overflow:auto;padding:32px;box-sizing:border-box">
        <div style="max-width:720px;margin:0 auto;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:24px 40px;display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.5px;line-height:1">${sellerName || "Near Look"}</div>
              <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px">Offline Sale Invoice</div>
            </div>
            <div style="text-align:right">
              <div style="color:rgba(255,255,255,0.8);font-size:12px">Invoice No.</div>
              <div style="color:#fff;font-weight:800;font-size:16px">${invoiceNo}</div>
              <div style="color:rgba(255,255,255,0.8);font-size:12px;margin-top:4px">${invoiceDate}</div>
            </div>
          </div>

          <!-- Bill To / Sold By -->
          <div style="display:flex;gap:20px;padding:20px 40px">
            <div style="flex:1;background:#f8fafc;border-radius:8px;padding:14px 16px;border:1px solid #e2e8f0">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:700;margin-bottom:6px">Bill To</div>
              <div style="font-weight:700;font-size:14px;margin-bottom:3px">👤 ${billing.customerName || "Walk-in Customer"}</div>
              ${billing.customerPhone ? `<div style="color:#475569;font-size:13px">📞 ${billing.customerPhone}</div>` : ""}
            </div>
            <div style="flex:1;background:#f8fafc;border-radius:8px;padding:14px 16px;border:1px solid #e2e8f0">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:700;margin-bottom:6px">Sold By</div>
              <div style="font-weight:700;font-size:14px">🏪 ${sellerName || "Near Look Store"}</div>
            </div>
          </div>

          <div style="border-top:1px solid #e2e8f0;margin:0 40px"></div>

          <!-- Items Table -->
          <div style="padding:16px 40px">
            <div style="font-weight:700;font-size:15px;margin-bottom:12px">Order Items</div>
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#0d9488">
                  <th style="padding:10px 12px;text-align:center;color:#fff;font-size:12px;font-weight:700;width:36px">#</th>
                  <th style="padding:10px 12px;text-align:left;color:#fff;font-size:12px;font-weight:700">Product</th>
                  <th style="padding:10px 12px;text-align:left;color:#fff;font-size:12px;font-weight:700">Variant</th>
                  <th style="padding:10px 12px;text-align:left;color:#fff;font-size:12px;font-weight:700">MRP</th>
                  <th style="padding:10px 12px;text-align:left;color:#fff;font-size:12px;font-weight:700">Price</th>
                  <th style="padding:10px 12px;text-align:center;color:#fff;font-size:12px;font-weight:700">Qty</th>
                  <th style="padding:10px 12px;text-align:left;color:#fff;font-size:12px;font-weight:700">Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
          </div>

          <!-- Summary -->
          <div style="display:flex;justify-content:flex-end;padding:0 40px 24px">
            <div style="width:280px">
              ${summaryRows}
              <div style="display:flex;justify-content:space-between;padding-top:12px;margin-top:4px;border-top:2px solid #0d9488">
                <span style="font-weight:800;font-size:17px">Grand Total</span>
                <span style="font-weight:900;font-size:20px;color:#0d9488">₹${total}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 40px;text-align:center">
            <p style="font-size:12px;color:#94a3b8">Thank you for your purchase! This is a computer-generated invoice.</p>
          </div>

        </div>
      </div>
    `;

    // ── Step 1: Hide the entire React app root ──
    const appRoot = document.getElementById("root") as HTMLElement | null;
    if (appRoot) appRoot.style.display = "none";

    // ── Step 2: Inject the invoice overlay directly on <body> ──
    const container = document.createElement("div");
    container.innerHTML = invoiceHTML;
    const overlay = container.firstElementChild as HTMLElement;
    document.body.appendChild(overlay);

    // ── Step 3: Print styles (color-accurate, no margins) ──
    const style = document.createElement("style");
    style.id = "print-invoice-style";
    style.innerHTML = `
      @media print {
        @page { margin: 0.5cm; }
        body { margin: 0; background: #fff; }
        #print-invoice-root {
          position: static !important;
          padding: 0 !important;
          overflow: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);

    // ── Step 4: Trigger print; clean up on dialog close (Print or Cancel) ──
    const cleanup = () => {
      overlay.remove();
      style.remove();
      if (appRoot) appRoot.style.display = "";   // ← restore your website
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);

    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 860, mx: "auto" }}>
      {/* Top bar */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} variant="outlined" sx={{ borderRadius: 2 }}>
          Back to Products
        </Button>
        <Button
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          variant="contained"
          color="primary"
          sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
        >
          Print Invoice
        </Button>
      </Box>

      {/* Invoice Card */}
      <Paper
        variant="outlined"
        sx={{ borderRadius: 3, overflow: "hidden", border: "1.5px solid #e2e8f0" }}
      >
        <div>
          {/* Header */}
          <Box
            sx={{
              px: { xs: 3, md: 5 },
              py: 3,
              background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: -0.5,
                  lineHeight: 1,
                }}
              >
                {sellerName || "Near Look"}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 13, mt: 0.5 }}>
                Offline Sale Invoice
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Invoice No.</Typography>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{invoiceNo}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: 12, mt: 0.5 }}>{invoiceDate}</Typography>
            </Box>
          </Box>

          {/* Customer + Store info */}
          <Box sx={{ px: { xs: 3, md: 5 }, py: 3, display: "flex", gap: 3, flexWrap: "wrap" }}>
            <Box
              sx={{
                flex: 1,
                minWidth: 200,
                bgcolor: "#f8fafc",
                borderRadius: 2,
                p: 2,
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography sx={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "#64748b", mb: 1, fontWeight: 700 }}>
                Bill To
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <PersonIcon sx={{ fontSize: 16, color: "#0d9488" }} />
                <Typography fontWeight={700}>{billing.customerName || "Walk-in Customer"}</Typography>
              </Box>
              {billing.customerPhone && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: "#0d9488" }} />
                  <Typography sx={{ color: "#475569", fontSize: 13 }}>{billing.customerPhone}</Typography>
                </Box>
              )}
            </Box>
            <Box
              sx={{
                flex: 1,
                minWidth: 200,
                bgcolor: "#f8fafc",
                borderRadius: 2,
                p: 2,
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography sx={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "#64748b", mb: 1, fontWeight: 700 }}>
                Sold By
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <StoreIcon sx={{ fontSize: 16, color: "#0d9488" }} />
                <Typography fontWeight={700}>{sellerName || "Near Look Store"}</Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mx: { xs: 3, md: 5 } }} />

          {/* Items Table */}
          <Box sx={{ px: { xs: 3, md: 5 }, py: 3 }}>
            <Typography fontWeight={700} sx={{ mb: 2, fontSize: 15 }}>Order Items</Typography>
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#0d9488" }}>
                    {["#", "Product", "Variant", "MRP", "Price", "Qty", "Total"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 12px",
                          textAlign: h === "#" ? "center" : "left",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={cartKey(item)} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          {item.colorImage && (
                            <img
                              src={item.colorImage}
                              alt={item.productTitle}
                              style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", border: "1px solid #e2e8f0" }}
                            />
                          )}
                          <Typography fontWeight={600} sx={{ fontSize: 13 }}>{item.productTitle}</Typography>
                        </Box>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <Typography sx={{ fontSize: 12, color: "#475569" }}>
                          {item.color} • {specLabel(item.specifications)}
                        </Typography>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#94a3b8", textDecoration: "line-through", fontSize: 12 }}>
                        ₹{item.offer.mrpPrice}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#0d9488", fontWeight: 700, fontSize: 13 }}>
                        ₹{item.offer.sellingPrice}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>
                        {item.qty}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 800, fontSize: 14, color: "#1a1a2e" }}>
                        ₹{item.offer.sellingPrice * item.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Box>

          {/* Summary */}
          <Box sx={{ px: { xs: 3, md: 5 }, pb: 4 }}>
            <Box sx={{ ml: "auto", maxWidth: 280 }}>
              {[
                { label: "Subtotal", value: `₹${subtotal}` },
                { label: "MRP Total", value: `₹${mrpTotal}`, muted: true },
                { label: "You Save (on MRP)", value: `₹${savings}`, green: true },
                ...(discount > 0 ? [{ label: "Extra Discount", value: `-₹${discount}`, green: true }] : []),
              ].map((row: any) => (
                <Box
                  key={row.label}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 0.75,
                    borderBottom: "1px dashed #e2e8f0",
                  }}
                >
                  <Typography sx={{ fontSize: 13, color: row.muted ? "#94a3b8" : "#475569" }}>{row.label}</Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: row.green ? "#16a34a" : row.muted ? "#94a3b8" : "#1a1a2e",
                      textDecoration: row.muted ? "line-through" : "none",
                    }}
                  >
                    {row.value}
                  </Typography>
                </Box>
              ))}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  pt: 1.5,
                  mt: 0.5,
                  borderTop: "2px solid #0d9488",
                }}
              >
                <Typography fontWeight={800} fontSize={17}>Grand Total</Typography>
                <Typography fontWeight={900} fontSize={20} color="#0d9488">₹{total}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              px: { xs: 3, md: 5 },
              py: 2,
              bgcolor: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>
              Thank you for your purchase! This is a computer-generated invoice.
            </Typography>
          </Box>
        </div>
      </Paper>
    </Box>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const OfflineSale: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, loading } = useAppSelector((state: any) => state.sellerProduct);

  const sellerId = useMemo(() => getCurrentSellerId(), []);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showInvoice, setShowInvoice] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [billing, setBilling] = useState<BillingInfo>({
    customerName: "",
    customerPhone: "",
    discount: "",
  });

  useEffect(() => {
    if (!products || products.length === 0) {
      dispatch(fetchSellerProducts(sellerId));
    }
  }, [dispatch, sellerId]);

  useEffect(() => {
    if (products?.length) {
      const c: Record<string, boolean> = {};
      products.forEach((p: any) => { c[p._id] = false; });
      setCollapsed(c);
    }
  }, [products]);

  const flatVariants = useMemo(() => flattenProducts(products || [], sellerId), [products, sellerId]);

  // Group by product
  const groupedByProduct = useMemo(() => {
    const map: Record<string, { product: any; variants: FlatVariant[] }> = {};
    flatVariants.forEach((fv) => {
      if (!map[fv.productId]) {
        const product = (products || []).find((p: any) => p._id === fv.productId);
        map[fv.productId] = { product, variants: [] };
      }
      map[fv.productId].variants.push(fv);
    });
    return Object.values(map);
  }, [flatVariants, products]);

  // Group variants by color within a product
  const groupByColor = (variants: FlatVariant[]) => {
    const map: Record<string, FlatVariant[]> = {};
    variants.forEach((v) => {
      if (!map[v.color]) map[v.color] = [];
      map[v.color].push(v);
    });
    return Object.entries(map);
  };

  const isInCart = (fv: FlatVariant) => cart.some((c) => cartKey(c) === cartKey(fv));

  const toggleCart = (fv: FlatVariant) => {
    if (fv.offer.stock === 0) {
      setSnackMsg("⚠️ This variant is out of stock");
      setSnackOpen(true);
      return;
    }
    setCart((prev) => {
      const key = cartKey(fv);
      if (prev.some((c) => cartKey(c) === key)) {
        return prev.filter((c) => cartKey(c) !== key);
      }
      return [...prev, { ...fv, qty: 1 }];
    });
  };

  const updateQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (cartKey(c) !== key) return c;
          const maxQty = c.offer.stock;
          const newQty = Math.min(maxQty, Math.max(1, c.qty + delta));
          return { ...c, qty: newQty };
        })
        .filter((c) => c.qty > 0)
    );
  };

  const removeFromCart = (key: string) => {
    setCart((prev) => prev.filter((c) => cartKey(c) !== key));
  };

  const subtotal = cart.reduce((s, i) => s + i.offer.sellingPrice * i.qty, 0);
  const discount = Number(billing.discount) || 0;
  const grandTotal = Math.max(0, subtotal - discount);

  const sellerName = products?.[0]?.sellerBusinessName || "Near Look";

  if (loading && (!products || products.length === 0)) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading products…</Typography>
      </Box>
    );
  }

  if (showInvoice) {
    return (
      <Invoice
        cart={cart}
        billing={billing}
        sellerName={sellerName}
        onBack={() => setShowInvoice(false)}
      />
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: "auto" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ReceiptLongIcon color="primary" />
            Offline Sale
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Select product variants, set quantity and generate a billing invoice.
          </Typography>
        </Box>
        <Badge badgeContent={cart.length} color="error" overlap="circular">
          <Chip
            icon={<ShoppingCartIcon />}
            label={cart.length === 0 ? "Cart is empty" : `${cart.length} variant${cart.length > 1 ? "s" : ""} selected`}
            color={cart.length > 0 ? "primary" : "default"}
            sx={{ fontWeight: 700, px: 1 }}
          />
        </Badge>
      </Box>

      <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start", flexWrap: { xs: "wrap", lg: "nowrap" } }}>

        {/* ── Left: Product List ── */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {groupedByProduct.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
              <Typography color="text.secondary">No products found for your account.</Typography>
            </Paper>
          ) : (
            groupedByProduct.map(({ product, variants }) => {
              if (!product) return null;
              const isCollapsed = !!collapsed[product._id];
              const colorGroups = groupByColor(variants);

              return (
                <Paper
                  key={product._id}
                  variant="outlined"
                  sx={{ mb: 3, borderRadius: 3, overflow: "hidden" }}
                >
                  {/* Product header */}
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      bgcolor: "primary.50",
                      borderBottom: isCollapsed ? "none" : "1px solid",
                      borderColor: "primary.100",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                    onClick={() => setCollapsed((prev) => ({ ...prev, [product._id]: !prev[product._id] }))}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          color: "primary.main",
                          display: "flex",
                          transition: "transform 0.25s",
                          transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7 10l5 5 5-5z" />
                        </svg>
                      </Box>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        {product.title}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={`₹${product.minPrice} – ₹${product.maxPrice}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip
                        label={`${variants.length} variant${variants.length !== 1 ? "s" : ""}`}
                        size="small"
                        variant="outlined"
                        sx={{ color: "text.secondary" }}
                      />
                    </Box>
                  </Box>

                  {/* Color groups */}
                  {!isCollapsed && colorGroups.map(([color, colorVariants], colorIdx) => (
                    <Box key={color}>
                      {/* Color label */}
                      <Box
                        sx={{
                          px: 3,
                          py: 1.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          bgcolor: "grey.100",
                          borderBottom: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <PaletteIcon fontSize="small" color="action" />
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                        >
                          {color}
                        </Typography>
                        {colorVariants[0]?.colorImage && (
                          <img
                            src={colorVariants[0].colorImage}
                            alt={color}
                            style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", marginLeft: 4 }}
                          />
                        )}
                      </Box>

                      {/* Variant rows */}
                      <Box sx={{ px: 3, py: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {colorVariants.map((fv) => {
                          const key = cartKey(fv);
                          const inCart = isInCart(fv);
                          const cartItem = cart.find((c) => cartKey(c) === key);
                          const outOfStock = fv.offer.stock === 0;

                          return (
                            <Box
                              key={key}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                px: 2,
                                py: 1.5,
                                borderRadius: 2,
                                bgcolor: inCart ? "primary.50" : outOfStock ? "grey.50" : "grey.50",
                                border: "1.5px solid",
                                borderColor: inCart ? "primary.300" : outOfStock ? "grey.200" : "grey.200",
                                gap: 2,
                                flexWrap: "wrap",
                                opacity: outOfStock ? 0.55 : 1,
                                transition: "all 0.2s ease",
                              }}
                            >
                              {/* Checkbox + Spec */}
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 160 }}>
                                <Checkbox
                                  checked={inCart}
                                  onChange={() => toggleCart(fv)}
                                  disabled={outOfStock}
                                  color="primary"
                                  size="small"
                                />
                                <StorageIcon fontSize="small" color={inCart ? "primary" : "action"} />
                                <Typography variant="body2" fontWeight={600}>
                                  {specLabel(fv.specifications)}
                                </Typography>
                              </Box>

                              {/* Prices */}
                              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                <Chip
                                  label={`₹${fv.offer.sellingPrice}`}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ fontWeight: 700 }}
                                />
                                {fv.offer.mrpPrice > fv.offer.sellingPrice && (
                                  <Chip
                                    label={`MRP ₹${fv.offer.mrpPrice}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ color: "text.disabled", textDecoration: "line-through" }}
                                  />
                                )}
                              </Box>

                              {/* Stock + Qty controls */}
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Typography variant="caption" color={outOfStock ? "error" : "text.secondary"}>
                                  {outOfStock ? "Out of stock" : `Stock: ${fv.offer.stock}`}
                                </Typography>

                                {inCart && cartItem && (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => updateQty(key, -1)}
                                      sx={{ border: "1px solid", borderColor: "grey.300", p: 0.25 }}
                                    >
                                      <RemoveIcon fontSize="small" />
                                    </IconButton>
                                    <Typography
                                      sx={{
                                        minWidth: 28,
                                        textAlign: "center",
                                        fontWeight: 800,
                                        fontSize: 14,
                                        color: "primary.main",
                                      }}
                                    >
                                      {cartItem.qty}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      onClick={() => updateQty(key, 1)}
                                      disabled={cartItem.qty >= fv.offer.stock}
                                      sx={{ border: "1px solid", borderColor: "grey.300", p: 0.25 }}
                                    >
                                      <AddIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>

                      {colorIdx < colorGroups.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Paper>
              );
            })
          )}
        </Box>

        {/* ── Right: Cart Summary ── */}
        <Box sx={{ width: { xs: "100%", lg: 320 }, flexShrink: 0 }}>
          <Paper
            variant="outlined"
            sx={{ borderRadius: 3, overflow: "hidden", position: "sticky", top: 20 }}
          >
            {/* Cart Header */}
            <Box
              sx={{
                px: 3,
                py: 2,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <ShoppingCartIcon sx={{ color: "#fff" }} />
              <Typography fontWeight={800} color="#fff" fontSize={16}>
                Cart Summary
              </Typography>
              {cart.length > 0 && (
                <Box
                  sx={{
                    ml: "auto",
                    bgcolor: "rgba(255,255,255,0.25)",
                    color: "#fff",
                    borderRadius: 10,
                    px: 1,
                    py: 0.25,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {cart.length} item{cart.length > 1 ? "s" : ""}
                </Box>
              )}
            </Box>

            <Box sx={{ p: 2.5 }}>
              {/* Cart items */}
              {cart.length === 0 ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <ShoppingCartIcon sx={{ fontSize: 40, color: "grey.300", mb: 1 }} />
                  <Typography color="text.secondary" fontSize={13}>
                    Select variants from the left to add to cart
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                  {cart.map((item) => {
                    const key = cartKey(item);
                    return (
                      <Box
                        key={key}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 1.25,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        {item.colorImage && (
                          <img
                            src={item.colorImage}
                            alt={item.color}
                            style={{ width: 34, height: 34, borderRadius: 6, objectFit: "cover" }}
                          />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontWeight={700} fontSize={12} noWrap>{item.productTitle}</Typography>
                          <Typography fontSize={11} color="text.secondary" noWrap>
                            {item.color} • {specLabel(item.specifications)}
                          </Typography>
                          <Typography fontSize={12} color="primary.main" fontWeight={700}>
                            ₹{item.offer.sellingPrice} × {item.qty} = ₹{item.offer.sellingPrice * item.qty}
                          </Typography>
                        </Box>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => removeFromCart(key)} sx={{ color: "error.main" }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {cart.length > 0 && (
                <>
                  <Divider sx={{ mb: 2 }} />

                  {/* Customer Info */}
                  <Typography fontWeight={700} fontSize={13} sx={{ mb: 1.5 }}>
                    Customer Details (Optional)
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
                    <TextField
                      size="small"
                      label="Customer Name"
                      value={billing.customerName}
                      onChange={(e) => setBilling((b) => ({ ...b, customerName: e.target.value }))}
                      InputProps={{ startAdornment: <PersonIcon sx={{ mr: 1, fontSize: 18, color: "grey.400" }} /> }}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="Phone Number"
                      value={billing.customerPhone}
                      onChange={(e) => setBilling((b) => ({ ...b, customerPhone: e.target.value }))}
                      InputProps={{ startAdornment: <PhoneIcon sx={{ mr: 1, fontSize: 18, color: "grey.400" }} /> }}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="Extra Discount (₹)"
                      type="number"
                      value={billing.discount}
                      onChange={(e) => setBilling((b) => ({ ...b, discount: e.target.value }))}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Totals */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 2.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography fontSize={13} color="text.secondary">Subtotal</Typography>
                      <Typography fontSize={13} fontWeight={600}>₹{subtotal}</Typography>
                    </Box>
                    {discount > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography fontSize={13} color="text.secondary">Discount</Typography>
                        <Typography fontSize={13} fontWeight={600} color="success.main">-₹{discount}</Typography>
                      </Box>
                    )}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        pt: 1,
                        borderTop: "2px solid",
                        borderColor: "primary.main",
                      }}
                    >
                      <Typography fontWeight={800} fontSize={16}>Grand Total</Typography>
                      <Typography fontWeight={900} fontSize={18} color="primary.main">₹{grandTotal}</Typography>
                    </Box>
                  </Box>

                  {/* Proceed Button */}
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    startIcon={<ReceiptLongIcon />}
                    onClick={() => setShowInvoice(true)}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 800,
                      fontSize: 15,
                      py: 1.4,
                      background: "linear-gradient(135deg, #0d9488, #0f766e)",
                      "&:hover": { background: "linear-gradient(135deg, #0f766e, #115e59)" },
                    }}
                  >
                    Proceed to Invoice
                  </Button>
                </>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="warning" variant="filled" onClose={() => setSnackOpen(false)}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OfflineSale;