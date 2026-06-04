import "./seller.css";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import Header from "./Header";
import Products from "./Products";
import About from "./About";
import Reviews from "./Reviews";
import Policies from "./Policies";
import Contact from "./Contact";

export default function SellerProfile() {

  const { sellerId } =
    useParams();

  const [seller, setSeller] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);


  // default show ALL sections
  // default show Products section
  const [activeTab,
    setActiveTab] =
    useState("products");


  useEffect(() => {

    if (!sellerId) {

      setLoading(false);

      return;

    }

    fetch(
      `http://localhost:8080/sellers/${sellerId}`
    )

      .then(res => res.json())

      .then(data => {

        setSeller(data);

      })

      .catch(err => {

        console.log(err);

      })

      .finally(() => {

        setLoading(false);

      });

  }, [sellerId]);


  if (loading) {

    return (

      <div>

        Loading...

      </div>

    )

  }


  if (!seller) {

    return (

      <div>

        Seller not found

      </div>

    )

  }


  return (

    <div className="seller-page">


      <Header

        seller={seller}

        activeTab={activeTab}

        setActiveTab={setActiveTab}

      />


      {(activeTab === "all" ||

        activeTab === "products")

        &&

        <Products seller={seller} />
      }



      {(activeTab === "all" ||

        activeTab === "about")

        &&

        <About seller={seller} />
      }



      {(activeTab === "all" ||

        activeTab === "reviews")

        &&

        <Reviews seller={seller} />
      }



      {(activeTab === "all" ||

        activeTab === "policies")

        &&

        <Policies seller={seller} />
      }



      {(activeTab === "all" ||

        activeTab === "contact")

        &&

        <Contact seller={seller} />
      }


    </div>

  )

}