import React, { useEffect, useState } from "react";

interface Enquiry {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: string;
}

export default function Enquiry() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnquiries();
  }, []);

  const loadEnquiries = async () => {
    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        setLoading(false);
        return;
      }

      // 1. Get logged-in seller
      const sellerRes = await fetch(
        "http://localhost:8080/sellers/profile",
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      const seller = await sellerRes.json();

      // 2. Load enquiries for that seller
      const enquiryRes = await fetch(
  `http://localhost:8080/api/enquiries/seller/${seller._id}`
);

      const enquiryData = await enquiryRes.json();

      setEnquiries(enquiryData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-5">Loading enquiries...</div>;
  }

  return (
    <div className="p-5">
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 600,
          marginBottom: "20px",
        }}
      >
        Customer Enquiries
      </h2>

      {enquiries.length === 0 ? (
        <div>No enquiries found</div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Subject</th>
              <th style={thStyle}>Message</th>
              <th style={thStyle}>Date</th>
            </tr>
          </thead>

          <tbody>
            {enquiries.map((item) => (
              <tr key={item._id}>
                <td style={tdStyle}>{item.name}</td>
                <td style={tdStyle}>{item.email}</td>
                <td style={tdStyle}>{item.subject}</td>
                <td style={tdStyle}>{item.message}</td>
                <td style={tdStyle}>
                  {new Date(
                    item.createdAt
                  ).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "12px",
  background: "#f5f5f5",
  textAlign: "left",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "12px",
};