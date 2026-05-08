// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Stock\Stock.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchSellerProducts, updateProduct } from "../../../Redux Toolkit/Seller/sellerProductSlice";
import {
  Box, Typography, Paper, Chip, TextField, Button, CircularProgress,
  Snackbar, Alert, Divider, Tooltip, Badge,
} from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import StorageIcon from "@mui/icons-material/Storage";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OfferRow {
  _id?: string;
  sellerId: string;
  mrpPrice: string;
  sellingPrice: string;
  stock: string;
  sku?: string;
  isActive: boolean;
}

interface SubVariantRow {
  _id?: string;
  variantId?: string;
  specifications: Record<string, any>;
  offers: OfferRow[];
  isActive: boolean;
}

interface ColorVariant {
  _id?: string;
  color: string;
  images: string[];
  variantOwner?: string;
  subVariants: SubVariantRow[];
  isActive: boolean;
}

interface LowStockItem {
  productTitle: string;
  color: string;
  specLabel: string;
  stock: number;
  image?: string;
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

const normalizeVariants = (product: any, sellerId: string): ColorVariant[] => {
  return (product.variants || [])
    .filter((cv: any) => {
      const ownerId =
        typeof cv.variantOwner === "string"
          ? cv.variantOwner
          : cv.variantOwner?._id || cv.variantOwner?.$oid || "";
      const isOwner = ownerId === sellerId;
      const hasOffer = (cv.offers || []).some((o: any) => {
        const sid =
          typeof o.seller === "string" ? o.seller : o.seller?._id || o.seller?.$oid || "";
        return sid === sellerId;
      });
      return isOwner || hasOffer;
    })
    .map((cv: any): ColorVariant => {
      const ownerId =
        typeof cv.variantOwner === "string"
          ? cv.variantOwner
          : cv.variantOwner?._id || cv.variantOwner?.$oid || "";

      const subVariants: SubVariantRow[] = cv.subVariants?.length
        ? cv.subVariants.map((sv: any): SubVariantRow => ({
            _id: typeof sv._id === "string" ? sv._id : sv._id?.$oid || "",
            variantId: cv._id,
            specifications: sv.specifications
              ? sv.specifications instanceof Map
                ? Object.fromEntries(sv.specifications)
                : { ...sv.specifications }
              : {},
            isActive: sv.isActive !== false,
            offers: (sv.offers || [])
              .filter((o: any) => {
                const sid =
                  typeof o.seller === "string" ? o.seller : o.seller?._id || o.seller?.$oid || "";
                return sid === sellerId;
              })
              .map(
                (o: any): OfferRow => ({
                  _id: typeof o._id === "string" ? o._id : o._id?.$oid || "",
                  sellerId,
                  mrpPrice: o.mrpPrice != null ? String(o.mrpPrice) : "",
                  sellingPrice: o.sellingPrice != null ? String(o.sellingPrice) : "",
                  stock: o.stock != null ? String(o.stock) : "0",
                  sku: o.sku || "",
                  isActive: o.isActive !== false,
                })
              ),
          }))
        : [
            {
              _id: cv._id,
              variantId: cv._id,
              specifications: cv.specifications
                ? cv.specifications instanceof Map
                  ? Object.fromEntries(cv.specifications)
                  : { ...cv.specifications }
                : {},
              isActive: cv.isActive !== false,
              offers: (cv.offers || [])
                .filter((o: any) => {
                  const sid =
                    typeof o.seller === "string" ? o.seller : o.seller?._id || o.seller?.$oid || "";
                  return sid === sellerId;
                })
                .map(
                  (o: any): OfferRow => ({
                    _id: typeof o._id === "string" ? o._id : o._id?.$oid || "",
                    sellerId,
                    mrpPrice: o.mrpPrice != null ? String(o.mrpPrice) : "",
                    sellingPrice: o.sellingPrice != null ? String(o.sellingPrice) : "",
                    stock: o.stock != null ? String(o.stock) : "0",
                    sku: o.sku || "",
                    isActive: o.isActive !== false,
                  })
                ),
            },
          ];

      return {
        _id: cv._id,
        color: cv.color || "",
        images: cv.images || [],
        variantOwner: ownerId,
        subVariants: subVariants.filter((sv) => sv.offers.length > 0),
        isActive: cv.isActive !== false,
      };
    })
    .filter((cv: ColorVariant) => cv.subVariants.length > 0);
};

// ─── Sub-component: Stock Row ─────────────────────────────────────────────────

const StockRow: React.FC<{
  subVariant: SubVariantRow;
  onChange: (stock: string) => void;
}> = ({ subVariant, onChange }) => {
  const specs = subVariant.specifications || {};
  const label = [specs.storage, specs.ram].filter(Boolean).join(" • ") || "Variant";
  const offer = subVariant.offers[0];
  const [editing, setEditing] = useState(false);
  const [localStock, setLocalStock] = useState(offer?.stock ?? "0");

  useEffect(() => {
    setLocalStock(offer?.stock ?? "0");
  }, [offer?.stock]);

  const handleSave = () => {
    onChange(localStock);
    setEditing(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2.5,
        py: 1.75,
        borderRadius: 2,
        bgcolor: "grey.50",
        border: "1px solid",
        borderColor: "grey.200",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      {/* Spec label */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 120 }}>
        <StorageIcon fontSize="small" color="primary" />
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
      </Box>

      {/* Price chips */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {offer?.sellingPrice && (
          <Chip
            label={`₹${offer.sellingPrice}`}
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        )}
        {offer?.mrpPrice && Number(offer.mrpPrice) > Number(offer.sellingPrice) && (
          <Chip
            label={`MRP ₹${offer.mrpPrice}`}
            size="small"
            variant="outlined"
            sx={{ color: "text.disabled", textDecoration: "line-through" }}
          />
        )}
      </Box>

      {/* Stock editor */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {editing ? (
          <>
            <TextField
              size="small"
              label="Stock"
              type="number"
              value={localStock}
              onChange={(e) => setLocalStock(e.target.value)}
              inputProps={{ min: 0, style: { width: 70 } }}
              sx={{ width: 110 }}
              autoFocus
            />
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={handleSave}
              startIcon={<CheckCircleIcon />}
            >
              Save
            </Button>
            <Button size="small" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              Stock:{" "}
              <strong style={{ color: Number(localStock) < 5 ? "#ef4444" : "#16a34a" }}>
                {localStock}
              </strong>
            </Typography>
            <Tooltip title="Edit stock">
              <Button
                size="small"
                variant="outlined"
                onClick={() => setEditing(true)}
                startIcon={<EditIcon />}
                sx={{ minWidth: 90 }}
              >
                Edit
              </Button>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );
};

// ─── Sub-component: Low Stock Panel ──────────────────────────────────────────

const LowStockPanel: React.FC<{ items: LowStockItem[] }> = ({ items }) => {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <Box sx={{ position: "relative" }}>
      {/* Trigger Button */}
      <Tooltip title="View low stock items">
        <Button
          variant="outlined"
          color="warning"
          size="small"
          onClick={() => setOpen((p) => !p)}
          startIcon={<WarningAmberIcon />}
          sx={{
            borderColor: "#f97316",
            color: "#f97316",
            fontWeight: 700,
            borderRadius: 2,
            px: 2,
            "&:hover": { borderColor: "#ea580c", bgcolor: "#fff7ed" },
          }}
        >
          Low Stock
          <Box
            sx={{
              ml: 1,
              bgcolor: "#ef4444",
              color: "#fff",
              borderRadius: "50%",
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {items.length}
          </Box>
        </Button>
      </Tooltip>

      {/* Dropdown Panel */}
      {open && (
        <>
          {/* Backdrop to close */}
          <Box
            sx={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <Paper
            elevation={6}
            sx={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              zIndex: 100,
              width: 340,
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid #fed7aa",
            }}
          >
            {/* Panel Header */}
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                bgcolor: "#fff7ed",
                borderBottom: "1px solid #fed7aa",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <WarningAmberIcon sx={{ color: "#f97316", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700} color="#c2410c">
                Low Stock Alert ({items.length} variant{items.length > 1 ? "s" : ""})
              </Typography>
            </Box>

            {/* Items List */}
            <Box sx={{ maxHeight: 340, overflowY: "auto" }}>
              {items.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    borderBottom: idx < items.length - 1 ? "1px solid #f3f4f6" : "none",
                    "&:hover": { bgcolor: "#fafafa" },
                  }}
                >
                  {/* Product image */}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.color}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 6,
                        objectFit: "cover",
                        flexShrink: 0,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 6,
                        bgcolor: "grey.200",
                        flexShrink: 0,
                      }}
                    />
                  )}

                  {/* Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      noWrap
                      sx={{ color: "text.primary" }}
                    >
                      {item.productTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {item.color} • {item.specLabel}
                    </Typography>
                  </Box>

                  {/* Stock badge */}
                  <Chip
                    label={`Stock: ${item.stock}`}
                    size="small"
                    sx={{
                      bgcolor: item.stock === 0 ? "#fee2e2" : "#fef3c7",
                      color: item.stock === 0 ? "#dc2626" : "#b45309",
                      fontWeight: 700,
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Stock: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, loading, error } = useAppSelector((state: any) => state.sellerProduct);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSev, setSnackSev] = useState<"success" | "error">("success");

  const [drafts, setDrafts] = useState<Record<string, ColorVariant[]>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const sellerId = useMemo(() => getCurrentSellerId(), []);

 useEffect(() => {
  if (!products || products.length === 0) {
    dispatch(fetchSellerProducts(sellerId));
  }
}, [dispatch, sellerId]);

  useEffect(() => {
    if (products?.length) {
      const d: Record<string, ColorVariant[]> = {};
      const c: Record<string, boolean> = {};
      products.forEach((p: any) => {
        d[p._id] = normalizeVariants(p, sellerId);
        c[p._id] = true;
      });
      setDrafts(d);
      setCollapsed(c);
    }
  }, [products, sellerId]);

  // ── Compute low stock items (stock <= 10) from current drafts ──
  const lowStockItems = useMemo<LowStockItem[]>(() => {
    if (!products?.length) return [];
    const items: LowStockItem[] = [];
    products.forEach((product: any) => {
      const colorVariants = drafts[product._id] || [];
      colorVariants.forEach((cv) => {
        cv.subVariants.forEach((sv) => {
          const offer = sv.offers[0];
          if (!offer) return;
          const stock = Number(offer.stock);
          if (stock <= 10) {
            const specs = sv.specifications || {};
            const specLabel =
              [specs.storage, specs.ram].filter(Boolean).join(" • ") || "Variant";
            items.push({
              productTitle: product.title,
              color: cv.color,
              specLabel,
              stock,
              image: cv.images?.[0],
            });
          }
        });
      });
    });
    // Sort: out-of-stock first, then by stock ascending
    return items.sort((a, b) => a.stock - b.stock);
  }, [drafts, products]);

  const handleStockChange = (
    productId: string,
    colorIdx: number,
    subIdx: number,
    newStock: string
  ) => {
    setDrafts((prev) => {
      const updated = prev[productId].map((cv, ci) => {
        if (ci !== colorIdx) return cv;
        return {
          ...cv,
          subVariants: cv.subVariants.map((sv, si) => {
            if (si !== subIdx) return sv;
            return {
              ...sv,
              offers: sv.offers.map((o) => ({ ...o, stock: newStock })),
            };
          }),
        };
      });
      return { ...prev, [productId]: updated };
    });
  };

  const toggleCollapse = (productId: string) => {
    setCollapsed((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleUpdate = (productId: string) => {
    const colorVariants = drafts[productId];
    if (!colorVariants) return;

    const variantsPayload = colorVariants.flatMap((cv) =>
      cv.subVariants.map((sv) => ({
        _id: sv.variantId || cv._id,
        color: cv.color,
        specifications: { ...sv.specifications },
        images: cv.images,
        offers: sv.offers
          .filter((o) => o.sellerId === sellerId)
          .map((o) => ({
            _id: o._id,
            seller: o.sellerId,
            mrpPrice: Number(o.mrpPrice) || 0,
            sellingPrice: Number(o.sellingPrice) || 0,
            stock: Number(o.stock) || 0,
            sku: o.sku?.trim() || undefined,
            isActive: o.isActive !== false,
          })),
        isActive: sv.isActive !== false,
      }))
    );

    setSaving((prev) => ({ ...prev, [productId]: true }));
    dispatch(updateProduct({ productId, product: { variants: variantsPayload } }) as any)
      .unwrap()
      .then(() => {
        setSnackMsg("✅ Stock updated successfully!");
        setSnackSev("success");
        setSnackOpen(true);
      })
      .catch((err: any) => {
        setSnackMsg(`❌ ${err?.message || "Update failed"}`);
        setSnackSev("error");
        setSnackOpen(true);
      })
      .finally(() => {
        setSaving((prev) => ({ ...prev, [productId]: false }));
      });
  };

  if (loading && (!products || products.length === 0)) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading products…</Typography>
      </Box>
    );
  }

  if (!products?.length) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography color="text.secondary">No products found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: "auto" }}>

      {/* ── Page Header: Title + Low Stock Button ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 1,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          📦 Stock Management
        </Typography>

        {/* Low Stock Panel sits here, right side of title */}
        <LowStockPanel items={lowStockItems} />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Quickly update stock quantities per color and variant.
      </Typography>

      {products.map((product: any) => {
        const colorVariants = drafts[product._id] || [];
        const isSaving = saving[product._id];
        const isCollapsed = !!collapsed[product._id];

        return (
          <Paper
            key={product._id}
            variant="outlined"
            sx={{ mb: 3, borderRadius: 3, overflow: "hidden" }}
          >
            {/* ── Product Header ── */}
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
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              {/* Arrow + Title */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover .arrow-icon": { color: "primary.dark" },
                }}
                onClick={() => toggleCollapse(product._id)}
              >
                <Box
                  className="arrow-icon"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: "primary.main",
                    transition: "transform 0.25s ease",
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

              {/* Update Button */}
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleUpdate(product._id)}
                disabled={isSaving}
                startIcon={
                  isSaving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />
                }
                sx={{ borderRadius: 2, px: 3 }}
              >
                {isSaving ? "Saving…" : "Update Stock"}
              </Button>
            </Box>

            {/* ── Color Variants (collapsible) ── */}
            {!isCollapsed && (
              <>
                {colorVariants.length === 0 ? (
                  <Box sx={{ p: 3 }}>
                    <Alert severity="info">No variants found for your seller account.</Alert>
                  </Box>
                ) : (
                  colorVariants.map((cv, colorIdx) => (
                    <Box key={colorIdx}>
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
                          {cv.color || "Unknown Color"}
                        </Typography>
                        {cv.images?.[0] && (
                          <img
                            src={cv.images[0]}
                            alt={cv.color}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              objectFit: "cover",
                              marginLeft: 4,
                            }}
                          />
                        )}
                      </Box>

                      {/* Sub-variants */}
                      <Box
                        sx={{ px: 3, py: 2, display: "flex", flexDirection: "column", gap: 1.5 }}
                      >
                        {cv.subVariants.map((sv, subIdx) => (
                          <StockRow
                            key={subIdx}
                            subVariant={sv}
                            onChange={(newStock) =>
                              handleStockChange(product._id, colorIdx, subIdx, newStock)
                            }
                          />
                        ))}
                      </Box>

                      {colorIdx < colorVariants.length - 1 && <Divider />}
                    </Box>
                  ))
                )}
              </>
            )}
          </Paper>
        );
      })}

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackSev} variant="filled" onClose={() => setSnackOpen(false)}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Stock;