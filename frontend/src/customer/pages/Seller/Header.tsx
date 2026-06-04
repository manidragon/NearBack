import React, {
  useState
}
  from "react";

interface HeaderProps {
  seller: any;
  activeTab: string;
  setActiveTab: any;
}

export default function Header({

  seller,
  activeTab,
  setActiveTab

}: HeaderProps) {

  /* NEW */

  const [
    isFollowing,
    setIsFollowing
  ] =
    useState(false);



  const businessName =
    seller?.businessDetails?.businessName
    ||
    seller?.sellerName
    ||
    "Seller";


  const logo =
    seller?.businessDetails?.logo
    ||
    "/seller.png";


  const district =
    seller?.district
    ||
    "Unknown";


  const joined =
    seller?.createdAt

      ?

      new Date(
        seller.createdAt
      )

        .toLocaleDateString()

      :

      "";


  return (

    <header className="profile-header">


      {/* COVER */}

      <div className="cover-wrapper">

        <img

          src={

            seller?.businessDetails?.banner

            ||

            "/cover.png"

          }

          className="cover-image"

        />

      </div>




      {/* PROFILE */}

      <div className="profile-info-bar">


        <div className="profile-left">


          <div className="profile-avatar-wrap">

            <img

              src={logo}

              className="profile-avatar"

            />

          </div>



          <div className="profile-details">

            <h1 className="seller-name">

              {businessName}

            </h1>


            <p className="seller-email">

              {seller?.email}

            </p>


            <div className="seller-meta">

              <span>

                📍 {district}

              </span>


              <span>

                📅 Joined {joined}

              </span>


              <span>

                📞 {seller?.mobile}

              </span>

            </div>

          </div>

        </div>




        <div className="seller-actions">






          <button className="action-btn">

            💬 Message

          </button>



          <button

            className="action-btn"

            onClick={() => {

              const shareUrl =
                window.location.href;

              const message =

                `Check out ${businessName} seller profile 👇

${shareUrl}`;

              window.open(

                `https://wa.me/?text=${encodeURIComponent(
                  message
                )}`,

                "_blank"

              );

            }}

          >

            ↗ Share

          </button>


        </div>

      </div>




      <nav className="profile-nav">

        <button
          onClick={() => setActiveTab("products")}
          className={
            activeTab === "products"
              ?
              "active"
              :
              ""
          }
        >
          Products
        </button>


        <button
          onClick={() => setActiveTab("about")}
          className={
            activeTab === "about"
              ?
              "active"
              :
              ""
          }
        >
          About
        </button>


        <button
          onClick={() => setActiveTab("reviews")}
          className={
            activeTab === "reviews"
              ?
              "active"
              :
              ""
          }
        >
          Reviews
        </button>


        <button
          onClick={() => setActiveTab("policies")}
          className={
            activeTab === "policies"
              ?
              "active"
              :
              ""
          }
        >
          Policies
        </button>


        <button
          onClick={() => setActiveTab("contact")}
          className={
            activeTab === "contact"
              ?
              "active"
              :
              ""
          }
        >
          Contact
        </button>

      </nav>

    </header>

  );

}