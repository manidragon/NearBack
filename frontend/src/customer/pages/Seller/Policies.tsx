import React, { useState } from 'react';

export default function Policies({ seller }: any) {
  const [openIndex, setOpenIndex] = useState(0); // Open first one by default

  const togglePolicy = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title"><span className="icon">🛡</span> Store Policies</h2>
      </div>

      <div className="policies-list">
        {/* POLICY 1 */}
        <div className={`policy-card ${openIndex === 0 ? 'open' : ''} animate-in`}>
          <div className="policy-header" onClick={() => togglePolicy(0)}>
            <h3><span className="p-icon">📦</span> Shipping & Delivery Policy</h3>
            <span className="policy-toggle">▼</span>
          </div>
          <div className="policy-body">
            <p>We work tirelessly to ensure your orders reach you in the shortest possible time, packed securely to prevent any damage during transit.</p>
            <ul>
              <li><strong>Processing Time:</strong> Orders are dispatched within 24-48 hours of payment confirmation.</li>
              <li><strong>Transit Duration:</strong> Standard delivery takes 3 to 5 business days for major metro cities, and up to 7 business days for regional areas.</li>
              <li><strong>Courier Partners:</strong> We partner exclusively with reliable services such as BlueDart, Delhivery, and DHL.</li>
              <li><strong>Tracking:</strong> Real-time tracking IDs are sent via SMS and Email as soon as your package leaves our fulfillment center.</li>
            </ul>
            <div className="policy-highlight">
              💡 <strong>Free Shipping Offer:</strong> Enjoy free standard shipping on all prepaid orders exceeding ₹999.
            </div>
          </div>
        </div>

        {/* POLICY 2 */}
        <div className={`policy-card ${openIndex === 1 ? 'open' : ''} animate-in`}>
          <div className="policy-header" onClick={() => togglePolicy(1)}>
            <h3><span className="p-icon">🔄</span> Returns & Refund Policy</h3>
            <span className="policy-toggle">▼</span>
          </div>
          <div className="policy-body">
            <p>Your satisfaction is our ultimate priority. If you're not completely satisfied with your purchase, we make the return process straightforward and stress-free.</p>
            <ul>
              <li><strong>Return Window:</strong> Returns are accepted within 7 days from the date of package delivery.</li>
              <li><strong>Condition:</strong> The item must be unused, in its original packaging, and with all accessory tags, stickers, and manuals intact.</li>
              <li><strong>Reverse Pickup:</strong> We arrange free reverse pickups for eligible pin-codes within India.</li>
              <li><strong>Refund Method:</strong> Upon quality verification at our warehouse, refunds are processed back to your original payment method within 5-7 business days.</li>
            </ul>
            <div className="policy-highlight">
              ⚠️ <strong>Exclusions:</strong> Items purchased under clearance sales or custom personalized products are ineligible for return unless delivered damaged.
            </div>
          </div>
        </div>

        {/* POLICY 3 */}
        <div className={`policy-card ${openIndex === 2 ? 'open' : ''} animate-in`}>
          <div className="policy-header" onClick={() => togglePolicy(2)}>
            <h3><span className="p-icon">📜</span> Warranty & Support Terms</h3>
            <span className="policy-toggle">▼</span>
          </div>
          <div className="policy-body">
            <p>We stand fully behind the quality of the products we list. All products are sourced from authentic supply chains offering genuine manufacturer guarantees.</p>
            <ul>
              <li><strong>Warranty Duration:</strong> All active electronics and hardware products carry a 1-year brand warranty.</li>
              <li><strong>Claim Process:</strong> In case of defect or technical anomaly, contact our support line with your tax invoice details.</li>
              <li><strong>Repair or Replacement:</strong> The manufacturer will inspect, repair, or completely replace the device at no extra component charge.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
