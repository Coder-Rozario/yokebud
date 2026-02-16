import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// CSS to remove arrow buttons from number inputs
const styles = document.createElement("style");
const isMobile = window.innerWidth <= 768;
styles.textContent = `
  /* Remove arrows from number inputs for Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Remove arrows for Firefox */
  input[type=text ] {
    -moz-appearance: textfield;
  }
`;
document.head.appendChild(styles);
import {
  FiArrowLeft,
  FiCheckCircle,
  FiCreditCard,
  FiTruck,
  FiMapPin,
  FiLock,
  FiShoppingCart,
  FiUser,
  FiMail,
  FiPhone,
  FiHome,
  FiDownload,
  FiUpload,
  FiEdit2,
  FiGlobe,
  FiCalendar,
  FiClock,
  FiPlus,
  FiMinus,
  FiX,
  FiFile,
  FiPackage,
} from "react-icons/fi";
import { jsPDF } from "jspdf";
import { useCart } from "../pages/context/CartContext";
 
import { LoginForm } from "./Inquiry";
import logo from "../assades/LOGO.png";
import { absoluteUrl } from "../utils/api";

// Available colors for clothing
const AVAILABLE_COLORS = [
  "White",
  "Black",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Purple",
  "Orange",
  "Pink",
  "Brown",
  "Gray",
  "Navy",
  "Teal",
  "Maroon",
  "Beige",
  "Olive",
  "Khaki",
  "Coral",
  "Turquoise",
  "Lavender",
  "Mint",
  "Burgundy",
  "Charcoal",
  "Cream",
  "Sky Blue",
  "Forest Green",
  "Hot Pink",
  "Silver",
  "Gold",
  "Indigo",
  "Peach",
];

// A mapping for color name -> CSS color to ensure consistent swatches
const COLORS_MAP = {
  White: "#ffffff",
  Black: "#000000",
  Red: "#ff0000",
  Blue: "#007bff",
  Green: "#28a745",
  Yellow: "#ffd400",
  Purple: "#6f42c1",
  Orange: "#ff7f00",
  Pink: "#ff69b4",
  Brown: "#8b4513",
  Gray: "#6c757d",
  Navy: "#001f3f",
  Teal: "#20c997",
  Maroon: "#800000",
  Beige: "#f5f5dc",
  Olive: "#808000",
  Khaki: "#f0e68c",
  Coral: "#ff7f50",
  Turquoise: "#40e0d0",
  Lavender: "#e6e6fa",
  Mint: "#98ff98",
  Burgundy: "#800020",
  Charcoal: "#36454f",
  Cream: "#fffdd0",
  "Sky Blue": "#87ceeb",
  "Forest Green": "#228b22",
  "Hot Pink": "#ff69b4",
  Silver: "#c0c0c0",
  Gold: "#d4af37",
  Indigo: "#4b0082",
  Peach: "#ffcba4",
};

// Available sizes for clothing
const AVAILABLE_SIZES = {
  tshirt: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  pants: ["28", "30", "32", "34", "36", "38", "40", "42", "44"],
};

const Checkout = ({ product = {}, onBackToShop }) => {
  const {
    cartItems,
    clearCart,
    updateQuantity,
    inquiryProduct,
    clearInquiryProduct,
  } = useCart();
  const location = useLocation();
  const isInquiryCheckout = location.search.includes("source=inquiry");

  // Add ToastContainer at the top level of the component
  useEffect(() => {
    // This ensures ToastContainer is mounted only once
    return () => {
      // Cleanup if needed
    };
  }, []);

  // If we have cart items, use them instead of the single product prop
  const isCartCheckout =
    !isInquiryCheckout && cartItems && cartItems.length > 0;

  // Default product structure to ensure all required fields exist
  const defaultProduct = {
    id: null,
    product_name: "Product Name",
    price: 0,
    discounted_price: null,
    product_photos: [],
    category: "",
    subcategory: "",
    moq: 500,
    material: "",
    care_instructions: "",
    sku: "",
    shipping_info: "",
    warranty: "",
    bulk_discount: "",
    sizes: [],
    colors: [],
    tags: [],
    features: [],
  };

  // Dev-only: enable quick confirmation preview via query ?confirmPreview=1
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if (
        import.meta.env.DEV &&
        params.get("confirmPreview") === "1" &&
        !orderPlaced
      ) {
        const snapshotItems = isCartCheckout
          ? cartItems
          : [
              {
                id: mergedProduct.id || null,
                product_name: mergedProduct.product_name,
                price: parseFloat(mergedProduct.price),
                discounted_price: mergedProduct.discounted_price
                  ? parseFloat(mergedProduct.discounted_price)
                  : null,
                product_photos: mergedProduct.product_photos || [],
                quantity: customizationData.quantity,
                moq: mergedProduct.moq || 1,
              },
            ];
        setConfirmedItems(snapshotItems);
        setConfirmedTotals(totals);
        setOrderPlaced(true);
      }
    } catch {}
  }, [location.search]);

  // Merge provided product with defaults
  const inquiryProductData =
    isInquiryCheckout &&
    inquiryProduct &&
    inquiryProduct.products &&
    inquiryProduct.products.length > 0
      ? inquiryProduct.products[0]
      : {};

  // Get admin-set prices from priceData
  const getAdminPrice = () => {
    if (isInquiryCheckout && inquiryProduct && inquiryProduct.priceData) {
      const priceData = inquiryProduct.priceData;
      const productId = inquiryProductData.id;

      if (priceData[productId]) {
        return {
          price: priceData[productId].price || inquiryProductData.price || 0,
          discounted_price:
            priceData[productId].discounted_price ||
            priceData[productId].price ||
            inquiryProductData.discounted_price ||
            null,
        };
      }
    }

    return {
      price: inquiryProductData.price || 0,
      discounted_price: inquiryProductData.discounted_price || null,
    };
  };

  const adminPrices = getAdminPrice();

  const mergedProduct = isInquiryCheckout
    ? {
        ...defaultProduct,
        ...inquiryProductData,
        price: adminPrices.price,
        discounted_price: adminPrices.discounted_price,
        product_photos: Array.isArray(inquiryProductData.product_photos)
          ? inquiryProductData.product_photos
          : typeof inquiryProductData.product_photos === "string"
          ? JSON.parse(inquiryProductData.product_photos)
          : [],
      }
    : {
        ...defaultProduct,
        ...product,
        product_photos: Array.isArray(product.product_photos)
          ? product.product_photos
          : typeof product.product_photos === "string"
          ? JSON.parse(product.product_photos)
          : [],
      };

  const [step, setStep] = useState(1);
  // default to no payment method selected so neither PayPal nor Stripe is pre-selected
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const handleLoginSuccess = (user) => {
    // Pre-fill form data from logged-in user and mark user data as loaded
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.first_name || user.firstName || prev.firstName,
        lastName: user.last_name || user.lastName || prev.lastName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        company: user.company || prev.company,
        address: user.address || prev.address,
        city: user.city || prev.city,
        state: user.state || prev.state,
        zip: user.zip_code || user.zip || prev.zip,
        country: user.country || prev.country,
      }));
      setIsUserDataLoaded(true);
    }
    setShowLoginPopup(false);
  };

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    customizationNotes: "",
  });
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const [customizationFile, setCustomizationFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(null);
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [productionTime, setProductionTime] = useState("");
  const [confirmedItems, setConfirmedItems] = useState([]);
  const [confirmedTotals, setConfirmedTotals] = useState(null);
  const SESSION_KEY = "checkoutSession";
  const generateClientSessionId = () =>
    `cs_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const saveCheckoutSession = (payload) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch {}
  };
  const loadCheckoutSession = () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      const ts = obj?.timestamp || 0;
      if (!ts || Date.now() - ts > 30 * 60 * 1000) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return obj;
    } catch {
      return null;
    }
  };
  const clearCheckoutSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  };
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      const ts = obj?.timestamp || 0;
      if (!ts || Date.now() - ts > 30 * 60 * 1000) {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {}
  }, []);

  // Customization state with slots - with local storage persistence
  const [customizationData, setCustomizationData] = useState(() => {
    // Try to load from localStorage first
    const savedData = localStorage.getItem("checkoutCustomizationData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Make sure the product MOQ is respected if it changed
        if (parsedData.quantity < (mergedProduct.moq || 500)) {
          parsedData.quantity = mergedProduct.moq || 500;
        }
        // Ensure new fields exist on loaded data
        parsedData.message = parsedData.message || "";
        if (Array.isArray(parsedData.slots)) {
          parsedData.slots = parsedData.slots.map((slot) => ({
            ...slot,
            uploadedFiles: Array.isArray(slot.uploadedFiles)
              ? slot.uploadedFiles
              : [],
          }));
        }
        return parsedData;
      } catch (e) {
        console.error("Error parsing saved customization data:", e);
      }
    }

    // Default state if nothing in localStorage
    return {
      quantity: mergedProduct.moq || 500,
      slots: [
        {
          id: Date.now().toString(),
          quantity: Math.ceil((mergedProduct.moq || 500) / 4), // Default 1/4 of MOQ
          color: "",
          customColor: "",
          colorImage: null,
          sizes: {
            // Default t-shirt sizes with even distribution
            S: Math.ceil(Math.ceil((mergedProduct.moq || 500) / 4) / 4),
            M: Math.ceil(Math.ceil((mergedProduct.moq || 500) / 4) / 4),
            L: Math.ceil(Math.ceil((mergedProduct.moq || 500) / 4) / 4),
            XL: Math.ceil(Math.ceil((mergedProduct.moq || 500) / 4) / 4),
          },
          selectedSizeType: "tshirt", // Default to t-shirt sizes
          notes: "",
          uploadedFiles: [],
        },
      ],
      message: "",
      uploadedFiles: [],
    };
  });

  // Save customization data to localStorage whenever it changes
  useEffect(() => {
    // We need to create a serializable version of the data (without File objects)
    const serializableData = {
      ...customizationData,
      slots: customizationData.slots.map((slot) => ({
        ...slot,
        colorImage: slot.colorImage
          ? {
              name: slot.colorImage.name,
              type: slot.colorImage.type,
              size: slot.colorImage.size,
            }
          : null,
        uploadedFiles: Array.isArray(slot.uploadedFiles)
          ? slot.uploadedFiles.map((f) => (
              f && f.name
                ? { name: f.name, type: f.type, size: f.size, url: f.url }
                : f
            ))
          : [],
      })),
      uploadedFiles: Array.isArray(customizationData.uploadedFiles)
        ? customizationData.uploadedFiles.map((f) => (
            f && f.name ? { name: f.name, type: f.type, size: f.size, url: f.url } : f
          ))
        : [],
    };

    localStorage.setItem(
      "checkoutCustomizationData",
      JSON.stringify(serializableData)
    );
  }, [customizationData]);

  // Fetch user profile data when on step 2 (Contact Information)
  useEffect(() => {
    if (step === 2 && !isUserDataLoaded) {
      const fetchUserProfile = async () => {
        try {
          const token = localStorage.getItem("userToken");
          // If there's no token, show the login/signup popup (like Inquiry page)
          if (!token) {
            setShowLoginPopup(true);
            return; // do not attempt to fetch profile
          }
          if (!token) return; // User not logged in

          const response = await fetch("/api/user/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) return;

          const data = await response.json();

          if (data.success && data.user) {
            // Pre-fill form data with user profile data
            setFormData((prevData) => ({
              ...prevData,
              firstName: data.user.first_name || prevData.firstName,
              lastName: data.user.last_name || prevData.lastName,
              email: data.user.email || prevData.email,
              phone: data.user.phone || prevData.phone,
              company: data.user.company || prevData.company,
              address: data.user.address || prevData.address,
              city: data.user.city || prevData.city,
              state: data.user.state || prevData.state,
              zip: data.user.zip_code || prevData.zip,
              country: data.user.country || prevData.country,
            }));
            setIsUserDataLoaded(true);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      };

      fetchUserProfile();
    }
  }, [step, isUserDataLoaded]);

  // Fetch countries list from backend
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        const resp = await fetch("/api/countries");
        if (!resp.ok) {
          setCountries([]);
          return;
        }
        const data = await resp.json();
        if (data && data.success && Array.isArray(data.countries)) {
          setCountries(data.countries);
        } else {
          setCountries([]);
        }
      } catch (err) {
        console.error("Failed to fetch countries:", err);
        setCountries([]);
      } finally {
        setCountriesLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // Scroll to top whenever the checkout step changes so the new step is visible from the top
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.scrollTo) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      // ignore in environments where window isn't available
    }
  }, [step]);

  const startStripeCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      const requiredFields = ["firstName","lastName","email","phone","company","address","city","state","zip","country"];
      const missingFields = requiredFields.filter((field) => !formData[field]);
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(", ")}`);
        setLoading(false);
        return;
      }
      const snapshotItems = isCartCheckout
        ? cartItems
        : [
            {
              id: mergedProduct.id || null,
              product_name: mergedProduct.product_name,
              price: parseFloat(mergedProduct.price),
              discounted_price: mergedProduct.discounted_price
                ? parseFloat(mergedProduct.discounted_price)
                : null,
              product_photos: mergedProduct.product_photos || [],
              quantity: customizationData.quantity,
              moq: mergedProduct.moq || 1,
            },
          ];
      const orderData = {
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
          userId: (JSON.parse(localStorage.getItem("user") || "{}").id) || null,
        },
        paymentMethod: "stripe",
        items: snapshotItems,
        customizationNotes: formData.customizationNotes || "",
        customizationFile: customizationFile || null,
        customizationData: customizationData,
        totals: totals,
        estimatedDelivery: estimatedDelivery,
        productionTime: productionTime,
      };
      try {
        localStorage.setItem("checkoutAddress", JSON.stringify(formData));
        localStorage.setItem("checkoutItems", JSON.stringify(snapshotItems));
        const clientSessionId = generateClientSessionId();
        orderData.clientSessionId = clientSessionId;
        saveCheckoutSession({
          id: clientSessionId,
          timestamp: Date.now(),
          items: snapshotItems,
          product: mergedProduct,
          address: formData,
          totals,
          paymentMethod: "stripe",
        });
      } catch {}
      const response = await fetch("https://api.yokebud.com/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.message || "Failed to initialize Stripe Checkout");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Payment initialization failed");
      toast.error(err.message || "Payment initialization failed", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();
  useEffect(() => {
    try {
      const saved = localStorage.getItem("checkoutAddress");
      if (saved) {
        const addr = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...addr }));
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const success = params.get("success");
      if (success === "true" && !orderPlaced) {
        let preItems = [];
        let preTotals = null;
        const sess = loadCheckoutSession();
        if (sess && Array.isArray(sess.items) && sess.items.length) {
          preItems = sess.items;
          if (sess.totals) preTotals = sess.totals;
        } else {
          try {
            const raw = localStorage.getItem("checkoutItems");
            if (raw) {
              const arr = JSON.parse(raw);
              if (Array.isArray(arr) && arr.length) preItems = arr;
            }
          } catch {}
        }
        if (preItems.length === 0) {
          preItems = isCartCheckout
            ? cartItems
            : [
                {
                  id: mergedProduct.id || null,
                  product_name: mergedProduct.product_name,
                  price: parseFloat(mergedProduct.price),
                  discounted_price: mergedProduct.discounted_price
                    ? parseFloat(mergedProduct.discounted_price)
                    : null,
                  product_photos: mergedProduct.product_photos || [],
                  quantity: customizationData.quantity,
                  moq: mergedProduct.moq || 1,
                },
              ];
        }
        setConfirmedItems(preItems);
        setConfirmedTotals(preTotals || calculateTotal());
        setPaymentMethod("stripe");
        setOrderPlaced(true);
      }
    } catch {}
  }, [location.search]);
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get("session_id");
      const success = params.get("success");
      if (success === "true" && sessionId) {
        (async () => {
          try {
            setLoading(true);
            const resp = await fetch(`/api/checkout-session/${sessionId}`);
            const data = await resp.json();
            if (resp.ok && data.success && data.paid) {
              let itemsFromSession = [];
              const storedSession = loadCheckoutSession();
              const storedItems = Array.isArray(storedSession?.items)
                ? storedSession.items
                : [];
              const toItem = (li) => {
                const qty = li.quantity ?? li.qty ?? 1;
                const unitRaw =
                  li.unit_price ??
                  li.unitAmount ??
                  (li.price && li.price.unit_amount) ??
                  li.amount_unit ??
                  li.amount_subtotal ??
                  li.amount_total ??
                  li.price ??
                  0;
                const unitNum =
                  typeof unitRaw === "number"
                    ? unitRaw
                    : parseFloat(unitRaw) || 0;
                const unit =
                  unitNum >= 100 ? unitNum / 100 : unitNum;
                const nameFallback =
                  (inquiryProductData &&
                    (inquiryProductData.product_name ||
                      inquiryProductData.name)) ||
                  (typeof product === "object" &&
                    (product.product_name || product.name)) ||
                  (storedSession?.product?.product_name ||
                    storedSession?.product?.name) ||
                  (storedItems[0]?.product_name || storedItems[0]?.name) ||
                  "Item";
                let photoFallback = undefined;
                if (inquiryProductData) {
                  if (Array.isArray(inquiryProductData.product_photos)) {
                    photoFallback = inquiryProductData.product_photos[0];
                  } else if (
                    typeof inquiryProductData.product_photos === "string"
                  ) {
                    try {
                      const arr = JSON.parse(inquiryProductData.product_photos);
                      if (Array.isArray(arr) && arr.length) {
                        photoFallback = arr[0];
                      }
                    } catch {}
                  }
                } else if (product && Array.isArray(product.product_photos)) {
                  photoFallback = product.product_photos[0];
                } else if (
                  storedSession?.product &&
                  Array.isArray(storedSession.product.product_photos)
                ) {
                  photoFallback = storedSession.product.product_photos[0];
                } else if (
                  storedItems[0] &&
                  Array.isArray(storedItems[0].product_photos)
                ) {
                  photoFallback = storedItems[0].product_photos[0];
                }
                return {
                  name:
                    li.name ||
                    li.description ||
                    li.product_name ||
                    nameFallback,
                  quantity: qty,
                  price: unit || 0,
                  original_price:
                    (li.original_price ??
                      (li.price && li.price.unit_amount) ??
                      unit) || 0,
                  discounted_price: unit || 0,
                  product_photos:
                    li.product_photos ||
                    (Array.isArray(li.images) ? li.images : []) ||
                    (li.image ? [li.image] : []) ||
                    (photoFallback ? [photoFallback] : []),
                  moq: (inquiryProductData && inquiryProductData.moq) || undefined,
                };
              };
              if (Array.isArray(data.items)) {
                itemsFromSession = data.items.map(toItem);
              } else if (Array.isArray(data.lineItems)) {
                itemsFromSession = data.lineItems.map(toItem);
              } else if (data.session && Array.isArray(data.session.line_items)) {
                itemsFromSession = data.session.line_items.map(toItem);
              }
              const localSnapshot =
                isCartCheckout
                  ? cartItems
                  : [
                      {
                        id: (inquiryProductData && inquiryProductData.id) || null,
                        product_name:
                          (inquiryProductData &&
                            (inquiryProductData.product_name || inquiryProductData.name)) || "Item",
                        price:
                          inquiryProductData && (inquiryProductData.discounted_price || inquiryProductData.price)
                            ? parseFloat(inquiryProductData.discounted_price || inquiryProductData.price)
                            : 0,
                        discounted_price:
                          inquiryProductData && inquiryProductData.discounted_price
                          ? parseFloat(inquiryProductData.discounted_price)
                          : null,
                        product_photos:
                          (inquiryProductData &&
                            (Array.isArray(inquiryProductData.product_photos)
                              ? inquiryProductData.product_photos
                              : [])) ||
                          (Array.isArray(storedItems[0]?.product_photos)
                            ? storedItems[0].product_photos
                            : []) ||
                          [],
                        quantity:
                          (inquiryProductData && inquiryProductData.quantity) ||
                          customizationData.quantity,
                        moq: (inquiryProductData && inquiryProductData.moq) || 1,
                      },
                    ];
              const finalItemsCandidate =
                Array.isArray(itemsFromSession) && itemsFromSession.length > 0
                  ? itemsFromSession
                  : localSnapshot;
              if (Array.isArray(finalItemsCandidate) && finalItemsCandidate.length > 0) {
                setConfirmedItems(finalItemsCandidate);
              }
              const amtRaw =
                (data.total ??
                  data.amount_total ??
                  (data.session && data.session.amount_total)) || null;
              const amtNum =
                typeof amtRaw === "number"
                  ? amtRaw
                  : amtRaw != null
                  ? parseFloat(amtRaw)
                  : NaN;
              const total =
                !isNaN(amtNum) && amtNum > 0
                  ? amtNum >= 100
                    ? amtNum / 100
                    : amtNum
                  : null;
              const nextTotals = total != null ? { total: String(total.toFixed(2)) } : calculateTotal();
              if (nextTotals && nextTotals.total) {
                setConfirmedTotals(nextTotals);
              }
              setPaymentMethod("stripe");
              setOrderPlaced(true);
              if (data.orderId) {
                localStorage.setItem("lastOrderId", data.orderId);
              }
              try {
                localStorage.removeItem("checkoutItems");
                clearCheckoutSession();
              } catch {}
              toast.success("Payment successful! Order confirmed.", { theme: "dark" });
              if (isCartCheckout) {
                clearCart();
              } else if (isInquiryCheckout && inquiryProduct) {
                clearInquiryProduct();
              }
            } else {
              toast.error("Payment not completed. Please try again.", { theme: "dark" });
            }
          } catch (e) {
            toast.error("Failed to verify payment. Please contact support.", { theme: "dark" });
          } finally {
            setLoading(false);
          }
        })();
      }
    } catch (_) {}
  }, [location.search]);

  // Helper functions for slot management
  const handleAddCustomizationSlot = () => {
    // Check if all existing slots have complete size data
    const allSlotsComplete = customizationData.slots.every((slot) => {
      const hasSizes = Object.keys(slot.sizes).length > 0;
      const sizeTotal = Object.values(slot.sizes).reduce(
        (sum, qty) => sum + qty,
        0
      );
      return hasSizes && sizeTotal === slot.quantity;
    });

    if (!allSlotsComplete) {
      alert(
        "Please complete size data for all existing slots before adding a new one."
      );
      return;
    }

    if (canAddMoreSlots) {
      // Calculate default quantity as 1/4 of total remaining units
      const defaultQuantity = Math.max(
        1,
        Math.floor(getRemainingQuantity() / 4)
      );

      // Copy sizes from the first slot to maintain consistency
      const defaultSizes = {};
      if (customizationData.slots.length > 0) {
        const firstSlotSizes = customizationData.slots[0].sizes;
        // Create default size distribution based on percentage
        const totalSizeQty = Object.values(firstSlotSizes).reduce(
          (sum, qty) => sum + qty,
          0
        );

        Object.keys(firstSlotSizes).forEach((size) => {
          const percentage =
            totalSizeQty > 0
              ? firstSlotSizes[size] / totalSizeQty
              : 1 / Object.keys(firstSlotSizes).length;
          defaultSizes[size] = Math.max(
            1,
            Math.floor(defaultQuantity * percentage)
          );
        });

        // Adjust to ensure total matches defaultQuantity
        const sizeTotal = Object.values(defaultSizes).reduce(
          (sum, qty) => sum + qty,
          0
        );
        if (
          sizeTotal !== defaultQuantity &&
          Object.keys(defaultSizes).length > 0
        ) {
          const firstSize = Object.keys(defaultSizes)[0];
          defaultSizes[firstSize] += defaultQuantity - sizeTotal;
        }
      }

      const newSlot = {
        id: Date.now().toString(),
        quantity: defaultQuantity,
        color: "",
        customColor: "",
        colorImage: null,
        sizes: Object.keys(defaultSizes).length > 0 ? defaultSizes : {},
        notes: "",
      };

      setCustomizationData((prev) => ({
        ...prev,
        slots: [...prev.slots, newSlot],
      }));
    }
  };

  const handleRemoveCustomizationSlot = (slotId) => {
    setCustomizationData((prev) => ({
      ...prev,
      slots: prev.slots.filter((slot) => slot.id !== slotId),
    }));
  };

  const handleSlotQuantityChange = (slotId, newQuantity) => {
    // Ensure the new quantity doesn't exceed the remaining quantity
    const currentSlot = customizationData.slots.find(
      (slot) => slot.id === slotId
    );
    if (!currentSlot) return;

    const currentTotal = customizationData.slots.reduce(
      (sum, slot) => sum + slot.quantity,
      0
    );
    const currentSlotQuantity = currentSlot.quantity;
    const newTotal = currentTotal - currentSlotQuantity + newQuantity;

    // Check if new total exceeds the MOQ
    if (newTotal > customizationData.quantity) {
      toast.error(
        `Total quantity cannot exceed ${customizationData.quantity}`,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        }
      );
      return;
    }

    // Update the slot quantity
    const updatedSlot = { ...currentSlot, quantity: newQuantity };

    // Recalculate size distribution to match the new quantity
    const sizeKeys = Object.keys(updatedSlot.sizes);
    if (sizeKeys.length > 0) {
      const totalCurrentSizeQty = Object.values(updatedSlot.sizes).reduce(
        (sum, qty) => sum + qty,
        0
      );

      if (totalCurrentSizeQty > 0) {
        // Calculate new size quantities based on current proportions
        Object.keys(updatedSlot.sizes).forEach((size) => {
          const proportion = updatedSlot.sizes[size] / totalCurrentSizeQty;
          updatedSlot.sizes[size] = Math.max(
            1,
            Math.floor(newQuantity * proportion)
          );
        });

        // Adjust to ensure total matches exactly
        const newSizeTotal = Object.values(updatedSlot.sizes).reduce(
          (sum, qty) => sum + qty,
          0
        );
        const diff = newQuantity - newSizeTotal;

        if (diff !== 0 && sizeKeys.length > 0) {
          const firstSize = sizeKeys[0];
          updatedSlot.sizes[firstSize] = Math.max(
            1,
            updatedSlot.sizes[firstSize] + diff
          );
        }
      } else {
        // If no sizes have quantity, distribute evenly
        const perSize = Math.floor(newQuantity / sizeKeys.length);
        const remainder = newQuantity % sizeKeys.length;

        sizeKeys.forEach((size, index) => {
          updatedSlot.sizes[size] = perSize + (index === 0 ? remainder : 0);
        });
      }
    }

    setCustomizationData((prev) => ({
      ...prev,
      slots: prev.slots.map((slot) =>
        slot.id === slotId ? updatedSlot : slot
      ),
    }));

    // Removed toast notification for slot quantity updates
  };

  const handleSlotChange = (slotId, field, value) => {
    setCustomizationData((prev) => ({
      ...prev,
      slots: prev.slots.map((slot) =>
        slot.id === slotId ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const handleSlotColorImageUpload = (slotId, file) => {
    if (file) {
      setCustomizationData((prev) => ({
        ...prev,
        slots: prev.slots.map((slot) =>
          slot.id === slotId ? { ...slot, colorImage: file } : slot
        ),
      }));
    }
  };

  const handleSlotFilesUpload = (slotId, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    // Upload to backend so we get persistent URLs for admin preview
    const uploadToServer = async () => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      try {
        const response = await fetch('/api/checkout/upload-files', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        const uploaded = Array.isArray(data.files) ? data.files : [];
        // Fallback: if server fails, keep local previews
        const finalFiles = uploaded.length > 0 ? uploaded.map(f => ({...f})) : files.map((f) => {
          try {
            if (!f.previewUrl && typeof URL !== 'undefined' && URL.createObjectURL) {
              f.previewUrl = URL.createObjectURL(f);
            }
          } catch (_) {}
          return f;
        });

        setCustomizationData((prev) => ({
          ...prev,
          slots: prev.slots.map((slot) =>
            slot.id === slotId
              ? { ...slot, uploadedFiles: [...(slot.uploadedFiles || []), ...finalFiles] }
              : slot
          ),
        }));
      } catch (err) {
        // If upload fails, still attach local previews
        const fallbackFiles = files.map((f) => {
          try {
            if (!f.previewUrl && typeof URL !== 'undefined' && URL.createObjectURL) {
              f.previewUrl = URL.createObjectURL(f);
            }
          } catch (_) {}
          return f;
        });
        setCustomizationData((prev) => ({
          ...prev,
          slots: prev.slots.map((slot) =>
            slot.id === slotId
              ? { ...slot, uploadedFiles: [...(slot.uploadedFiles || []), ...fallbackFiles] }
              : slot
          ),
        }));
      }
    };
    uploadToServer();
  };

  const handleRemoveSlotFile = (slotId, index) => {
    setCustomizationData((prev) => ({
      ...prev,
      slots: prev.slots.map((slot) => {
        if (slot.id !== slotId) return slot;
        const files = slot.uploadedFiles || [];
        const toRemove = files[index];
        // Revoke preview URL to avoid memory leaks
        try {
          if (toRemove && toRemove.previewUrl && typeof URL !== "undefined" && URL.revokeObjectURL) {
            URL.revokeObjectURL(toRemove.previewUrl);
          }
        } catch (_) {}
        return {
          ...slot,
          uploadedFiles: files.filter((_, i) => i !== index),
        };
      }),
    }));
  };

  const handleAddSizeRow = (slotId) => {
    // No longer needed as we'll use checkboxes for predefined sizes
    // This function is kept for backward compatibility
  };

  const handleSizeTypeChange = (slotId, sizeType) => {
    // When changing size type, reset the sizes object with the new type's default sizes
    const slot = customizationData.slots.find((s) => s.id === slotId);
    if (!slot) return;

    const newSizes = {};
    const sizeCount = AVAILABLE_SIZES[sizeType].length;
    const perSize = Math.floor(slot.quantity / sizeCount);
    const remainder = slot.quantity % sizeCount;

    AVAILABLE_SIZES[sizeType].forEach((size, index) => {
      // Distribute quantities evenly with any remainder added to the first size
      newSizes[size] = perSize + (index === 0 ? remainder : 0);
    });

    setCustomizationData((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.id === slotId
          ? {
              ...s,
              selectedSizeType: sizeType,
              sizes: newSizes,
            }
          : s
      ),
    }));
  };

  const handleSizeCheckboxToggle = (slotId, size, checked) => {
    const slot = customizationData.slots.find((s) => s.id === slotId);
    if (!slot) return;

    const newSizes = { ...slot.sizes };

    if (checked) {
      // If checking a new size, automatically distribute quantities
      // First, calculate how much each existing size should give up
      const existingSizesCount = Object.keys(newSizes).length;
      let amountToRedistribute = 0;

      if (existingSizesCount > 0) {
        // Take some quantity from each existing size proportionally
        amountToRedistribute = Math.min(
          Math.floor(slot.quantity * 0.2), // Take up to 20% of slot quantity
          Math.floor(slot.quantity / (existingSizesCount + 1)) // Or an even share for the new size
        );

        // Reduce each existing size proportionally
        const totalExisting = Object.values(newSizes).reduce(
          (sum, qty) => sum + qty,
          0
        );
        Object.keys(newSizes).forEach((existingSize) => {
          const proportion = newSizes[existingSize] / totalExisting;
          const reduction = Math.floor(amountToRedistribute * proportion);
          newSizes[existingSize] = Math.max(
            1,
            newSizes[existingSize] - reduction
          );
        });

        // Recalculate how much we actually took
        const newTotal = Object.values(newSizes).reduce(
          (sum, qty) => sum + qty,
          0
        );
        amountToRedistribute = totalExisting - newTotal;
      } else {
        // If this is the first size, give it all the quantity
        amountToRedistribute = slot.quantity;
      }

      // Add the new size with the redistributed amount
      newSizes[size] = amountToRedistribute;
    } else {
      // If unchecking, redistribute its quantity to other sizes
      const amountToRedistribute = newSizes[size];
      delete newSizes[size];

      const remainingSizesCount = Object.keys(newSizes).length;
      if (remainingSizesCount > 0) {
        // Distribute evenly among remaining sizes
        const perSize = Math.floor(amountToRedistribute / remainingSizesCount);
        const remainder = amountToRedistribute % remainingSizesCount;

        Object.keys(newSizes).forEach((s, index) => {
          newSizes[s] += perSize + (index === 0 ? remainder : 0);
        });
      }
    }

    // Ensure the total matches the slot quantity exactly
    const totalQty = Object.values(newSizes).reduce((sum, qty) => sum + qty, 0);
    const diff = slot.quantity - totalQty;

    if (diff !== 0 && Object.keys(newSizes).length > 0) {
      // Adjust the first size to make the total match exactly
      const firstSize = Object.keys(newSizes)[0];
      newSizes[firstSize] = Math.max(1, newSizes[firstSize] + diff);
    }

    setCustomizationData((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.id === slotId ? { ...s, sizes: newSizes } : s
      ),
    }));

    // Show a toast notification
    toast.info(
      `Size ${
        checked ? "added" : "removed"
      } and quantities adjusted automatically`,
      {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      }
    );
  };

  const handleSlotSizeChange = (slotId, size, quantity) => {
    setCustomizationData((prev) => {
      const targetSlot = prev.slots.find((s) => s.id === slotId);
      if (!targetSlot) return prev;

      // Create a copy of the sizes
      const newSizes = { ...targetSlot.sizes };

      // Set the new quantity for the current size
      newSizes[size] = quantity;

      // Calculate the total of all sizes
      const totalSizeQuantity = Object.values(newSizes).reduce(
        (sum, qty) => sum + qty,
        0
      );

      // If total exceeds the slot quantity, adjust other sizes proportionally
      if (totalSizeQuantity > targetSlot.quantity) {
        const excessAmount = totalSizeQuantity - targetSlot.quantity;
        const otherSizes = Object.keys(newSizes).filter((s) => s !== size);

        if (otherSizes.length > 0) {
          // Calculate how much to reduce from each other size
          let remainingExcess = excessAmount;

          // Sort sizes by their quantities (descending) to reduce from larger quantities first
          const sortedSizes = otherSizes.sort(
            (a, b) => newSizes[b] - newSizes[a]
          );

          for (const otherSize of sortedSizes) {
            if (remainingExcess <= 0) break;

            // Calculate how much we can reduce from this size
            const maxReduction = Math.min(newSizes[otherSize], remainingExcess);
            newSizes[otherSize] -= maxReduction;
            remainingExcess -= maxReduction;
          }

          // If we still have excess and the current size is greater than the excess,
          // reduce the current size to fit within the limit
          if (remainingExcess > 0 && newSizes[size] > remainingExcess) {
            newSizes[size] -= remainingExcess;
          }
        } else {
          // If there are no other sizes, cap the current size at the slot quantity
          newSizes[size] = targetSlot.quantity;
        }
      }

      return {
        ...prev,
        slots: prev.slots.map((slot) =>
          slot.id === slotId
            ? {
                ...slot,
                sizes: newSizes,
              }
            : slot
        ),
      };
    });
  };

  const handleRemoveSlotSizeRow = (slotId, size) => {
    setCustomizationData((prev) => ({
      ...prev,
      slots: prev.slots.map((slot) => {
        const newSizes = { ...slot.sizes };
        delete newSizes[size];
        return slot.id === slotId ? { ...slot, sizes: newSizes } : slot;
      }),
    }));
  };

  // Calculate remaining quantity to allocate
  const getRemainingQuantity = () => {
    const allocated = customizationData.slots.reduce(
      (sum, slot) => sum + slot.quantity,
      0
    );
    return customizationData.quantity - allocated;
  };

  // Check if user can add more slots
  const canAddMoreSlots = getRemainingQuantity() > 0;

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Calculate estimated delivery date based on shipping method and product type
    const calculateDeliveryDate = () => {
      const today = new Date();
      let daysToAdd = 0;

      // Check if it's a customized product
      const isCustomized =
        customizationData.slots.length > 0 ||
        customizationData.message ||
        customizationData.uploadedFiles.length > 0;

      if (isCustomized) {
        // Customized products have longer production time
        const totalQuantity = customizationData.quantity;

        if (totalQuantity <= 2000) {
          daysToAdd = 15; // 15-20 business days
          setProductionTime("15-20 business days");
        } else {
          daysToAdd = 30; // 25-35 business days
          setProductionTime("25-35 business days");
        }
      } else {
        // Ready-made products
        daysToAdd = 5; // 5-7 business days
        setProductionTime("5-7 business days");
      }

      // Calculate delivery date (only business days)
      const deliveryDate = new Date(today);
      let addedDays = 0;
      while (addedDays < daysToAdd) {
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        // Skip weekends
        if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
          addedDays++;
        }
      }

      setEstimatedDelivery(deliveryDate.toLocaleDateString());
    };

    calculateDeliveryDate();
  }, [customizationData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomizationChange = (field, value) => {
    if (field === "quantity") {
      // When changing total quantity, ensure it doesn't go below MOQ
      const newQuantity = Math.max(
        mergedProduct.moq || 500,
        parseInt(value) || mergedProduct.moq || 500
      );

      setCustomizationData((prev) => {
        const updatedData = {
          ...prev,
          quantity: newQuantity,
        };

        // If total quantity is reduced, adjust slots proportionally
        if (newQuantity < prev.quantity) {
          const totalCurrentQuantity = prev.slots.reduce(
            (sum, slot) => sum + slot.quantity,
            0
          );
          const reductionRatio = newQuantity / totalCurrentQuantity;

          updatedData.slots = prev.slots.map((slot) => {
            const newSlotQuantity = Math.max(
              1,
              Math.floor(slot.quantity * reductionRatio)
            );
            const sizeKeys = Object.keys(slot.sizes);

            // Adjust sizes proportionally
            const updatedSizes = {};
            if (sizeKeys.length > 0) {
              const totalSizeQty = Object.values(slot.sizes).reduce(
                (sum, qty) => sum + qty,
                0
              );

              sizeKeys.forEach((size) => {
                const proportion = slot.sizes[size] / totalSizeQty;
                updatedSizes[size] = Math.max(
                  1,
                  Math.floor(newSlotQuantity * proportion)
                );
              });

              // Adjust to ensure total matches exactly
              const newSizeTotal = Object.values(updatedSizes).reduce(
                (sum, qty) => sum + qty,
                0
              );
              const diff = newSlotQuantity - newSizeTotal;

              if (diff !== 0 && sizeKeys.length > 0) {
                const firstSize = sizeKeys[0];
                updatedSizes[firstSize] = Math.max(
                  1,
                  updatedSizes[firstSize] + diff
                );
              }
            }

            return {
              ...slot,
              quantity: newSlotQuantity,
              sizes: updatedSizes,
            };
          });
        }

        return updatedData;
      });

      // Removed toast notification for quantity updates
    } else {
      setCustomizationData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleUploadFile = (e) => {
    const files = Array.from(e.target.files);
    setCustomizationData((prev) => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...files],
    }));
  };

  const handleRemoveUploadedFile = (index) => {
    setCustomizationData((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      // Validate customization data
      if (customizationData.quantity < mergedProduct.moq) {
        setError(`Minimum order quantity is ${mergedProduct.moq}`);
        return;
      }

      // Check if slots are allocated correctly
      if (customizationData.slots.length > 0) {
        const totalAllocated = customizationData.slots.reduce(
          (sum, slot) => sum + slot.quantity,
          0
        );
        if (totalAllocated !== customizationData.quantity) {
          setError(
            "Total allocated quantity in slots must equal the total order quantity"
          );
          return;
        }

        // Check individual slot size allocations
        for (const slot of customizationData.slots) {
          // Size section is now required - check if sizes exist
          if (Object.keys(slot.sizes).length === 0) {
            setError(
              `Please select at least one size for Slot ${
                customizationData.slots.indexOf(slot) + 1
              }`
            );
            return;
          }

          const slotSizeTotal = Object.values(slot.sizes).reduce(
            (sum, qty) => sum + qty,
            0
          );
          if (slotSizeTotal !== slot.quantity) {
            setError(
              `Size quantities in Slot ${
                customizationData.slots.indexOf(slot) + 1
              } must add up to the slot quantity (${slot.quantity})`
            );
            return;
          }
        }
      }

      // Scroll to top before changing step
      window.scrollTo({ top: 0, behavior: "smooth" });
      setStep(2);
    } else if (step === 2) {
      // Before moving to payment step, attempt to save/update user profile in DB
      const token = localStorage.getItem("userToken");
      if (token) {
        const payload = {
          first_name: formData.firstName || "",
          last_name: formData.lastName || "",
          phone: formData.phone || "",
          company: formData.company || "",
          address: formData.address || "",
          city: formData.city || "",
          state: formData.state || "",
          zip_code: formData.zip || "",
          country: formData.country || "",
        };

        try {
          setLoading(true);
          const resp = await fetch("/api/user/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          const data = await resp.json();
          if (!resp.ok || !data.success) {
            console.warn("Failed to save profile before checkout:", data);
            toast.warn(
              "Could not save profile to server. You can continue but your contact information may not be saved.",
              { theme: "dark" }
            );
          } else {
            // mark as loaded and keep local form in sync
            setIsUserDataLoaded(true);
          }
        } catch (err) {
          console.error("Error saving profile before checkout:", err);
          toast.warn(
            "Network error while saving profile. You can continue but your contact information may not be saved.",
            { theme: "dark" }
          );
        } finally {
          setLoading(false);
        }
      }

      // Redirect to Stripe checkout directly
      window.scrollTo({ top: 0, behavior: "smooth" });
      await startStripeCheckout();
    }
  };

  const validateProduct = (product) => {
    if (!product) return false;
    if (!product.product_name || typeof product.product_name !== "string")
      return false;
    if (
      product.price === undefined ||
      product.price === null ||
      isNaN(Number(product.price))
    )
      return false;
    return true;
  };

  const calculateTotal = () => {
    let subtotal = 0;

    if (isCartCheckout) {
      // Calculate from cart items
      subtotal = cartItems.reduce((sum, item) => {
        const price = item.discounted_price || item.price || 0;
        return sum + price * item.quantity;
      }, 0);
    } else {
      // Calculate from single product - use admin-set prices if available
      let price = mergedProduct.discounted_price || mergedProduct.price || 0;

      // Override with admin prices if this is an inquiry checkout
      if (isInquiryCheckout && inquiryProduct && inquiryProduct.priceData) {
        const priceData = inquiryProduct.priceData;
        const productId = inquiryProductData.id;

        if (priceData[productId]) {
          price =
            priceData[productId].discounted_price ||
            priceData[productId].price ||
            price;
        }
      }

      const quantity = customizationData.quantity;
      subtotal = price * quantity;
    }

    return {
      total: subtotal.toFixed(2),
    };
  };

  const totals = calculateTotal();

  

  const placeOrder = async (paymentId = null) => {
    try {
      // Validate form data
      const requiredFields = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "company",
        "address",
        "city",
        "state",
        "zip",
        "country",
      ];
      const missingFields = requiredFields.filter((field) => !formData[field]);

      if (missingFields.length > 0) {
        setError(
          `Please fill in all required fields: ${missingFields.join(", ")}`
        );
        return;
      }

      // Prepare serializable customization data for transport
      const serializableCustomizationData = {
        ...customizationData,
        slots: customizationData.slots.map((slot) => ({
          ...slot,
          colorImage: slot.colorImage
            ? {
                name: slot.colorImage.name,
                type: slot.colorImage.type,
                size: slot.colorImage.size,
              }
            : null,
          uploadedFiles: Array.isArray(slot.uploadedFiles)
            ? slot.uploadedFiles.map((f) =>
                f && f.name
                  ? { name: f.name, type: f.type, size: f.size, url: f.url }
                  : f
              )
            : [],
        })),
        uploadedFiles: Array.isArray(customizationData.uploadedFiles)
          ? customizationData.uploadedFiles.map((f) =>
              f && f.name ? { name: f.name, type: f.type, size: f.size, url: f.url } : f
            )
          : [],
      };

      // Prepare order data
      const orderData = {
        customerInfo: {
          ...formData,
          userId: localStorage.getItem("userId"), // Add user ID if available
        },
        paymentMethod,
        paymentId,
        items: isCartCheckout
          ? cartItems
          : [
              {
                id: mergedProduct.id || null,
                product_name: mergedProduct.product_name,
                price: parseFloat(mergedProduct.price),
                discounted_price: mergedProduct.discounted_price
                  ? parseFloat(mergedProduct.discounted_price)
                  : null,
                product_photos: mergedProduct.product_photos || [],
                quantity: customizationData.quantity,
                moq: mergedProduct.moq || 1,
              },
            ],
        customizationNotes: formData.customizationNotes,
        customizationFile: customizationFile ? customizationFile.name : null,
        customizationData: serializableCustomizationData, // Include serializable customization data
        totals: calculateTotal(),
        estimatedDelivery,
        productionTime,
      };

      console.log("Submitting order:", orderData);

      setLoading(true);
      setError(null);

      const response = await fetch("https://api.yokebud.com/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Server error response:", data);
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(
          data.message || "Order failed but no error message provided"
        );
      }

      // Snapshot items and totals for confirmation view BEFORE clearing state
      const snapshotItems = isCartCheckout
        ? cartItems
        : [
            {
              id: mergedProduct.id || null,
              product_name: mergedProduct.product_name,
              price: parseFloat(mergedProduct.price),
              discounted_price: mergedProduct.discounted_price
                ? parseFloat(mergedProduct.discounted_price)
                : null,
              product_photos: mergedProduct.product_photos || [],
              quantity: customizationData.quantity,
              moq: mergedProduct.moq || 1,
            },
          ];
      setConfirmedItems(snapshotItems);
      setConfirmedTotals(calculateTotal());

      setOrderPlaced(true);
      localStorage.setItem("lastOrderId", data.orderId);

      // Show success toast
      toast.success("Order placed successfully! Thank you for your purchase.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });

    // Clear cart if this was a cart checkout or clear inquiry product if it was an inquiry checkout
    if (isCartCheckout) {
      clearCart();
    } else if (isInquiryCheckout && inquiryProduct) {
      clearInquiryProduct();
    }

      // Clear customization data from localStorage
      localStorage.removeItem("checkoutCustomizationData");
    } catch (error) {
      console.error("Order placement error:", error);
      const errorMessage =
        error.message ||
        "Failed to place order. Please try again or contact support.";
      setError(errorMessage);

      // Show error toast
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } finally {
      setLoading(false);
    }
  };

  

  const downloadOrderPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth ? doc.internal.pageSize.getWidth() : 210;
    const formatDDMMYYYY = (input) => {
      const d = new Date(input);
      if (isNaN(d.getTime())) return "N/A";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day} / ${month} / ${year}`;
    };
    const wrap = (t, w) => doc.splitTextToSize(String(t ?? ""), w);
    const toDataURL = async (url) => {
      try {
        const res = await fetch(url, { mode: "cors" });
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        return null;
      }
    };

    // Header aligned with Manufacturing Sheet style + centered logo
 const logoDataUrl = await toDataURL(logo);
let titleY = 30;
let infoY = 44;
let lineY = 54;

if (logoDataUrl) {
  const logoW = 34;
  const logoH = 34;
  const logoX = (pageWidth - logoW) / 2;
  const logoY = 2;

  doc.addImage(logoDataUrl, "JPEG", logoX, logoY, logoW, logoH);

  // কম gap রাখার জন্য 3 এর জায়গায় 1 বা 2 ব্যবহার করো
  titleY = logoY + logoH + 1;  // ↓↓ নিচের ফাঁকা আরও কম
  infoY = titleY + 10;
  lineY = infoY + 8;
}

    // Make title slightly smaller
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Order Confirmation", 105, titleY, null, null, "center");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Order #${localStorage.getItem("lastOrderId") || "N/A"}`, 14, infoY);
    doc.text(`Date: ${formatDDMMYYYY(new Date())}`, 196, infoY, null, null, "right");
    doc.setDrawColor(255, 165, 0);
    doc.setLineWidth(0.5);
    doc.line(14, lineY, 196, lineY);

    // Two-column layout
    const leftX = 14;
    const rightX = 110;
    const sectionGap = 7;
    const lineGap = 5;
    // New: Consistent margins between major sections
    const sectionMarginTop = 12;
    const sectionMarginBottom = 12;
    const leftColWidth = rightX - leftX - 4;
    const rightColWidth = 196 - rightX - 4;
    let y = lineY + 8;

    // Left: Customer Information
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Information", leftX, y);
    y += lineGap;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(wrap(`${formData.firstName} ${formData.lastName}`.trim(), leftColWidth), leftX, y);
    y += lineGap;
    if (formData.company) {
      doc.text(wrap(formData.company, leftColWidth), leftX, y);
      y += lineGap;
    }
    doc.text(wrap(formData.email, leftColWidth), leftX, y);
    y += lineGap;
    doc.text(wrap(formData.phone, leftColWidth), leftX, y);
    y += sectionGap;

    // Left: Shipping Address
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Shipping Address", leftX, y);
    y += lineGap;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(wrap(formData.address, leftColWidth), leftX, y);
    y += lineGap;
    doc.text(wrap(`${formData.city}, ${formData.state} ${formData.zip}`, leftColWidth), leftX, y);
    y += lineGap;
    doc.text(wrap(formData.country, leftColWidth), leftX, y);

    // Right: Order Summary
    let yR = lineY + 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Order Summary", rightX, yR);
    yR += lineGap;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const paymentLabel = paymentMethod === "paypal" ? "PayPal" : paymentMethod === "stripe" ? "Stripe" : "Other";
    doc.text(wrap(`Payment Method: ${paymentLabel}`, rightColWidth), rightX, yR);
    yR += lineGap;
    const normalizedItems = Array.isArray(confirmedItems)
      ? confirmedItems.map((it) => ({
          name: it.name || it.product_name || "Item",
          quantity: it.quantity || formData?.quantity || 1,
          price: parseFloat(it.discounted_price ?? it.price ?? 0),
          originalPrice: parseFloat(it.original_price ?? it.price ?? 0),
          product_photos: it.product_photos || [],
        }))
      : [];
    const computedTotal = (() => {
      const t = confirmedTotals && confirmedTotals.total != null ? parseFloat(confirmedTotals.total) : NaN;
      if (!isNaN(t) && t > 0) return t;
      return normalizedItems.reduce((sum, it) => sum + (isNaN(it.price) ? 0 : it.price) * (it.quantity || 1), 0);
    })();
    doc.text(`Total Amount: $${Number(computedTotal || 0).toFixed(2)}`, rightX, yR);
    yR += sectionGap;

    // Divider under columns
    const yAfterColumns = Math.max(y, yR);
    doc.setDrawColor(230, 230, 230);
    doc.line(14, yAfterColumns + 4, 196, yAfterColumns + 4);
    // add breathing room after the columns divider
    

    // Items section in table layout
    let itemsY = yAfterColumns + sectionMarginTop;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Items", 14, itemsY);
    itemsY += lineGap;

    // Table header
    const tableX = 14;
    const tableWidth = 196 - tableX; // right edge
    const pageHeight = doc.internal.pageSize.getHeight ? doc.internal.pageSize.getHeight() : 297;
    const imgCellW = 36; // enlarged photo cell width
    const col = {
      imgX: tableX,
      imgW: imgCellW,
      nameX: tableX + imgCellW + 6,
      nameW: 78,
      qtyX: tableX + imgCellW + 6 + 78,
      qtyW: 20,
      unitX: tableX + imgCellW + 6 + 78 + 22,
      unitW: 30,
      totalX: tableX + imgCellW + 6 + 78 + 22 + 32,
      totalW: 32,
    };

    const renderItemsHeader = () => {
      doc.setFillColor(240, 240, 240);
      doc.rect(tableX, itemsY, tableWidth, 8, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Photo", col.imgX + 2, itemsY + 6);
      doc.text("Product", col.nameX + 2, itemsY + 6);
      doc.text("Qty", col.qtyX + 2, itemsY + 6);
      doc.text("Unit", col.unitX + 2, itemsY + 6);
      doc.text("Total", 196, itemsY + 6, null, null, "right");
      itemsY += 10;
      doc.setFont("helvetica", "normal");
    };
    renderItemsHeader();
    for (let idx = 0; idx < normalizedItems.length; idx++) {
      const it = normalizedItems[idx];
      const unit = isNaN(it.price) ? 0 : it.price;
      const total = unit * (it.quantity || 1);
      const truncateLines = (text, width, maxLines) => {
        const lines = doc.splitTextToSize(String(text), width);
        if (lines.length <= maxLines) return lines;
        const cut = lines.slice(0, maxLines);
        cut[maxLines - 1] = `${cut[maxLines - 1].replace(/\s+$/, "")}…`;
        return cut;
      };
      const nameLines = truncateLines(it.name, col.nameW, 2);
      const imgSize = 34; // enlarged image size
      const rowH = Math.max(imgSize, nameLines.length * 6 + 6);

      // page break if row would overflow
      if (itemsY + rowH > pageHeight - 24) {
        doc.addPage();
        itemsY = 20;
        renderItemsHeader();
      }

      // row box (subtle separator)
      doc.setDrawColor(230, 230, 230);
      doc.line(tableX, itemsY + rowH, 196, itemsY + rowH);

      // image
      const photo = Array.isArray(it.product_photos)
        ? it.product_photos[0]
        : typeof it.product_photos === "string"
        ? it.product_photos
        : null;
      if (photo) {
        if (typeof photo === "string") {
          if (photo.startsWith("data:image")) {
            try {
              doc.addImage(photo, "JPEG", col.imgX + 2, itemsY + 2, imgSize, imgSize);
            } catch {}
          } else {
            const abs = absoluteUrl(photo);
            const dataUrl = await toDataURL(abs);
            if (dataUrl) {
              try {
                doc.addImage(dataUrl, "JPEG", col.imgX + 2, itemsY + 2, imgSize, imgSize);
              } catch {}
            }
          }
        } else if (typeof photo === "object") {
          const url = photo.url || photo.image_url || photo.src || "";
          if (url) {
            if (url.startsWith("data:image")) {
              try {
                doc.addImage(url, "JPEG", col.imgX + 2, itemsY + 2, imgSize, imgSize);
              } catch {}
            } else {
              const abs = absoluteUrl(url);
              const dataUrl = await toDataURL(abs);
              if (dataUrl) {
                try {
                  doc.addImage(dataUrl, "JPEG", col.imgX + 2, itemsY + 2, imgSize, imgSize);
                } catch {}
              }
            }
          }
        }
      }

      // name
      doc.text(nameLines, col.nameX, itemsY + 6);

      // qty
      doc.text(String(it.quantity || 1), col.qtyX + 2, itemsY + 6);

      // unit price (with original if higher)
      let unitText = `$${Number(unit).toFixed(2)}`;
      const original = isNaN(it.originalPrice) ? null : it.originalPrice;
      if (original != null && original > unit) {
        unitText += `\nOrig: $${Number(original).toFixed(2)}`;
      }
      const unitLines = unitText.split("\n");
      doc.text(unitLines, col.unitX + 2, itemsY + 6);

      // total (right aligned)
      doc.text(`$${Number(total).toFixed(2)}`, 196, itemsY + 6, null, null, "right");

      itemsY += rowH;
    }

    // Bottom margin after Items section and divider to next section
    itemsY += sectionMarginBottom;
    doc.setDrawColor(230, 230, 230);
    doc.line(14, itemsY, 196, itemsY);
    itemsY += 4;

    // Customization Details (formatted)
    if (customizationData?.slots?.length > 0) {
      const slotLineGap = 8; // larger line gap for readability
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Customization Details", 14, itemsY);
      // add larger margin under section title before slots
      itemsY += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      customizationData.slots.forEach((slot, index) => {
        // top margin before each slot header
        itemsY += 6;
        // Slot header
        doc.text(`Slot ${index + 1}: ${slot.quantity} units`, 14, itemsY);
        itemsY += slotLineGap;

        // Color line + swatch when available
        const colorLabel = slot.color || slot.customColor;
        if (colorLabel) {
          doc.text(`Color: ${colorLabel}`, 20, itemsY);
          // Draw a small color swatch if we can resolve a color
          try {
            let r = null, g = null, b = null;
            if (slot.customColor && /^#?[0-9A-Fa-f]{6}$/.test(slot.customColor)) {
              const hex = slot.customColor.replace('#', '');
              r = parseInt(hex.substring(0, 2), 16);
              g = parseInt(hex.substring(2, 4), 16);
              b = parseInt(hex.substring(4, 6), 16);
            } else if (slot.color && COLORS_MAP[slot.color]) {
              const hex = COLORS_MAP[slot.color].replace('#', '');
              r = parseInt(hex.substring(0, 2), 16);
              g = parseInt(hex.substring(2, 4), 16);
              b = parseInt(hex.substring(4, 6), 16);
            }
            if (r !== null) {
              doc.setFillColor(r, g, b);
              // place swatch right of the color text
              doc.rect(90, itemsY - 4, 6, 6, "F");
              doc.setFillColor(255, 255, 255); // reset to default
            }
          } catch (e) {
            // silently ignore any color parsing issues
          }
          itemsY += slotLineGap;
        }

        // Sizes inline with semicolons
        if (slot.sizes && Object.keys(slot.sizes).length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("Size Breakdown:", 20, itemsY);
          doc.setFont("helvetica", "normal");
          itemsY += slotLineGap;
          const sizeLine = Object.entries(slot.sizes)
            .map(([size, qty]) => `${size}: ${qty}`)
            .join("; ");
          doc.text(sizeLine, 25, itemsY);
          itemsY += slotLineGap;
        }

        // Notes
        if (slot.notes) {
          doc.text(wrap(`Notes: ${slot.notes}`, 150), 20, itemsY);
          itemsY += slotLineGap;
        }

        // spacing after each slot (increase gap for clearer separation)
        itemsY += 10;
      });
    }

    // Final margin and divider before footer
    itemsY += sectionMarginBottom;
    doc.setDrawColor(230, 230, 230);
    doc.line(14, itemsY, 196, itemsY);

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.save(`order-confirmation-${localStorage.getItem("lastOrderId") || "receipt"}.pdf`);
  };

  if (orderPlaced) {
    return (
      <OrderConfirmation
        items={confirmedItems}
        totals={confirmedTotals || totals}
        paymentMethod={paymentMethod}
        address={formData}
        customizationNotes={formData.customizationNotes}
        customizationFile={customizationFile}
        onDownloadPDF={downloadOrderPDF}
        estimatedDelivery={estimatedDelivery}
        productionTime={productionTime}
        isCartCheckout={isCartCheckout}
        isInquiryCheckout={isInquiryCheckout}
        inquiryProductData={inquiryProductData}
        mergedProduct={mergedProduct}
        customizationData={customizationData}
      />
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div
        style={{
          minHeight: "90vh",
          paddingBottom: "5vh",
          backgroundColor: "rgba(26, 26, 26, 0.95)",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        {/* Login Popup (reuse Inquiry's LoginForm) */}
        <AnimatePresence>
          {showLoginPopup && (
            <motion.div
              style={{
                position: "fixed",
                inset: 0,
                display: "grid",
                placeItems: "center",
                background: "rgba(0,0,0,0.6)",
                zIndex: 10000,
                padding: 20,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoginForm
                onClose={() => setShowLoginPopup(false)}
                onSuccess={handleLoginSuccess}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Header */}
        <header
          style={{
            background:
              "linear-gradient(to right, rgba(26, 26, 26, 0.95), rgba(40, 40, 40, 0.95))",
            color: "white",
            padding: "16px 0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div
            style={{
              maxWidth: "100%",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={onBackToShop}
              style={{
                background: "none",
                border: "none",
                color: "#FFA500",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "small",
                paddingLeft: "10px",
                transition: "all 0.3s ease",
                ":hover": {
                  opacity: 0.8,
                },
              }}
            >
              <FiArrowLeft style={{ fontSize: "15px" }} />
              Back to Shop
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                paddingRight: "10px",
              }}
            >
              <FiLock style={{ fontSize: "10px", color: "#4CAF50" }} />
              <span style={{ fontWeight: "600", fontSize: "x-small" }}>
                Secure Checkout
              </span>
            </div>
          </div>
        </header>

        <main
          style={{
            maxWidth: isMobile ? "95%" : "100%",
            margin: "0 auto",
            padding: isMobile ? "0" : "25px 50px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Error message */}
          {error && (
            <div
              style={{
                backgroundColor: "rgba(255, 82, 82, 0.1)",
                color: "#FF5252",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid rgba(255, 82, 82, 0.3)",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {/* Progress Steps */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              position: "relative",
              margin: "0px 0",
              width: "100%",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {/* Progress line */}
            <div
              style={{
                position: "absolute",
                top: "15px",
                left: "0",
                right: "0",
                height: "2px",
                backgroundColor: "#e0e0e0",
                zIndex: 1,
              }}
            >
              {/* Active progress line */}
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  height: "100%",
                  width: `${(step - 1) * 50}%`,
                  backgroundColor: "#FFA500",
                  transition: "width 0.3s ease",
                }}
              ></div>
            </div>

            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  zIndex: 2,
                  flex: 1,
                }}
              >
                {/* Step circle */}
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: step >= stepNumber ? "#FFA500" : "#e0e0e0",
                    color: step >= stepNumber ? "white" : "black",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "600",
                    marginBottom: "8px",
                    border:
                      step > stepNumber
                        ? "none"
                        : step === stepNumber
                        ? "2px solid #FFA500"
                        : "2px solid #e0e0e0",
                    boxShadow:
                      step >= stepNumber
                        ? "0 2px 5px rgba(255, 165, 0, 0.3)"
                        : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  {step > stepNumber ? <FiCheckCircle size={20} /> : stepNumber}
                </div>

                {/* Step label */}
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: step >= stepNumber ? "#1a1a1a" : "#9e9e9e",
                    textAlign: "center",
                    padding: "0 5px",
                  }}
                >
                  {stepNumber === 1
                    ? "Customization"
                    : stepNumber === 2
                    ? "Information"
                    : "Payment"}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: windowWidth < 768 ? "column-reverse" : "row",
              gap: "30px",
              // maxWidth: "1200px",
              margin: "0 auto",
              alignItems: "flex-start",
            }}
          >
            {/* Left Column - Form */}
            <div
              style={{
                flex: 1,
                width: "100%",
                borderRadius: "8px",
                backgroundColor: "rgba(26, 26, 26, 0.95)",
                boxShadow: "0 2px 15px rgba(0,0,0,0.08)",
              }}
            >
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                  style={{
                    // maxWidth: 980,
                    margin: "0 auto",
                    // padding: 20,
                    borderRadius: 12,
                    padding: isMobile ? 0 : 10,
                    background:
                      "linear-gradient(180deg, rgba(20,20,20,0.6) 0%, rgba(12,12,12,0.8) 100%)",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                    border: "1px solid rgba(255,165,0,0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      marginBottom: 18,
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          margin: 0,
                          letterSpacing: 0.2,
                          background: "linear-gradient(90deg,#FFD07A,#FF8C00)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          display: "inline-block",
                        }}
                      >
                        Product Customization
                      </h2>
                      <p
                        style={{
                          margin: "6px 0 0 0",
                          color: "#bdbdbd",
                          fontSize: 13,
                        }}
                      >
                        Customize your order — allocate sizes & colors for each
                        slot. Minimum order:{" "}
                        <strong style={{ color: "#FFD07A" }}>
                          {mergedProduct.moq || 500}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    aria-label="Product customization form"
                  >
                    {/* ======= Slots List ======= */}
                    <section style={{ marginBottom: 18 }}>
                      {customizationData.slots.length === 0 ? (
                        <div
                          style={{
                            padding: 26,
                            borderRadius: 10,
                            border: "1px dashed rgba(255,255,255,0.04)",
                            textAlign: "center",
                            color: "#bdbdbd",
                            background: "rgba(255,255,255,0.01)",
                          }}
                        >
                          <FiPackage
                            style={{
                              fontSize: 40,
                              color: "#9e9e9e",
                              marginBottom: 10,
                            }}
                          />
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: "#e0e0e0",
                            }}
                          >
                            No customization slots yet
                          </div>
                          <div style={{ marginTop: 8, fontSize: 13 }}>
                            Click "Add Slot" to start splitting your order.
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                          }}
                        >
                          {customizationData.slots.map((slot, index) => (
                            <div
                              key={slot.id}
                              style={{
                                padding: 16,
                                borderRadius: 10,
                                background:
                                  "linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.14))",
                                border: "1px solid rgba(255,165,0,0.04)",
                              }}
                            >
                              {/* slot header */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontSize: 15,
                                      fontWeight: 800,
                                      color: "#FFD07A",
                                    }}
                                  >
                                    Slot {index + 1} —{" "}
                                    <span style={{ color: "white" }}>
                                      {slot.quantity} units
                                    </span>
                                  </div>
                                  <div
                                    style={{ fontSize: 12, color: "#bdbdbd" }}
                                  >
                                    {slot.notes
                                      ? `${slot.notes.slice(0, 60)}${
                                          slot.notes.length > 60 ? "…" : ""
                                        }`
                                      : "No notes"}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                  }}
                                >
                                  {customizationData.slots.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveCustomizationSlot(slot.id)
                                      }
                                      aria-label={`Remove slot ${index + 1}`}
                                      style={{
                                        background: "none",
                                        border:
                                          "1px solid rgba(255,255,255,0.04)",
                                        borderRadius: 8,
                                        padding: 8,
                                        cursor: "pointer",
                                        color: "#FF6B6B",
                                      }}
                                    >
                                      <FiX />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* slot body */}
                              <div
                                style={{
                                  marginTop: 14,
                                  display: "grid",
                                  gridTemplateColumns: isMobile
                                    ? "1fr"
                                    : "1fr 1fr",
                                  gap: 12,
                                }}
                              >
                                {/* Quantity controls */}
                                <div>
                                  <label
                                    style={{
                                      display: "block",
                                      marginBottom: 8,
                                      color: "#FFD07A",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Quantity for this slot *
                                  </label>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      alignItems: "center",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSlotQuantityChange(
                                          slot.id,
                                          Math.max(1, slot.quantity - 1)
                                        )
                                      }
                                      disabled={
                                        slot.quantity <= 1 ||
                                        getRemainingQuantity() <= 0
                                      }
                                      style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 8,
                                        border:
                                          "1px solid rgba(255,255,255,0.04)",
                                        background: "transparent",
                                        cursor:
                                          slot.quantity <= 1 ||
                                          getRemainingQuantity() <= 0
                                            ? "not-allowed"
                                            : "pointer",
                                      }}
                                    >
                                      <FiMinus />
                                    </button>

                                    <input
                                      type="number"
                                      value={slot.quantity}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        handleSlotQuantityChange(
                                          slot.id,
                                          val === ""
                                            ? ""
                                            : Math.max(1, parseInt(val))
                                        );
                                      }}
                                      onBlur={(e) => {
                                        // Input blank thakle default 1 kore dibo
                                        if (e.target.value === "") {
                                          handleSlotQuantityChange(slot.id, 1);
                                        }
                                      }}
                                      min="1"
                                      max={customizationData.quantity}
                                      style={{
                                        width: 96,
                                        padding: "10px",
                                        borderRadius: 8,
                                        border:
                                          "1px solid rgba(255,255,255,0.04)",
                                        background: "#0b0b0b",
                                        color: "white",
                                        textAlign: "center",
                                        fontWeight: 700,
                                      }}
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSlotQuantityChange(
                                          slot.id,
                                          slot.quantity + 1
                                        )
                                      }
                                      disabled={getRemainingQuantity() <= 0}
                                      style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 8,
                                        border:
                                          "1px solid rgba(255,255,255,0.04)",
                                        background: "transparent",
                                        cursor:
                                          getRemainingQuantity() <= 0
                                            ? "not-allowed"
                                            : "pointer",
                                      }}
                                    >
                                      <FiPlus />
                                    </button>
                                  </div>

                                  <div
                                    style={{
                                      marginTop: 8,
                                      fontSize: 12,
                                      color: "#bdbdbd",
                                    }}
                                  >
                                    Remaining to allocate:{" "}
                                    <strong>{getRemainingQuantity()}</strong>
                                  </div>
                                </div>

                                {/* Color & image */}
                                <div>
                                  <label
                                    style={{
                                      display: "block",
                                      marginBottom: 8,
                                      color: "#FFD07A",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Color selection
                                  </label>

                                  <div
                                    style={{
                                      position: "relative",
                                      marginBottom: 8,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      aria-haspopup="listbox"
                                      aria-expanded={
                                        colorDropdownOpen === slot.id
                                      }
                                      onClick={() =>
                                        setColorDropdownOpen(
                                          colorDropdownOpen === slot.id
                                            ? null
                                            : slot.id
                                        )
                                      }
                                      style={{
                                        width: "100%",
                                        padding: 10,
                                        borderRadius: 8,
                                        border:
                                          "1px solid rgba(255,255,255,0.04)",
                                        background: "#0b0b0b",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 8,
                                        cursor: "pointer",
                                      }}
                                    >
                                      <div
                                        style={{
                                          color:
                                            slot.color || slot.customColor
                                              ? "white"
                                              : "#bdbdbd",
                                          textAlign: "left",
                                          flex: 1,
                                        }}
                                      >
                                        {slot.color ||
                                          slot.customColor ||
                                          "Select a color"}
                                      </div>
                                      <div
                                        aria-hidden
                                        title={
                                          slot.color ||
                                          slot.customColor ||
                                          "No color selected"
                                        }
                                        style={{
                                          width: 18,
                                          height: 18,
                                          borderRadius: 3,
                                          border:
                                            "1px solid rgba(255,255,255,0.12)",
                                          backgroundColor:
                                            (slot.color &&
                                              COLORS_MAP[slot.color]) ||
                                            (slot.color &&
                                              slot.color.toLowerCase()) ||
                                            slot.customColor ||
                                            "transparent",
                                          boxShadow:
                                            "inset 0 0 0 1px rgba(0,0,0,0.15)",
                                        }}
                                      />
                                    </button>

                                    {colorDropdownOpen === slot.id && (
                                      <div
                                        role="listbox"
                                        tabIndex={-1}
                                        style={{
                                          position: "absolute",
                                          top: "calc(100% + 8px)",
                                          left: 0,
                                          right: 0,
                                          background: "#0b0b0b",
                                          border:
                                            "1px solid rgba(255,255,255,0.06)",
                                          borderRadius: 8,
                                          zIndex: 9999,
                                          maxHeight: 240,
                                          overflow: "auto",
                                          boxShadow:
                                            "0 8px 30px rgba(0,0,0,0.6)",
                                        }}
                                      >
                                        {AVAILABLE_COLORS.map((c) => (
                                          <div
                                            key={c}
                                            role="option"
                                            tabIndex={0}
                                            onClick={() => {
                                              handleSlotChange(
                                                slot.id,
                                                "color",
                                                c
                                              );
                                              setColorDropdownOpen(null);
                                            }}
                                            onKeyDown={(e) => {
                                              if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                              ) {
                                                handleSlotChange(
                                                  slot.id,
                                                  "color",
                                                  c
                                                );
                                                setColorDropdownOpen(null);
                                              }
                                            }}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 8,
                                              padding: "10px",
                                              cursor: "pointer",
                                              borderBottom:
                                                "1px solid rgba(255,255,255,0.02)",
                                            }}
                                          >
                                            <div
                                              style={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: 3,
                                                border:
                                                  "1px solid rgba(0,0,0,0.2)",
                                                backgroundColor:
                                                  COLORS_MAP[c] ||
                                                  c.toLowerCase(),
                                              }}
                                            />
                                            <div style={{ color: "white" }}>
                                              {c}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Removed color image upload section as requested */}
                                </div>

                                {/* Size breakdown (full width row) */}
                                <div
                                  style={{ gridColumn: "1 / -1", marginTop: 8 }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginBottom: 8,
                                    }}
                                  >
                                    <label
                                      style={{
                                        fontSize: 14,
                                        color: "#FFD07A",
                                        fontWeight: 800,
                                      }}
                                    >
                                      Size breakdown (required)
                                    </label>
                                  </div>

                                  <div
                                    style={{
                                      marginBottom: 12,
                                      fontSize: 13,
                                      color: "#bdbdbd",
                                    }}
                                  >
                                    Select sizes and allocate quantities. Total
                                    must equal slot quantity ({slot.quantity}).
                                  </div>

                                  {/* Size checkboxes - Combined T-shirt and Pants sizes */}
                                  <div
                                    style={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 12,
                                      marginBottom: 16,
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "100%",
                                        marginBottom: 10,
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: 13,
                                          color: "#FFD07A",
                                          fontWeight: 700,
                                          marginBottom: 6,
                                        }}
                                      >
                                        T-Shirt Sizes
                                      </div>
                                      <div
                                        style={{
                                          display: "flex",
                                          flexWrap: "wrap",
                                          gap: 12,
                                        }}
                                      >
                                        {AVAILABLE_SIZES["tshirt"].map(
                                          (size) => (
                                            <label
                                              key={size}
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                padding: "6px 10px",
                                                borderRadius: 6,
                                                background: Object.keys(
                                                  slot.sizes
                                                ).includes(size)
                                                  ? "rgba(255,165,0,0.1)"
                                                  : "transparent",
                                                border: `1px solid ${
                                                  Object.keys(
                                                    slot.sizes
                                                  ).includes(size)
                                                    ? "rgba(255,165,0,0.3)"
                                                    : "rgba(255,255,255,0.04)"
                                                }`,
                                                cursor: "pointer",
                                              }}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={Object.keys(
                                                  slot.sizes
                                                ).includes(size)}
                                                onChange={(e) =>
                                                  handleSizeCheckboxToggle(
                                                    slot.id,
                                                    size,
                                                    e.target.checked
                                                  )
                                                }
                                                style={{ marginRight: 4 }}
                                              />
                                              <span
                                                style={{
                                                  fontSize: 13,
                                                  fontWeight: Object.keys(
                                                    slot.sizes
                                                  ).includes(size)
                                                    ? 700
                                                    : 400,
                                                  color: Object.keys(
                                                    slot.sizes
                                                  ).includes(size)
                                                    ? "#FFD07A"
                                                    : "#bdbdbd",
                                                }}
                                              >
                                                {size}
                                              </span>
                                            </label>
                                          )
                                        )}
                                      </div>
                                    </div>

                                    <div
                                      style={{
                                        width: "100%",
                                        marginBottom: 10,
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: 13,
                                          color: "#FFD07A",
                                          fontWeight: 700,
                                          marginBottom: 6,
                                        }}
                                      >
                                        Pants Sizes
                                      </div>
                                      <div
                                        style={{
                                          display: "flex",
                                          flexWrap: "wrap",
                                          gap: 8,
                                        }}
                                      >
                                        {AVAILABLE_SIZES["pants"].map(
                                          (size) => (
                                            <label
                                              key={size}
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                padding: "6px 10px",
                                                borderRadius: 6,
                                                background: Object.keys(
                                                  slot.sizes
                                                ).includes(size)
                                                  ? "rgba(255,165,0,0.1)"
                                                  : "transparent",
                                                border: `1px solid ${
                                                  Object.keys(
                                                    slot.sizes
                                                  ).includes(size)
                                                    ? "rgba(255,165,0,0.3)"
                                                    : "rgba(255,255,255,0.04)"
                                                }`,
                                                cursor: "pointer",
                                              }}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={Object.keys(
                                                  slot.sizes
                                                ).includes(size)}
                                                onChange={(e) =>
                                                  handleSizeCheckboxToggle(
                                                    slot.id,
                                                    size,
                                                    e.target.checked
                                                  )
                                                }
                                                style={{ marginRight: 4 }}
                                              />
                                              <span
                                                style={{
                                                  fontSize: 13,
                                                  fontWeight: Object.keys(
                                                    slot.sizes
                                                  ).includes(size)
                                                    ? 700
                                                    : 400,
                                                  color: Object.keys(
                                                    slot.sizes
                                                  ).includes(size)
                                                    ? "#FFD07A"
                                                    : "#bdbdbd",
                                                }}
                                              >
                                                {size}
                                              </span>
                                            </label>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {Object.keys(slot.sizes).length === 0 ? (
                                    <div
                                      style={{
                                        fontSize: 13,
                                        color: "#FF6B6B",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      Please select at least one size to
                                      continue.
                                    </div>
                                  ) : (
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                      }}
                                    >
                                      {Object.entries(slot.sizes).map(
                                        ([size, qty]) => (
                                          <div
                                            key={size}
                                            style={{
                                              display: "flex",
                                              gap: 8,
                                              alignItems: "center",
                                            }}
                                          >
                                            <div
                                              style={{
                                                width: 72,
                                                fontSize: 13,
                                                color: "#FFD07A",
                                              }}
                                            >
                                              {size}:
                                            </div>
                                            <input
                                              type="text"
                                              value={qty}
                                              onChange={(e) => {
                                                // Remove leading zeros and convert to number
                                                const inputValue =
                                                  e.target.value.replace(
                                                    /^0+/,
                                                    ""
                                                  );
                                                handleSlotSizeChange(
                                                  slot.id,
                                                  size,
                                                  inputValue === ""
                                                    ? 0
                                                    : parseInt(inputValue)
                                                );
                                              }}
                                              min="0"
                                              max={slot.quantity}
                                              style={{
                                                width: 120,
                                                padding: 8,
                                                borderRadius: 8,
                                                border:
                                                  "1px solid rgba(255,255,255,0.04)",
                                                background: "#0b0b0b",
                                                color: "white",
                                                textAlign: "center",
                                              }}
                                            />
                                            <div
                                              style={{
                                                color: "#bdbdbd",
                                                fontSize: 13,
                                              }}
                                            >
                                              / {slot.quantity}
                                            </div>
                                            <div
                                              style={{
                                                fontSize: 12,
                                                color: "#bdbdbd",
                                                marginLeft: 8,
                                              }}
                                            >
                                              {Math.round(
                                                (qty / slot.quantity) * 100
                                              )}
                                              % of slot
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRemoveSlotSizeRow(
                                                  slot.id,
                                                  size
                                                )
                                              }
                                              style={{
                                                marginLeft: "auto",
                                                background: "none",
                                                border: "none",
                                                color: "#FF6B6B",
                                                cursor: "pointer",
                                              }}
                                            >
                                              <FiX />
                                            </button>
                                          </div>
                                        )
                                      )}

                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          paddingTop: 15,
                                          borderTop:
                                            "1px solid rgba(255,255,255,0.03)",
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontWeight: 800,
                                            color: "white",
                                          }}
                                        >
                                          Slot Total:
                                        </div>
                                        <div
                                          style={{
                                            fontWeight: 800,
                                            color: "white",
                                          }}
                                        >
                                          {Object.values(slot.sizes).reduce(
                                            (sum, q) => sum + q,
                                            0
                                          )}{" "}
                                          / {slot.quantity}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Notes (full width) */}
                                <div
                                  style={{
                                    gridColumn: "1 / -1",
                                    marginTop: 10,
                                  }}
                                >
                                  <label
                                    style={{
                                      display: "block",
                                      marginBottom: 8,
                                      color: "#FFD07A",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Slot notes (optional)
                                  </label>
                                  <textarea
                                    value={slot.notes}
                                    onChange={(e) =>
                                      handleSlotChange(
                                        slot.id,
                                        "notes",
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g. stitching, print position, tag text, or special packaging notes..."
                                    style={{
                                      width: "100%",
                                      minHeight: 72,
                                      padding: 12,
                                      borderRadius: 8,
                                      border:
                                        "1px solid rgba(255,255,255,0.04)",
                                      background: "#0b0b0b",
                                      color: "white",
                                      resize: "vertical",
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Add Slot button at bottom right */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  // alignItems: "flex-start",
                                  flexWrap: "wrap",
                                  gap: 20,
                                  marginTop: 16,
                                }}
                              >
                                {/* Upload Section */}
                                <div
                                  style={{
                                    flex: windowWidth < 768 ? "1 1 100%" : 1,
                                    minWidth: 280,
                                    maxWidth: 500,
                                  }}
                                >
                                  <label
                                    style={{
                                      display: "block",
                                      marginBottom: 8,
                                      color: "#FFD07A",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Upload design files (optional)
                                  </label>

                                  <div
                                    style={{
                                      position: "relative",
                                      borderRadius: 10,
                                      padding: 18,
                                      border:
                                        "1px dashed rgba(255,255,255,0.04)",
                                      background: "rgba(255,255,255,0.01)",
                                      textAlign: "center",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => {
                                      const e = document.getElementById(
                                        `slot-upload-${slot.id}`
                                      );
                                      if (e) e.click();
                                    }}
                                  >
                                    <input
                                      id={`slot-upload-${slot.id}`}
                                      type="file"
                                      onChange={(e) =>
                                        handleSlotFilesUpload(slot.id, e)
                                      }
                                      multiple
                                      accept=".pdf,.jpg,.jpeg,.png,.ai,.eps,.psd,.doc,.docx,.xls,.xlsx"
                                      style={{ display: "none" }}
                                    />
                                    <FiUpload
                                      style={{
                                        fontSize: 22,
                                        color: "#FFD07A",
                                        marginBottom: 8,
                                      }}
                                    />
                                    <div
                                      style={{
                                        color: "#e0e0e0",
                                        fontWeight: 700,
                                      }}
                                    >
                                      Click or drop files to upload
                                    </div>
                                    <div
                                      style={{
                                        color: "#bdbdbd",
                                        fontSize: 12,
                                        marginTop: 6,
                                      }}
                                    >
                                      Max 10MB per file • PDF / AI / PSD / PNG /
                                      JPG / XLS
                                    </div>
                                  </div>

                                  {(slot.uploadedFiles || []).length > 0 && (
                                    <div
                                      style={{
                                        marginTop: 12,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                      }}
                                    >
                                      {slot.uploadedFiles.map(
                                        (file, idx) => (
                                          <div
                                            key={idx}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "space-between",
                                              padding: "8px 10px",
                                              borderRadius: 8,
                                              background:
                                                "rgba(255,255,255,0.02)",
                                              border:
                                                "1px solid rgba(255,255,255,0.02)",
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: "flex",
                                                gap: 10,
                                                alignItems: "center",
                                              }}
                                            >
                                              {(() => {
                                                const isImage =
                                                  (file.type && file.type.startsWith("image/")) ||
                                                  /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name || "");
                                                const isPdf =
                                                  (file.type === "application/pdf") || /\.pdf$/i.test(file.name || "");
                                                const href = file.url || file.previewUrl || "";
                                                if (isImage && href) {
                                                  return (
                                                    <img
                                                      src={href}
                                                      alt={file.name}
                                                      style={{
                                                        width: 64,
                                                        height: 64,
                                                        objectFit: "cover",
                                                        borderRadius: 8,
                                                        border: "1px solid rgba(255,255,255,0.06)",
                                                      }}
                                                    />
                                                  );
                                                }
                                                return (
                                                  <>
                                                    <FiFile style={{ color: "#FFD07A" }} />
                                                    <a
                                                      href={href}
                                                      download={file.name}
                                                      style={{
                                                        color: "#FFD07A",
                                                        textDecoration: "none",
                                                        fontSize: 13,
                                                      }}
                                                    >
                                                      {isPdf ? "Download PDF" : "Download"}
                                                    </a>
                                                  </>
                                                );
                                              })()}
                                              <div
                                                style={{
                                                  color: "white",
                                                  fontSize: 13,
                                                }}
                                              >
                                                {file.name}
                                              </div>
                                            </div>
                                            <div
                                              style={{
                                                display: "flex",
                                                gap: 8,
                                                alignItems: "center",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  fontSize: 12,
                                                  color: "#bdbdbd",
                                                }}
                                              >
                                                {(
                                                  file.size /
                                                  1024 /
                                                  1024
                                                ).toFixed(2)}{" "}
                                                MB
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleRemoveSlotFile(
                                                    slot.id,
                                                    idx
                                                  )
                                                }
                                                style={{
                                                  background: "none",
                                                  border: "none",
                                                  color: "#FF6B6B",
                                                  cursor: "pointer",
                                                }}
                                                aria-label={`Remove file ${file.name}`}
                                              >
                                                <FiX />
                                              </button>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Add Slot Button */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-end",
                                    justifyContent: "flex-end",
                                    flex:
                                      windowWidth < 768
                                        ? "1 1 100%"
                                        : "0 0 auto",
                                    width:
                                      windowWidth < 768 ? "100%" : undefined,
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={handleAddCustomizationSlot}
                                    disabled={!canAddMoreSlots}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 8,
                                      padding: "10px 16px",
                                      borderRadius: 10,
                                      border: "none",
                                      cursor: canAddMoreSlots
                                        ? "pointer"
                                        : "not-allowed",
                                      background: canAddMoreSlots
                                        ? "linear-gradient(90deg,#FFD07A,#FF8C00)"
                                        : "linear-gradient(90deg,#444,#666)",
                                      color: "#0b0b0b",
                                      fontWeight: 800,
                                      fontSize: 13,
                                      height: 42,
                                    }}
                                  >
                                    <FiPlus /> Add Slot
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ======= Uploads & Global Notes ======= */}
                      <section style={{ marginBottom: 20 }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 260 }}>
                            <label
                              style={{
                                display: "block",
                                marginBottom: 8,
                                color: "#FFD07A",
                                fontWeight: 700,
                              }}
                            >
                              Additional notes (optional)
                            </label>
                            <textarea
                              value={customizationData.message}
                              onChange={(e) =>
                                handleCustomizationChange(
                                  "message",
                                  e.target.value
                                )
                              }
                              placeholder="Any general instructions for the entire order..."
                              style={{
                                width: "100%",
                                minHeight: 140,
                                padding: 12,
                                borderRadius: 10,
                                border: "1px solid rgba(255,255,255,0.04)",
                                background: "#0b0b0b",
                                color: "white",
                                resize: "vertical",
                              }}
                            />
                          </div>
                        </div>
                      </section>
                    </section>

                    {/* ======= Submit ======= */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                      }}
                    >
                      <motion.button
                        type="submit"
                        disabled={getRemainingQuantity() !== 0}
                        style={{
                          padding: "12px 22px",
                          borderRadius: 10,
                          border: "none",
                          fontWeight: 800,
                          fontSize: 15,
                          cursor:
                            getRemainingQuantity() === 0
                              ? "pointer"
                              : "not-allowed",
                          background:
                            getRemainingQuantity() === 0
                              ? "linear-gradient(90deg,#FFD07A,#FF8C00)"
                              : "linear-gradient(90deg,#444,#666)",
                          color:
                            getRemainingQuantity() === 0 ? "#0b0b0b" : "#ddd",
                          boxShadow:
                            getRemainingQuantity() === 0
                              ? "0 8px 28px rgba(255,140,0,0.16)"
                              : "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                        whileHover={
                          getRemainingQuantity() === 0 ? { scale: 1.02 } : {}
                        }
                      >
                        Continue to Information
                        <FiArrowLeft style={{ transform: "rotate(180deg)" }} />
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Steps 2 and 3 remain the same as in your original code */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      marginBottom: "20px",
                      background: "linear-gradient(to right, #FFA500, #FFD700)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      display: "inline-block",
                    }}
                  >
                    Contact Information
                  </h2>

                  <form onSubmit={handleSubmit}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          windowWidth < 768 ? "1fr" : "1fr 1fr",
                        gap: "20px",
                        marginBottom: "20px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#FFA500",
                          }}
                        >
                          First Name *
                        </label>
                        <div
                          style={{
                            position: "relative",
                          }}
                        >
                          <FiUser
                            style={{
                              position: "absolute",
                              left: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#9e9e9e",
                            }}
                          />
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            style={{
                              width: "100%",
                              padding: "12px 12px 12px 40px",
                              border: "1px solid #e0e0e0",
                              borderRadius: "4px",
                              fontSize: "16px",
                              color: "white",
                              transition: "all 0.3s ease",
                              backgroundColor: "black",
                              ":focus": {
                                borderColor: "#FFA500",
                                boxShadow: "0 0 0 2px rgba(255, 165, 0, 0.2)",
                                outline: "none",
                              },
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#FFA500",
                          }}
                        >
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          style={{
                            color: "white",
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            fontSize: "16px",
                            transition: "all 0.3s ease",
                            backgroundColor: "black",
                            ":focus": {
                              borderColor: "#FFA500",
                              boxShadow: "0 0 0 2px rgba(255, 165, 0, 0.2)",
                              outline: "none",
                            },
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#FFA500",
                        }}
                      >
                        Company Name
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        style={{
                          color: "white",
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                          fontSize: "16px",
                          transition: "all 0.3s ease",
                          backgroundColor: "black",
                          ":focus": {
                            borderColor: "#FFA500",
                            boxShadow: "0 0 0 2px rgba(255, 165, 0, 0.2)",
                            outline: "none",
                          },
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#FFA500",
                        }}
                      >
                        Email *
                      </label>
                      <div
                        style={{
                          position: "relative",
                        }}
                      >
                        <FiMail
                          style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#9e9e9e",
                          }}
                        />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          style={{
                            width: "100%",
                            padding: "12px 12px 12px 40px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            color: "white",
                            fontSize: "16px",
                            transition: "all 0.3s ease",
                            backgroundColor: "black",
                            ":focus": {
                              borderColor: "#FFA500",
                              boxShadow: "0 0 0 2px rgba(255, 165, 0, 0.2)",
                              outline: "none",
                            },
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#FFA500",
                        }}
                      >
                        Phone *
                      </label>
                      <div
                        style={{
                          position: "relative",
                        }}
                      >
                        <FiPhone
                          style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#9e9e9e",
                          }}
                        />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          style={{
                            width: "100%",
                            padding: "12px 12px 12px 40px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            fontSize: "16px",
                            color: "white",
                            transition: "all 0.3s ease",
                            backgroundColor: "black",
                            ":focus": {
                              borderColor: "#FFA500",
                              boxShadow: "0 0 0 2px rgba(255, 165, 0, 0.2)",
                              outline: "none",
                            },
                          }}
                        />
                      </div>
                    </div>

                    <h2
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        margin: "30px 0 20px 0",
                        background:
                          "linear-gradient(to right, #FFA500, #FFD700)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        display: "inline-block",
                      }}
                    >
                      Shipping Address
                    </h2>

                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#FFA500",
                        }}
                      >
                        Address *
                      </label>
                      <div
                        style={{
                          position: "relative",
                        }}
                      >
                        <FiHome
                          style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#9e9e9e",
                          }}
                        />
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          required
                          style={{
                            color: "white",
                            width: "100%",
                            padding: "12px 12px 12px 40px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            fontSize: "16px",
                            transition: "all 0.3s ease",
                            backgroundColor: "black",
                            ":focus": {
                              borderColor: "#FFA500",
                              boxShadow: "0 0 0 2px rgba(255, 165, 0, 0.2)",
                              outline: "none",
                            },
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          windowWidth < 768 ? "1fr" : "1fr 1fr",
                        gap: "20px",
                        marginBottom: "20px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#FFA500",
                          }}
                        >
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          style={{
                            color: "white",
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            fontSize: "16px",
                            transition: "all 0.3s ease",
                            backgroundColor: "black",
                            ":focus": {
                              borderColor: "#FFA500",
                              boxShadow: "0 0 0 2px rgba(255, 165, 0, 0.2)",
                              outline: "none",
                            },
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#FFA500",
                          }}
                        >
                          State/Province *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          required
                          style={{
                            width: "100%",
                            color: "white",
                            padding: "12px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            fontSize: "16px",
                            transition: "all 0.3s ease",
                            backgroundColor: "black",
                            ":focus": {
                              borderColor: "#FFA500",
                              boxShadow: "0 0 0 2px rgba(255, 165, 0, 0.2)",
                              outline: "none",
                            },
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          windowWidth < 768 ? "1fr" : "1fr 1fr",
                        gap: "20px",
                        marginBottom: "20px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#FFA500",
                          }}
                        >
                          ZIP/Postal Code *
                        </label>
                        <input
                          type="text"
                          name="zip"
                          value={formData.zip}
                          onChange={handleChange}
                          required
                          style={{
                            width: "100%",
                            color: "white",
                            padding: "12px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            fontSize: "16px",
                            transition: "all 0.3s ease",
                            backgroundColor: "black",
                            ":focus": {
                              borderColor: "#FFA500",
                              boxShadow: "0 0 0 2px rgba(255, 165, 0, 0.2)",
                              outline: "none",
                            },
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#FFA500",
                          }}
                        >
                          Country *
                        </label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          required
                          style={{
                            width: "100%",
                            color: "white",
                            padding: "12px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            fontSize: "16px",
                            transition: "all 0.3s ease",
                            backgroundColor: "black",
                            ":focus": {
                              borderColor: "#FFA500",
                              boxShadow: "0 0 0 2px rgba(255, 165, 0, 0.2)",
                              outline: "none",
                            },
                          }}
                        >
                          <option value="">🌍 Select Country</option>
                          {(countries && countries.length > 0
                            ? countries
                            : [
                                { code: "AF", name: "Afghanistan" },
                                { code: "AL", name: "Albania" },
                                { code: "DZ", name: "Algeria" },
                                { code: "AD", name: "Andorra" },
                                { code: "AO", name: "Angola" },
                                { code: "AR", name: "Argentina" },
                                { code: "AM", name: "Armenia" },
                                { code: "AU", name: "Australia" },
                                { code: "AT", name: "Austria" },
                                { code: "AZ", name: "Azerbaijan" },
                                { code: "BS", name: "Bahamas" },
                                { code: "BH", name: "Bahrain" },
                                { code: "BD", name: "Bangladesh" },
                                { code: "BB", name: "Barbados" },
                                { code: "BY", name: "Belarus" },
                                { code: "BE", name: "Belgium" },
                                { code: "BZ", name: "Belize" },
                                { code: "BJ", name: "Benin" },
                                { code: "BT", name: "Bhutan" },
                                { code: "BO", name: "Bolivia" },
                                { code: "BA", name: "Bosnia and Herzegovina" },
                                { code: "BW", name: "Botswana" },
                                { code: "BR", name: "Brazil" },
                                { code: "BN", name: "Brunei Darussalam" },
                                { code: "BG", name: "Bulgaria" },
                                { code: "BF", name: "Burkina Faso" },
                                { code: "BI", name: "Burundi" },
                                { code: "KH", name: "Cambodia" },
                                { code: "CM", name: "Cameroon" },
                                { code: "CA", name: "Canada" },
                                { code: "CV", name: "Cape Verde" },
                                {
                                  code: "CF",
                                  name: "Central African Republic",
                                },
                                { code: "TD", name: "Chad" },
                                { code: "CL", name: "Chile" },
                                { code: "CN", name: "China" },
                                { code: "CO", name: "Colombia" },
                                { code: "KM", name: "Comoros" },
                                { code: "CG", name: "Congo" },
                                { code: "CR", name: "Costa Rica" },
                                { code: "HR", name: "Croatia" },
                                { code: "CU", name: "Cuba" },
                                { code: "CY", name: "Cyprus" },
                                { code: "CZ", name: "Czech Republic" },
                                { code: "DK", name: "Denmark" },
                                { code: "DJ", name: "Djibouti" },
                                { code: "DO", name: "Dominican Republic" },
                                { code: "EC", name: "Ecuador" },
                                { code: "EG", name: "Egypt" },
                                { code: "SV", name: "El Salvador" },
                                { code: "EE", name: "Estonia" },
                                { code: "ET", name: "Ethiopia" },
                                { code: "FJ", name: "Fiji" },
                                { code: "FI", name: "Finland" },
                                { code: "FR", name: "France" },
                                { code: "GA", name: "Gabon" },
                                { code: "GM", name: "Gambia" },
                                { code: "GE", name: "Georgia" },
                                { code: "DE", name: "Germany" },
                                { code: "GH", name: "Ghana" },
                                { code: "GR", name: "Greece" },
                                { code: "GT", name: "Guatemala" },
                                { code: "GN", name: "Guinea" },
                                { code: "GY", name: "Guyana" },
                                { code: "HT", name: "Haiti" },
                                { code: "HN", name: "Honduras" },
                                { code: "HU", name: "Hungary" },
                                { code: "IS", name: "Iceland" },
                                { code: "IN", name: "India" },
                                { code: "ID", name: "Indonesia" },
                                { code: "IR", name: "Iran" },
                                { code: "IQ", name: "Iraq" },
                                { code: "IE", name: "Ireland" },
                                { code: "IL", name: "Israel" },
                                { code: "IT", name: "Italy" },
                                { code: "JM", name: "Jamaica" },
                                { code: "JP", name: "Japan" },
                                { code: "JO", name: "Jordan" },
                                { code: "KZ", name: "Kazakhstan" },
                                { code: "KE", name: "Kenya" },
                                { code: "KR", name: "Korea, Republic of" },
                                { code: "KW", name: "Kuwait" },
                                { code: "KG", name: "Kyrgyzstan" },
                                { code: "LA", name: "Lao PDR" },
                                { code: "LV", name: "Latvia" },
                                { code: "LB", name: "Lebanon" },
                                { code: "LS", name: "Lesotho" },
                                { code: "LR", name: "Liberia" },
                                { code: "LY", name: "Libya" },
                                { code: "LI", name: "Liechtenstein" },
                                { code: "LT", name: "Lithuania" },
                                { code: "LU", name: "Luxembourg" },
                                { code: "MG", name: "Madagascar" },
                                { code: "MW", name: "Malawi" },
                                { code: "MY", name: "Malaysia" },
                                { code: "MV", name: "Maldives" },
                                { code: "ML", name: "Mali" },
                                { code: "MT", name: "Malta" },
                                { code: "MX", name: "Mexico" },
                                { code: "MD", name: "Moldova" },
                                { code: "MC", name: "Monaco" },
                                { code: "MN", name: "Mongolia" },
                                { code: "ME", name: "Montenegro" },
                                { code: "MA", name: "Morocco" },
                                { code: "MZ", name: "Mozambique" },
                                { code: "MM", name: "Myanmar" },
                                { code: "NA", name: "Namibia" },
                                { code: "NP", name: "Nepal" },
                                { code: "NL", name: "Netherlands" },
                                { code: "NZ", name: "New Zealand" },
                                { code: "NI", name: "Nicaragua" },
                                { code: "NE", name: "Niger" },
                                { code: "NG", name: "Nigeria" },
                                { code: "NO", name: "Norway" },
                                { code: "OM", name: "Oman" },
                                { code: "PK", name: "Pakistan" },
                                { code: "PA", name: "Panama" },
                                { code: "PG", name: "Papua New Guinea" },
                                { code: "PY", name: "Paraguay" },
                                { code: "PE", name: "Peru" },
                                { code: "PH", name: "Philippines" },
                                { code: "PL", name: "Poland" },
                                { code: "PT", name: "Portugal" },
                                { code: "QA", name: "Qatar" },
                                { code: "RO", name: "Romania" },
                                { code: "RU", name: "Russian Federation" },
                                { code: "RW", name: "Rwanda" },
                                { code: "SA", name: "Saudi Arabia" },
                                { code: "SN", name: "Senegal" },
                                { code: "RS", name: "Serbia" },
                                { code: "SG", name: "Singapore" },
                                { code: "SK", name: "Slovakia" },
                                { code: "SI", name: "Slovenia" },
                                { code: "ZA", name: "South Africa" },
                                { code: "ES", name: "Spain" },
                                { code: "LK", name: "Sri Lanka" },
                                { code: "SD", name: "Sudan" },
                                { code: "SR", name: "Suriname" },
                                { code: "SE", name: "Sweden" },
                                { code: "CH", name: "Switzerland" },
                                { code: "SY", name: "Syrian Arab Republic" },
                                { code: "TW", name: "Taiwan" },
                                { code: "TJ", name: "Tajikistan" },
                                { code: "TZ", name: "Tanzania" },
                                { code: "TH", name: "Thailand" },
                                { code: "TG", name: "Togo" },
                                { code: "TO", name: "Tonga" },
                                { code: "TT", name: "Trinidad and Tobago" },
                                { code: "TN", name: "Tunisia" },
                                { code: "TR", name: "Türkiye" },
                                { code: "TM", name: "Turkmenistan" },
                                { code: "UG", name: "Uganda" },
                                { code: "UA", name: "Ukraine" },
                                { code: "AE", name: "United Arab Emirates" },
                                { code: "GB", name: "United Kingdom" },
                                { code: "US", name: "United States" },
                                { code: "UY", name: "Uruguay" },
                                { code: "UZ", name: "Uzbekistan" },
                                { code: "VE", name: "Venezuela" },
                                { code: "VN", name: "Viet Nam" },
                                { code: "YE", name: "Yemen" },
                                { code: "ZM", name: "Zambia" },
                                { code: "ZW", name: "Zimbabwe" },
                              ]
                          ).map((c) => (
                            <option key={c.code || c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <motion.button
                        type="button"
                        onClick={() => setStep(1)}
                        style={{
                          padding: "14px 30px",
                          backgroundColor: "transparent",
                          background:
                            "linear-gradient(to right, #FFA500, #FFD700)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          ":hover": {
                            backgroundColor: "#f5f5f5",
                          },
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FiArrowLeft style={{ color: "#FFA500" }} />
                        Back
                      </motion.button>

                      <motion.button
                        type="submit"
                        style={{
                          padding: "14px 20px",
                          background:
                            "linear-gradient(to right, #FFA500, #FF8C00)",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          boxShadow: "0 2px 10px rgba(255, 165, 0, 0.3)",
                        }}
                        whileHover={{
                          scale: 1.02,
                          boxShadow: "0 4px 12px rgba(255, 165, 0, 0.4)",
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Continue to Payment
                        <FiArrowLeft style={{ transform: "rotate(180deg)" }} />
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}

            </div>

            {/* Right Column - Order Summary */}
            <section
              style={{
                display: "flex",
                flexDirection: "column",
                width: windowWidth < 768 ? "100%" : "350px",
                // backgroundColor: "rgba(26, 26, 26, 0.95)",
                borderRadius: "8px",
                boxShadow: "0 2px 15px rgba(0,0,0,0.08)",
                alignSelf: "flex-start",
                position: windowWidth < 768 ? "relative" : "sticky",
                top: windowWidth < 768 ? "auto" : "80px", // ✅ sticky কাজ করার জন্য দরকার
                height: "fit-content",
              }}
            >
              <div style={{}}>
                <h2
                  style={{
                    color: "#FFA500",
                    fontSize: "20px",
                    fontWeight: "700",
                    marginBottom: "20px",
                    background: "linear-gradient(to right, #FFA500, #FFD700)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    display: "inline-block",
                  }}
                >
                  Order Summary
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  {isCartCheckout ? (
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {cartItems.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            gap: "16px",
                            marginBottom: "16px",
                          }}
                        >
                          <div
                            style={{
                              width: "80px",
                              height: "80px",
                              borderRadius: "4px",
                              overflow: "hidden",
                              flexShrink: 0,
                              backgroundColor: "#f5f5f5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <FiShoppingCart size={24} color="#666" />
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3
                              style={{
                                fontSize: "14px",
                                color: "#FFA500",
                                fontWeight: "600",
                                textAlign: "justify",
                                margin: "0 0 4px 0",
                                wordBreak: "break-word",
                                lineHeight: "1.2",
                              }}
                            >
                              {item.name}
                            </h3>
                            <p
                              style={{
                                fontSize: "14px",
                                margin: "0 0 5px 0",
                                color: "white",
                              }}
                            >
                              Qty: {item.quantity} (MOQ: {item.moq || 1})
                            </p>
                            <p
                              style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                margin: "4px 0 0 0",
                                color: "white",
                              }}
                            >
                              Price: ${item.price}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "4px",
                          overflow: "hidden",
                          flexShrink: 0,
                          backgroundColor: "#f5f5f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {mergedProduct.product_photos?.[0] ? (
                          <img
                            src={mergedProduct.product_photos[0]}
                            alt={mergedProduct.product_name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <FiShoppingCart size={24} color="#666" />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          style={{
                            fontSize: "16px",
                            color: "#FFA500",
                            fontWeight: "600",
                            margin: "0 0 4px 0",
                            wordBreak: "break-word",
                            lineHeight: "1.2",
                          }}
                        >
                          {mergedProduct.product_name}
                        </h3>
                        <p
                          style={{
                            fontSize: "14px",
                            margin: "0 0 8px 0",
                            color: "white",
                          }}
                        >
                          Single Price: $
                          {(
                            mergedProduct.discounted_price ||
                            mergedProduct.price ||
                            0
                          ).toFixed(2)}
                        </p>
                        <p
                          style={{
                            fontSize: "14px",
                            margin: "0 0 8px 0",
                            color: "white",
                          }}
                        >
                          Qty: {customizationData.quantity} (MOQ:{" "}
                          {mergedProduct.moq || 1})
                        </p>
                        <p
                          style={{
                            fontSize: "14px",
                            margin: "0 0 4px 0",
                            color: "#FFB84D",
                            fontWeight: "500",
                          }}
                        >
                          {customizationData.quantity} × $
                          {(
                            mergedProduct.discounted_price ||
                            mergedProduct.price ||
                            0
                          ).toFixed(2)}{" "}
                          = $
                          {(
                            (mergedProduct.discounted_price ||
                              mergedProduct.price ||
                              0) * customizationData.quantity
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "white",
                    }}
                  >
                    ${totals.total}
                  </span>
                </div>

                {step === 3 && (
                  <div
                    style={{
                      backgroundColor: "rgba(26, 26, 26, 0.95)",
                      padding: "16px",
                      borderRadius: "4px",
                      marginBottom: "24px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "14px",
                        margin: "0",
                        color: "white",
                        lineHeight: "1.5",
                      }}
                    >
                      By placing your order, you agree to our{" "}
                      <a
                        href="#"
                        style={{
                          color: "#FFA500",
                          fontWeight: "600",
                          textDecoration: "none",
                        }}
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        style={{
                          color: "#FFA500",
                          fontWeight: "600",
                          textDecoration: "none",
                        }}
                      >
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </div>
                )}
              </div>
              {/* ======= Quantity Card ======= */}
              <section
                aria-labelledby="total-quantity-label"
                style={{
                  padding: isMobile ? "18px 0" : 18,
                  borderRadius: 10,
                  background:
                    "linear-gradient(180deg, rgba(255,165,0,0.03), rgba(0,0,0,0.16))",
                  border: "1px solid rgba(255,165,0,0.06)",
                  marginBottom: 20,
                }}
              >
                <label
                  id="total-quantity-label"
                  style={{
                    display: "block",
                    marginBottom: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#FFD07A",
                  }}
                >
                  Total Order Quantity (MOQ: {mergedProduct.moq || 500}) *
                </label>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <button
                      type="button"
                      aria-label="Decrease total quantity"
                      onClick={() =>
                        handleCustomizationChange(
                          "quantity",
                          Math.max(
                            mergedProduct.moq,
                            customizationData.quantity - 1
                          )
                        )
                      }
                      disabled={customizationData.quantity <= mergedProduct.moq}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.04)",
                        background: "transparent",
                        color:
                          customizationData.quantity <= mergedProduct.moq
                            ? "#666"
                            : "#FFB84D",
                        fontSize: 18,
                        cursor:
                          customizationData.quantity <= mergedProduct.moq
                            ? "not-allowed"
                            : "pointer",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <FiMinus />
                    </button>

                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label="Total order quantity"
                      value={customizationData.quantity}
                      onChange={(e) =>
                        handleCustomizationChange(
                          "quantity",
                          Math.max(
                            mergedProduct.moq || 500,
                            parseInt(e.target.value) || mergedProduct.moq || 500
                          )
                        )
                      }
                      min={mergedProduct.moq || 500}
                      style={{
                        width: 120,
                        padding: "12px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.04)",
                        backgroundColor: "#0b0b0b",
                        color: "white",
                        textAlign: "center",
                        fontSize: 18,
                        fontWeight: 700,
                        WebkitAppearance: "none",
                        MozAppearance: "textfield",
                      }}
                    />

                    <button
                      type="button"
                      aria-label="Increase total quantity"
                      onClick={() =>
                        handleCustomizationChange(
                          "quantity",
                          customizationData.quantity + 1
                        )
                      }
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.04)",
                        background: "transparent",
                        color: "#FFB84D",
                        fontSize: 18,
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 260 }}>
                  <div
                    style={{
                      height: 10,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 999,
                      overflow: "hidden",
                      marginBottom: 10,
                      border: "1px solid rgba(255,165,0,0.04)",
                    }}
                    aria-hidden
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(
                          100,
                          (customizationData.slots.reduce(
                            (s, sl) => s + sl.quantity,
                            0
                          ) /
                            Math.max(1, customizationData.quantity)) *
                            100
                        )}%`,
                        transition: "width .28s ease, background .28s ease",
                        background: (() => {
                          const progress =
                            (customizationData.slots.reduce(
                              (s, sl) => s + sl.quantity,
                              0
                            ) /
                              Math.max(1, customizationData.quantity)) *
                            100;

                          // HSL interpolation: 0% = red (0°), 50% = yellow (60°), 100% = green (120°)
                          const hue = Math.min(120, (progress * 120) / 100);
                          return `hsl(${hue}, 100%, 50%)`;
                        })(),
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      color: "#bdbdbd",
                    }}
                  >
                    <span>
                      Allocated:{" "}
                      {customizationData.slots.reduce(
                        (sum, s) => sum + s.quantity,
                        0
                      )}
                    </span>
                    <span>Remaining: {getRemainingQuantity()}</span>
                  </div>
                  <p
                    style={{
                      margin: "10px 0 0 0",
                      color:
                        getRemainingQuantity() === 0 ? "#9ee6a6" : "#ffca8a",
                      fontSize: 12,
                    }}
                  >
                    {getRemainingQuantity() === 0
                      ? "All units allocated — you're ready to continue."
                      : "Allocate the remaining units across slots before continuing."}
                  </p>
                </div>
              </section>
              {/* ======= Customization Slots Header ======= */}
              <section style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        // quick auto-allocate: if slots exist distribute remaining evenly
                        if (customizationData.slots.length > 0) {
                          const rem = getRemainingQuantity();
                          if (rem > 0) {
                            const per =
                              Math.floor(
                                rem / customizationData.slots.length
                              ) || 1;
                            customizationData.slots.forEach((s) => {
                              handleSlotQuantityChange(s.id, s.quantity + per);
                            });
                          }
                        }
                      }}
                      title="Quick distribute remaining evenly"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "none",
                        cursor: canAddMoreSlots ? "pointer" : "not-allowed",
                        background: canAddMoreSlots
                          ? "linear-gradient(90deg,#FFD07A,#FF8C00)"
                          : "linear-gradient(90deg,#444,#666)",
                        color: "#0b0b0b",
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      Quick Distribute
                    </button>
                  </div>
                </div>
              </section>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

const OrderConfirmation = ({
  items = [],
  totals = {},
  paymentMethod = "paypal",
  address = {},
  customizationNotes = "",
  customizationFile = null,
  onDownloadPDF,
  estimatedDelivery = "",
  productionTime = "",
  isCartCheckout = false,
  isInquiryCheckout = false,
  inquiryProductData = {},
  mergedProduct = {},
  customizationData = {},
}) => {
  // Normalize items for display with MOQ and original pricing
  const toAbsolute = (url) => absoluteUrl(url);
  const resolvePhoto = (it) => {
    if (it.image) return toAbsolute(it.image);
    const ph =
      Array.isArray(it.product_photos) && it.product_photos.length > 0
        ? it.product_photos[0]
        : undefined;
    if (!ph) return undefined;
    if (typeof ph === "string") {
      if (ph.startsWith("data:image")) return ph;
      return toAbsolute(ph) || undefined;
    }
    const objUrl = ph.url || ph.image_url || ph.src || "";
    if (!objUrl) return undefined;
    if (objUrl.startsWith("data:image")) return objUrl;
    return toAbsolute(objUrl);
  };
  
  const normalizedItems = Array.isArray(items)
    ? items.map((it) => {
        const qty = it.quantity || 1;
        const unitCandidate =
          it.discounted_price ??
          it.unitPrice ??
          it.price ??
          it.original_price ??
          0;
        const parsedUnit =
          typeof unitCandidate === "number"
            ? unitCandidate
            : parseFloat(unitCandidate) || 0;
        const totalCandidate =
          totals && totals.total != null
            ? parseFloat(totals.total)
            : NaN;
        const fallbackUnit =
          (!isNaN(parsedUnit) && parsedUnit > 0)
            ? parsedUnit
            : (!isNaN(totalCandidate) && qty > 0
                ? totalCandidate / qty
                : 0);
        return {
          name: it.product_name || it.name || it.title || "Item",
          quantity: qty,
          moq: it.moq || 1,
          image: resolvePhoto(it),
          originalPrice: (() => {
            const cand =
              it.original_price ??
              it.price ??
              it.unitPrice ??
              0;
            return typeof cand === "number" ? cand : parseFloat(cand) || 0;
          })(),
          unitPrice: fallbackUnit,
          discountedPrice:
            it.discounted_price != null ? parseFloat(it.discounted_price) : null,
        };
      })
    : [];

  const computedTotal = (() => {
    const t = totals && totals.total != null ? parseFloat(totals.total) : NaN;
    if (!isNaN(t) && t > 0) return t;
    return normalizedItems.reduce((sum, it) => {
      const effectiveUnit = !isNaN(it.unitPrice) ? it.unitPrice : 0;
      return sum + effectiveUnit * (it.quantity || 1);
    }, 0);
  })();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "rgba(26, 26, 26, 0.95)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          width: "100%",
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "40px",
          marginTop: "5vh",
          marginBottom: "20vh",
          boxShadow: "0 2px 20px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            background: "linear-gradient(to right, #4CAF50, #45a049)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <FiCheckCircle style={{ color: "white", fontSize: "40px" }} />
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            margin: "0 0 16px 0",
            background: "linear-gradient(to right, #FFA500, #FFD700)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "inline-block",
          }}
        >
          Order Confirmed!
        </h1>

        <p
          style={{
            fontSize: "16px",
            color: "#757575",
            margin: "0 0 30px 0",
            lineHeight: "1.6",
          }}
        >
          Thank you for your order. We've received it and will begin processing
          right away.{" "}
          {paymentMethod === "paypal"
            ? "Your payment was successful."
            : "You will receive a confirmation email with our bank details shortly."}
        </p>
        
        {/* Shipping Address */}
        <div
          style={{
            textAlign: "left",
            color: "black",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "30px",
          }}
        >
          <h3 style={{ color: "#FFA500", marginBottom: "12px" }}>
            Shipping Address
          </h3>
          <div style={{ marginBottom: "6px" }}>
            <strong>
              {`${address.firstName || ""} ${address.lastName || ""}`.trim()}
            </strong>
            {address.company ? `, ${address.company}` : ""}
          </div>
          <div>{address.email}</div>
          <div>{address.phone}</div>
          <div style={{ marginTop: "8px" }}>{address.address}</div>
          <div>
            {[address.city, address.state, address.zip]
              .filter(Boolean)
              .join(", ")}
          </div>
          <div>{address.country}</div>
        </div>
        
        {/* Items - Order Summary এর মতো একই স্টাইল */}
        <div
          style={{
            textAlign: "left",
            marginBottom: "30px",
            color: "black",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <h3 style={{ color: "#FFA500", marginBottom: "20px" }}>
            Order Summary
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {isCartCheckout ? (
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {normalizedItems.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "4px",
                        overflow: "hidden",
                        flexShrink: 0,
                        backgroundColor: "#f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <FiShoppingCart size={24} color="#666" />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: "16px",
                          color: "#FFA500",
                          fontWeight: "600",
                          margin: "0 0 4px 0",
                          wordBreak: "break-word",
                          lineHeight: "1.2",
                        }}
                      >
                        {item.name}
                      </h3>
                      <p
                        style={{
                          fontSize: "14px",
                          margin: "0 0 5px 0",
                          color: "#666",
                        }}
                      >
                        Qty: {item.quantity} (MOQ: {item.moq || 1})
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          margin: "4px 0 0 0",
                          color: "#333",
                        }}
                      >
                        Price: ${item.unitPrice?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "4px",
                    overflow: "hidden",
                    flexShrink: 0,
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {mergedProduct.product_photos?.[0] ? (
                    <img
                      src={mergedProduct.product_photos[0]}
                      alt={mergedProduct.product_name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <FiShoppingCart size={24} color="#666" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: "16px",
                      color: "#FFA500",
                      fontWeight: "600",
                      margin: "0 0 4px 0",
                      wordBreak: "break-word",
                      lineHeight: "1.2",
                    }}
                  >
                    {mergedProduct.product_name}
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      margin: "0 0 8px 0",
                      color: "#666",
                    }}
                  >
                    Single Price: $
                    {(
                      mergedProduct.discounted_price ||
                      mergedProduct.price ||
                      0
                    ).toFixed(2)}
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      margin: "0 0 8px 0",
                      color: "#666",
                    }}
                  >
                    Qty: {customizationData.quantity || 1} (MOQ:{" "}
                    {mergedProduct.moq || 1})
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      margin: "0 0 4px 0",
                      color: "#FFB84D",
                      fontWeight: "500",
                    }}
                  >
                    {customizationData.quantity || 1} × $
                    {(
                      mergedProduct.discounted_price ||
                      mergedProduct.price ||
                      0
                    ).toFixed(2)}{" "}
                    = $
                    {(
                      (mergedProduct.discounted_price ||
                        mergedProduct.price ||
                        0) *
                      (customizationData.quantity || 1)
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Total
            </span>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#333",
              }}
            >
              ${computedTotal.toFixed(2)}
            </span>
          </div>
        </div>
        
        {/* Order Details */}
        <div
          style={{
            textAlign: "left",
            marginBottom: "30px",
            color: "black",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <h3 style={{ color: "#FFA500", marginBottom: "16px" }}>
            Order Details
          </h3>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontWeight: "600" }}>Order Number:</span>
            <span>{localStorage.getItem("lastOrderId") || "N/A"}</span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontWeight: "600" }}>Payment Method:</span>
            <span>
              {paymentMethod === "paypal"
                ? "PayPal"
                : paymentMethod === "stripe"
                ? "Stripe"
                : "Other"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontWeight: "600" }}>Production Time:</span>
            <span>{productionTime}</span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontWeight: "600" }}>Estimated Delivery:</span>
            <span>{estimatedDelivery}</span>
          </div>

          {customizationNotes && (
            <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #eee",
              }}
            >
              <div style={{ fontWeight: "600", color: "#FFA500", marginBottom: "4px" }}>
                Customization Notes:
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                {customizationNotes}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <motion.button
            onClick={onDownloadPDF}
            style={{
              padding: "14px 30px",
              background: "linear-gradient(to right, #4285F4, #34A853)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 10px rgba(66, 133, 244, 0.3)",
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 4px 12px rgba(66, 133, 244, 0.4)",
            }}
            whileTap={{ scale: 0.98 }}
          >
            Download Receipt
            <FiDownload />
          </motion.button>

          <motion.button
            onClick={() => (window.location.href = "/")}
            style={{
              padding: "14px 30px",
              background: "linear-gradient(to right, #FFA500, #FF8C00)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 10px rgba(255, 165, 0, 0.3)",
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 4px 12px rgba(255, 165, 0, 0.4)",
            }}
            whileTap={{ scale: 0.98 }}
          >
            Continue Shopping
            <FiShoppingCart />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
