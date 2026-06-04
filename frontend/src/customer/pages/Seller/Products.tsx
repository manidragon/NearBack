// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Products.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Products({ seller }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!seller?._id) return;

    fetch(`http://localhost:8080/sellers/${seller._id}/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, [seller]);

  const handleProductClick = (product: any) => {
    // Get categoryId — adjust field name if yours differs
    const categoryId =
      product.category?._id ||
      product.category ||
      product.categoryId ||
      "unknown";

    // ✅ Pass sellerId as query param so ProductDetails can filter to this seller only
    navigate(
      `/product-details/${categoryId}/${encodeURIComponent(
        product.title
      )}/${product._id}?sellerId=${seller._id}`
    );
  };

  return (
    <section className="section" id="products">
      <div className="section-header">
        <h2 className="section-title">🛍 Seller Products</h2>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="products-grid">
          {products.map((product: any) => {
            const variant = product.variants?.[0];

            // ✅ Find this specific seller's offer for the price display
            const sellerOffer = product.variants
              ?.flatMap((v: any) => v.offers || [])
              .find(
                (o: any) =>
                  String(o.seller?._id || o.seller) === String(seller._id)
              );

            const sellingPrice =
              sellerOffer?.sellingPrice ?? product.minPrice;
            const mrpPrice =
              sellerOffer?.mrpPrice ?? product.maxPrice;

            return (
              <div
                className="product-card"
                key={product._id}
                onClick={() => handleProductClick(product)}
                style={{ cursor: "pointer" }}
              >
                <div className="product-img-wrap">
                  <img
                    src={variant?.images?.[0]}
                    alt={product.title}
                  />
                </div>

                <div className="product-body">
                  <div className="product-category">
                    {product.categoryName}
                  </div>

                  <div className="product-name">{product.title}</div>

                  <div className="product-price-row">
                    <span className="product-price">
                      ₹{sellingPrice}
                    </span>

                    <span className="old-price">₹{mrpPrice}</span>

                    {/* ✅ Now shows real averageRating + totalReviews from backend */}
                    <span className="rating">
                      ★{(product.averageRating ?? 0).toFixed(1)}(
                      {product.totalReviews ?? 0})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}