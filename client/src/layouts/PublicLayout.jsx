import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import MobileNav from '../components/MobileNav';
import Footer from '../components/Footer';
import '../pages/styles/main.scss';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';
import { Helmet } from "react-helmet-async";
import axios from 'axios';

const PublicLayout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [serverChecked, setServerChecked] = useState(false);
  const location = useLocation();

  const [activeRequests, setActiveRequests] = useState(0);

  // Check if user has already made cookie choice
  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (cookieConsent) {
      setCookiesAccepted(cookieConsent === 'accepted');
      setShowCookieBanner(false);
    } else {
      setShowCookieBanner(true);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setCookiesAccepted(true);
    setShowCookieBanner(false);
  };

  const handleRejectCookies = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setCookiesAccepted(false);
    setShowCookieBanner(false);
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  };

  // Detect mobile/tablet
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(
        navigator.userAgent
      );
      const isTablet = /iPad|Android|Tablet|Silk/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 1024;
      setIsMobileDevice(isMobile || isTablet || isSmallScreen);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // ENABLE RIGHT CLICK
  useEffect(() => {
    const enableRightClick = () => {
      document.addEventListener(
        "contextmenu",
        (e) => {
          e.stopPropagation();
        },
        true
      );

      document.addEventListener(
        "keydown",
        (e) => {
          e.stopPropagation();
        },
        true
      );
    };

    enableRightClick();

    return () => {
      document.removeEventListener("contextmenu", () => {});
      document.removeEventListener("keydown", () => {});
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const scrollContainers = document.querySelectorAll(
        "html, body, #root, .public-layout, main"
      );
      scrollContainers.forEach((container) => {
        if (container && container.scrollTo) {
          container.scrollTo(0, 0);
        }
        container.scrollTop = 0;
      });
    }, 0);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      window.scrollTo(0, 0);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Axios interceptors - PC/Laptop devices এর জন্য
  useEffect(() => {
    if (!isMobileDevice) {
      const requestInterceptor = axios.interceptors.request.use((config) => {
        setActiveRequests((prev) => prev + 1);
        return config;
      });

      const responseInterceptor = axios.interceptors.response.use(
        (response) => {
          handleApiCompletion();
          return response;
        },
        (error) => {
          handleApiCompletion();
          // শুধুমাত্র network-related errors এর জন্য server error set করুন
          if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED' || !error.response) {
            setServerError(true);
          }
          return Promise.reject(error);
        }
      );

      return () => {
        axios.interceptors.request.eject(requestInterceptor);
        axios.interceptors.response.eject(responseInterceptor);
      };
    }
  }, [isMobileDevice]);

  const handleApiCompletion = () => {
    setActiveRequests((prev) => {
      const newCount = prev - 1;
      if (newCount <= 0) {
        setTimeout(() => {
          setInitialLoadComplete(true);
          setIsLoading(false);
          setContentVisible(true);
        }, 500);
      }
      return newCount < 0 ? 0 : newCount;
    });
  };

  // 🟢 IMPROVED SERVER CHECK SYSTEM
  useEffect(() => {
    const checkServer = async () => {
      try {
        // Try the health endpoint first
        await axios.get('https://api.yokebud.com/health', {
          timeout: 8000 // 8 seconds timeout
        });
        setServerError(false);
      } catch (error) {
        console.log('Health check failed, trying fallback endpoint...');
        
        // Fallback: try a basic API endpoint that should exist
        try {
          await axios.get('https://api.yokebud.com/api/products', {
            timeout: 5000 // Shorter timeout for fallback
          });
          setServerError(false);
        } catch (fallbackError) {
          console.log('Server check result:', fallbackError.response ? 'Server responded with error' : 'Server unreachable');
          // শুধুমাত্র server unreachable হলে error set করুন
          if (!fallbackError.response) {
            setServerError(true);
          } else {
            // Server responded (even with error) means server is running
            setServerError(false);
          }
        }
      } finally {
        setServerChecked(true); // 🟢 Mark server check as completed
      }
    };

    // Initial server check
    checkServer();
    
    // Regular interval check (optional - comment out if not needed)
    // const interval = setInterval(checkServer, 30000); // every 30 seconds
    // return () => clearInterval(interval);
  }, []);

  // 🔴 MOBILE LOADING ONLY - শুধুমাত্র mobile/tablet devices এর জন্য loading screen
  useEffect(() => {
    if (isMobileDevice) {
      // Mobile devices এর জন্য loading system
      setIsLoading(true);
      setContentVisible(false);
      
      const timer = setTimeout(() => {
        setIsLoading(false);
        setInitialLoadComplete(true);
        setContentVisible(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      // PC/Laptop devices এর জন্য direct content show (no loading)
      setIsLoading(false);
      setInitialLoadComplete(true);
      setContentVisible(true);
      setActiveRequests(0); // PC তে কোনো active request tracking নেই
    }
  }, [isMobileDevice]);

  // 🔴 শুধুমাত্র mobile devices এর জন্য loading show করবে
  const showLoading = isMobileDevice && (isLoading || !initialLoadComplete || activeRequests > 0);

  // 🟢 Show loading until server check is complete
  if (!serverChecked) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center" 
      }}>
        <Loading progress={100} />
      </div>
    );
  }

  return (
    <div className="public-layout" style={{ minHeight: "100vh", position: "relative" }}>
      <Helmet>
        <title>Yokebud</title>
        <meta
          name="description"
          content="Yokebud Group Oy - Leading B2B clothing manufacturer & wholesale supplier. Custom apparel production, private label clothing, bulk orders with competitive pricing and fast delivery worldwide."
        />
        <meta
          name="keywords"
          content="B2B clothing manufacturer, wholesale clothing supplier, private label apparel, custom clothing production, bulk clothing orders, sustainable clothing manufacturer, OEM clothing production"
        />
        <meta
          property="og:title"
          content="Yokebud Group Oy | Premium B2B Clothing Manufacturer & Wholesale Supplier"
        />
        <meta
          property="og:description"
          content="Leading B2B clothing manufacturer & wholesale supplier. Custom apparel production, private label clothing, bulk orders with competitive pricing."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      {/* 🟥 SERVER ERROR PAGE - শুধুমাত্র server error থাকলে এবং server check complete হলে দেখাবে */}
      {serverError ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "black",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "40px",
            zIndex: 999999999,
          }}
        >
          {/* 🟢 MOBILE RESPONSIVE FONT SIZE */}
          <h1 style={{ fontSize: isMobileDevice ? "1.5rem" : "2.5rem", marginBottom: "20px" }}>
            ⚠️ Server Unavailable
          </h1>
          <p style={{ fontSize: isMobileDevice ? "0.9rem" : "1.1rem", maxWidth: "500px", lineHeight: "1.5" }}>
            We're having trouble connecting to our server right now.
            Please check your internet connection or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "25px",
              backgroundColor: "#e74c3c",
              color: "white",
              border: "none",
              padding: isMobileDevice ? "10px 20px" : "12px 25px",
              borderRadius: "6px",
              fontSize: isMobileDevice ? "0.9rem" : "1rem",
              cursor: "pointer",
              transition: "background 0.3s ease",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#c0392b")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#e74c3c")}
          >
            Retry
          </button>
        </div>
      ) : (
        /* 🟢 NORMAL CONTENT - server error না থাকলে দেখাবে */
        <>
          {/* 🔴 শুধুমাত্র mobile devices তে loading show করবে */}
          {showLoading && <Loading progress={100} />}

          <div
            style={{
              display: contentVisible ? "block" : "none",
              minHeight: "100vh",
              position: "relative",
            }}
          >
            <Header />
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 1000,
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              }}
            >
              <Navbar />
            </div>

            {/* 🔴 শুধুমাত্র mobile devices তে MobileNav show করবে যখন loading complete হবে */}
            {!showLoading && isMobileDevice && <MobileNav />}

            <main
              style={{
                minHeight: "calc(100vh - 200px)",
                position: "relative",
              }}
            >
              <Outlet />
            </main>
            <Footer />
          </div>
        </>
      )}

      {/* COOKIE BANNER - শুধুমাত্র server error না থাকলে দেখাবে */}
      {!serverError && showCookieBanner && (
        <div
          style={{
            position: "fixed",
            bottom: "0",
            left: "0",
            right: "0",
            backgroundColor: "rgb(44 62 80 / 70%)",
            color: "white",
            padding: "20px",
            zIndex: 1000000000000000000,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              display: "flex",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "15px",
            }}
          >
            <div
              style={{
                flex: 1,
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              <strong
                style={{
                  fontSize: "16px",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                We Value Your Privacy
              </strong>
              We use cookies to enhance your browsing experience, serve
              personalized content, and analyze our traffic. By clicking
              "Accept All", you consent to our use of cookies.
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleRejectCookies}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  color: "white",
                  border: "1px solid white",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptCookies}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Accept All Cookies
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicLayout;