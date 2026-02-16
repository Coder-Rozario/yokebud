import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiShoppingCart, FiHeart, FiShare2, 
  FiChevronLeft, FiChevronRight, FiStar, 
  FiTruck, FiShield, FiTag, FiZoomIn, 
  FiMinus, FiPlus, FiCheck, FiZap, 
  FiCopy, FiMail, FiMessageSquare, FiFacebook, FiImage, FiExternalLink,
  FiMessageCircle
} from 'react-icons/fi';
import { useCart } from '../pages/context/CartContext';
import Inquiry from '../components/Checkout';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingAnimation from './LoadingAnimation';
import { Helmet } from "react-helmet-async";

// Configure API base for production (dev uses Vite proxy)
const API_BASE = (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname))
  ? 'https://api.yokebud.com'
  : '';

// Local fetch wrapper to prefix /api calls with API_BASE in production
const __originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : fetch;
const fetch = (input, init) => {
  const isApiPath = typeof input === 'string' && input.startsWith('/api');
  const url = isApiPath ? `${API_BASE}${input}` : input;
  return __originalFetch(url, init);
};

const ProductModal = ({ product: propProduct = {}, relatedProducts: propRelatedProducts = [], onClose, onRelatedProductClick }) => {
  // Get product ID from URL if available (support both :productId and :id)
  const { productId, id: routeParamId } = useParams();
  const routeId = productId || routeParamId;
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for product data
  const [product, setProduct] = useState(propProduct);
  const [loading, setLoading] = useState(!propProduct.id && !!routeId);
  const [error, setError] = useState(null);
  const [fetchedRelatedProducts, setFetchedRelatedProducts] = useState([]);
  const [isFromSharedUrl, setIsFromSharedUrl] = useState(false);
  
  // Set default empty values for product to prevent undefined errors
  const safeProduct = {
    id: routeId || propProduct.id || '',
    product_name: '',
    product_details: '',
    price: 0,
    min_price: 0,
    max_price: 0,
    discounted_price: null,
    category: '',
    subcategory: '',
    stock: 0,
    moq: 500,
    material: '',
    care_instructions: '',
    sku: '',
    shipping_info: '',
    warranty: '',
    bulk_discount: '',
    rating: 0,
    product_photos: [],
    sizes: [], // Size array will be empty - we'll show customizable instead
    colors: [],
    tags: [],
    features: [],
    ...product
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('Customizable'); // Always set to Customizable
  const [quantity, setQuantity] = useState(safeProduct?.moq || 1);
  const [activeTab, setActiveTab] = useState('details');
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [slideShowActive, setSlideShowActive] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [showCheckout, setShowCheckout] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  const { addToCart } = useCart();
  const imageRef = useRef(null);
  const modalRef = useRef(null);
  const imageContainerRef = useRef(null);
  const shareButtonRef = useRef(null);

  // Process product photos to ensure proper URLs
  const processProductPhotos = (photos) => {
    if (!photos) return [];
    if (typeof photos === 'string') {
      try {
        photos = JSON.parse(photos);
      } catch (e) {
        console.error('Error parsing product photos:', e);
        photos = [];
      }
    }
    return (photos || []).map(photo => {
      if (!photo) return '';
      if (photo.startsWith('http')) return photo;
      return `https://api.yokebud.com${photo.startsWith('/') ? '' : '/'}${photo}`;
    });
  };

  // Enhanced fetch function with better error handling
  const fetchProductData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching product data for ID:', routeId);
      
      const productResponse = await fetch(`/api/products/${routeId}`);
      
      console.log('API response status:', productResponse.status);
      
      if (!productResponse.ok) {
        const errorText = await productResponse.text();
        throw new Error(`Failed to fetch product: ${productResponse.status} - ${errorText}`);
      }
      
      const productPayload = await productResponse.json();
      const productData = productPayload?.product || productPayload;
      console.log('Fetched product data (normalized):', productData);
      
      if (!productData || (!productData.id && !productData.product_id)) {
        throw new Error('Invalid product data received from server');
      }
      
      const safeParseArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.warn('Non-JSON or invalid array value encountered:', e);
          return [];
        }
      };

      const processedProduct = {
        id: productData.id || productData.product_id,
        product_name: productData.product_name || productData.name || '',
        product_details: productData.product_details || productData.description || '',
        price: productData.price || 0,
        min_price: productData.min_price || productData.discounted_price || productData.price,
        max_price: productData.max_price || productData.price,
        category: productData.category || (Array.isArray(productData.categories) ? productData.categories[0] : ''),
        subcategory: productData.subcategory || '',
        stock: productData.stock || 0,
        moq: productData.moq || 500,
        material: productData.material || '',
        care_instructions: productData.care_instructions || productData.care || '',
        sku: productData.sku || '',
        shipping_info: productData.shipping_info || productData.shipping || '',
        warranty: productData.warranty || '',
        bulk_discount: productData.bulk_discount || '',
        rating: productData.rating || 0,
        product_photos: processProductPhotos(productData.product_photos || productData.photos || []),
        sizes: [], // Always set sizes to empty array - we'll show customizable
        colors: safeParseArray(productData.colors),
        tags: safeParseArray(productData.tags),
        features: safeParseArray(productData.features),
        // Ensure price range fields are properly set (already above)
      };
      
      setProduct(processedProduct);
      
      // Fetch related products only if category exists - limit to 6
      if (productData.category) {
        console.log('Fetching related products for category:', productData.category);
        const relatedResponse = await fetch(
          `/api/products?category=${encodeURIComponent(productData.category)}&limit=6`
        );
        
        if (relatedResponse.ok) {
          const relatedPayload = await relatedResponse.json();
          const relatedArray = Array.isArray(relatedPayload?.products) ? relatedPayload.products : relatedPayload;
          console.log('Fetched related products:', relatedArray);
          
          setFetchedRelatedProducts(
            (relatedArray || [])
              .filter(p => p.id !== routeId)
              .slice(0, 6) // Ensure maximum 6 products
              .map(p => ({
                ...p,
                product_photos: processProductPhotos(p.product_photos || p.photos || []),
                min_price: p.min_price || p.discounted_price || p.price,
                max_price: p.max_price || p.price
              }))
          );
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err.message);
      setLoading(false);
      toast.error(`Failed to load product: ${err.message}`);
    }
  };

  useEffect(() => {
    if (location.pathname.startsWith('/products/') && !propProduct.id) {
      setIsFromSharedUrl(true);
      console.log('Detected shared URL access');
    }
  }, [location.pathname, propProduct.id]);

  useEffect(() => {
    if (routeId && !propProduct.id) {
      console.log('Fetching product data via URL');
      fetchProductData();
    } else {
      console.log('Using prop product data');
    }
  }, [routeId, propProduct.id]);

  // If opened via shared URL and fetching fails, redirect to home to avoid a stuck black overlay
  useEffect(() => {
    if (error && isFromSharedUrl) {
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [error, isFromSharedUrl, navigate]);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle slideshow
  useEffect(() => {
    let interval;
    if (slideShowActive && !isHoveringImage && !isZoomed && safeProduct.product_photos.length > 0) {
      interval = setInterval(() => {
        setCurrentImageIndex(prev => 
          prev === safeProduct.product_photos.length - 1 ? 0 : prev + 1
        );
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [slideShowActive, isHoveringImage, isZoomed, safeProduct.product_photos.length]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isZoomed) setIsZoomed(false);
        else handleClose();
      }
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed]);

  const handleClose = () => {
    console.log('Closing modal, isFromSharedUrl:', isFromSharedUrl);
    if (isFromSharedUrl) {
      navigate('/', { replace: true });
    } else if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const nextImage = () => {
    if (safeProduct.product_photos.length === 0) return;
    
    setCurrentImageIndex(prev => 
      prev === safeProduct.product_photos.length - 1 ? 0 : prev + 1
    );
    pauseSlideshowTemporarily();
  };

  const prevImage = () => {
    if (safeProduct.product_photos.length === 0) return;
    
    setCurrentImageIndex(prev => 
      prev === 0 ? safeProduct.product_photos.length - 1 : prev - 1
    );
    pauseSlideshowTemporarily();
  };

  const pauseSlideshowTemporarily = () => {
    setSlideShowActive(false);
    setTimeout(() => setSlideShowActive(true), 10000);
  };

  const handleImageClick = (e) => {
    if (!imageRef.current || safeProduct.product_photos.length === 0) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
    setIsZoomed(!isZoomed);
  };

  const handleMouseMove = (e) => {
    if (isZoomed && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPosition({ x, y });
    }
  };

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) nextImage();
    if (touchStart - touchEnd < -50) prevImage();
  };

  const handleAddToCart = () => {
    // No size validation needed since it's always customizable
    const finalQuantity = Math.max(quantity, safeProduct.moq || 1);
    
    addToCart({
      ...safeProduct,
      selectedSize: 'Customizable', // Always set to Customizable
      quantity: finalQuantity
    });

    setNotificationMessage(`${safeProduct.product_name} (Customizable) x${finalQuantity} added to cart!`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);

    toast.success(`${safeProduct.product_name} (Customizable) x${finalQuantity} added to cart!`, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  };

const handleBuyNow = () => {
  // No size validation needed since it's always customizable
  const finalQuantity = Math.max(quantity, safeProduct.moq || 1);
  
  // Create structured message with product details
  const structuredMessage = `Product Inquiry: ${safeProduct.product_name}

Product Details:
- Quantity: ${finalQuantity} units
- Size: Customizable
- Price Range: $${safeProduct.min_price || safeProduct.discounted_price || safeProduct.price} - $${safeProduct.max_price || safeProduct.price}
- MOQ: ${safeProduct.moq} units
- SKU: ${safeProduct.sku || 'N/A'}

Please provide your best price for this quantity.`;

  // Navigate to inquiry page with product data and structured message
  navigate('/inquiry', { 
    state: { 
      product: {
        ...safeProduct,
        selectedSize: 'Customizable',
        quantity: finalQuantity,
        // Ensure all necessary fields are included
        name: safeProduct.product_name,
        product_name: safeProduct.product_name,
        price: safeProduct.min_price || safeProduct.discounted_price || safeProduct.price,
        min_price: safeProduct.min_price || safeProduct.discounted_price || safeProduct.price,
        max_price: safeProduct.max_price || safeProduct.price,
        discounted_price: safeProduct.discounted_price,
        product_photos: safeProduct.product_photos,
        product_details: safeProduct.product_details,
        moq: safeProduct.moq,
        stock: safeProduct.stock,
        sku: safeProduct.sku,
        material: safeProduct.material,
        care_instructions: safeProduct.care_instructions,
        shipping_info: safeProduct.shipping_info,
        warranty: safeProduct.warranty,
        tags: safeProduct.tags,
        features: safeProduct.features,
        category: safeProduct.category,
        subcategory: safeProduct.subcategory
      },
      directInquiry: true, // Flag to indicate this is a direct inquiry, not from cart
      initialMessage: structuredMessage // Send structured message
    } 
  });
};

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.info(
      !isWishlisted 
        ? `${safeProduct.product_name} added to wishlist!` 
        : `${safeProduct.product_name} removed from wishlist!`,
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

  const toggleShareOptions = () => {
    setShowShareOptions(!showShareOptions);
  };

  const getProductLink = () => {
    return `${window.location.origin}/products/${safeProduct.id}`;
  };

  const copyProductLink = () => {
    const link = getProductLink();
    navigator.clipboard.writeText(link)
      .then(() => {
        toast.success('Product link copied to clipboard!', {
          position: "top-right",
          autoClose: 2000,
          theme: "dark",
        });
      })
      .catch(err => {
        toast.error('Failed to copy link', {
          position: "top-right",
          autoClose: 2000,
          theme: "dark",
        });
        console.error('Copy failed:', err);
      })
      .finally(() => {
        setShowShareOptions(false);
      });
  };

  const shareViaEmail = () => {
    const link = getProductLink();
    const subject = `Check out this product: ${safeProduct.product_name}`;
    const body = `I thought you might be interested in this product:\n\n${safeProduct.product_name}\n\n${link}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setShowShareOptions(false);
  };

  const shareViaWhatsApp = () => {
    const link = getProductLink();
    const text = `Check out this product: ${safeProduct.product_name} - ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    setShowShareOptions(false);
  };

  const shareViaFacebook = () => {
    const link = getProductLink();
    const url = encodeURIComponent(link);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
    setShowShareOptions(false);
  };

  const handleRelatedProductClick = (relatedProduct) => {
    if (onRelatedProductClick) {
      onRelatedProductClick(relatedProduct);
    } else {
      navigate(`/products/${relatedProduct.id}`, { replace: true });
      window.scrollTo(0, 0);
    }
    
    setProduct(relatedProduct);
    setCurrentImageIndex(0);
    setSelectedSize('Customizable'); // Always set to Customizable
    setQuantity(relatedProduct.moq || 1);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `https://api.yokebud.com${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  // New function to render price with range (robust against string/undefined)
  const renderPrice = () => {
    const numericMin = parseFloat(
      safeProduct.min_price ?? safeProduct.discounted_price ?? safeProduct.price ?? 0
    );
    const numericMax = parseFloat(
      safeProduct.max_price ?? safeProduct.price ?? numericMin ?? 0
    );
    const numericDiscount = parseFloat(
      safeProduct.discounted_price ?? ''
    );
    const isValidMin = Number.isFinite(numericMin);
    const isValidMax = Number.isFinite(numericMax);
    const isValidDiscount = Number.isFinite(numericDiscount);
    const min = isValidMin ? numericMin : 0;
    const max = isValidMax ? numericMax : min;
    const hasPriceRange = isValidMin && isValidMax && min !== max;
    const displayMinPrice = min;
    const displayMaxPrice = max;

    if (hasPriceRange) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <span style={{
            fontSize: windowWidth < 768 ? '24px' : '28px',
            fontWeight: '700',
            background: 'linear-gradient(90deg, #FFD700, #FFA500, #FF8C00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            ${displayMinPrice.toFixed(2)} - ${displayMaxPrice.toFixed(2)}
          </span>
          
          {isValidDiscount && numericDiscount !== displayMinPrice && (
            <span style={{
              fontSize: windowWidth < 768 ? '18px' : '20px',
              fontWeight: '500',
              color: '#95a5a6',
              textDecoration: 'line-through'
            }}>
              ${numericDiscount.toFixed(2)}
            </span>
          )}
        </div>
      );
    } else {
      // Single price display
      const displayPrice = displayMinPrice;
      
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <span style={{
            fontSize: windowWidth < 768 ? '24px' : '28px',
            fontWeight: '700',
            background: isValidDiscount && numericDiscount !== displayPrice 
              ? 'linear-gradient(90deg, #FFD700, #FFA500, #FF8C00)'
              : 'none',
            WebkitBackgroundClip: isValidDiscount && numericDiscount !== displayPrice ? 'text' : 'unset',
            WebkitTextFillColor: isValidDiscount && numericDiscount !== displayPrice ? 'transparent' : '#fff',
            display: 'inline-block'
          }}>
            ${displayPrice.toFixed(2)}
          </span>
          
          {isValidDiscount && numericDiscount !== displayPrice && (
            <>
              <span style={{
                fontSize: windowWidth < 768 ? '18px' : '20px',
                fontWeight: '500',
                color: '#95a5a6',
                textDecoration: 'line-through'
              }}>
                ${numericDiscount.toFixed(2)}
              </span>
              <span style={{
                padding: '4px 8px',
                background: '#e74c3c',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '700',
                color: '#fff'
              }}>
                {Math.round((1 - numericDiscount / displayPrice) * 100)}% OFF
              </span>
            </>
          )}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 1000,
        color: '#FFA500'
      }}>
        <div style={{ marginBottom: '20px', fontSize: '18px' }}><LoadingAnimation/></div>
          <div style={{ fontSize: '14px', color: '#ccc' }}>
            Product ID: {routeId}
        </div>
      </div>
    );
  }

  if (error && !propProduct.id) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 1000,
        color: '#e74c3c',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '20px' }}>Error Loading Product</h3>
        <p style={{ marginBottom: '10px' }}>{error}</p>
        <p style={{ marginBottom: '20px' }}>Product ID: {productId}</p>
        <p>Redirecting to homepage...</p>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <Inquiry 
        product={safeProduct} 
        quantity={quantity}
        selectedSize={selectedSize}
      />
    );
  }

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const finalRelatedProducts = propRelatedProducts.length > 0 
    ? propRelatedProducts.slice(0, 6) // Maximum 6 related products
    : fetchedRelatedProducts.slice(0, 6); // Maximum 6 related products

  return (
    <AnimatePresence>
      <Helmet>
        <title>{safeProduct.product_name} | Yokebud Group Oy</title>
        <meta name="description" content={`${safeProduct.product_name} - ${safeProduct.product_details ? safeProduct.product_details.substring(0, 150) : 'Premium B2B clothing manufacturer product'}. Price: $${safeProduct.min_price || safeProduct.price} - $${safeProduct.max_price || safeProduct.price}. MOQ: ${safeProduct.moq} units.`} />
        <meta name="keywords" content={`${safeProduct.product_name}, ${safeProduct.category || 'clothing'}, B2B clothing, wholesale, custom apparel, ${safeProduct.tags ? safeProduct.tags.join(', ') : ''}`} />
        <meta property="og:title" content={`${safeProduct.product_name} | Yokebud Group Oy`} />
        <meta property="og:description" content={`${safeProduct.product_name} - Premium B2B clothing manufacturer product. Price: $${safeProduct.min_price || safeProduct.price} - $${safeProduct.max_price || safeProduct.price}.`} />
        <meta property="og:image" content={safeProduct.product_photos && safeProduct.product_photos.length > 0 ? safeProduct.product_photos[0] : '/logo.jpg'} />
        <meta property="og:url" content={`${window.location.origin}/products/${safeProduct.id}`} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${safeProduct.product_name} | Yokebud Group Oy`} />
        <meta name="twitter:description" content={`${safeProduct.product_name} - Premium B2B clothing manufacturer product.`} />
        <meta name="twitter:image" content={safeProduct.product_photos && safeProduct.product_photos.length > 0 ? safeProduct.product_photos[0] : '/logo.jpg'} />
        <link rel="canonical" href={`${window.location.origin}/products/${safeProduct.id}`} />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 6000000000000000,
          padding: isMobile ? '10px' : '20px',
          overflowY: 'auto'
        }}
        onClick={handleClose}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '1400px',
            maxHeight: isMobile ? '95vh' : '90vh',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            border: '1px solid #333',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.8)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              position: 'absolute',
              top: isMobile ? '10px' : '20px',
              right: isMobile ? '10px' : '20px',
              background: 'rgba(0,0,0,0.7)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              color: 'white'
            }}
            onClick={handleClose}
          >
            <FiX style={{ fontSize: '20px' }} />
          </motion.button>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            flex: 1,
            overflowY: 'auto'
          }}>
            {/* Premium Image Gallery */}
            <div 
              ref={imageContainerRef}
              style={{
                flex: isMobile ? '0 0 auto' : 1,
                position: 'relative',
                minHeight: isMobile ? '300px' : '500px',
                overflow: 'hidden',
                backgroundColor: '#1a1a1a',
                cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                display: 'flex',
                flexDirection: 'column',
                borderRight: isMobile ? 'none' : '1px solid #333'
              }}
              onMouseEnter={() => setIsHoveringImage(true)}
              onMouseLeave={() => setIsHoveringImage(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                ref={imageRef}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={handleImageClick}
                onMouseMove={handleMouseMove}
              >
                {safeProduct.product_photos.length > 0 ? (
                  <AnimatePresence mode='wait'>
                    <motion.img
                      key={currentImageIndex}
                      src={getImageUrl(safeProduct.product_photos[currentImageIndex])}
                      alt={safeProduct.product_name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.6, 0.05, 0.28, 0.91] }}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: isZoomed ? 'scale-down' : 'contain',
                        padding: isMobile ? '20px' : '40px',
                        transform: isZoomed ? `scale(2)` : 'scale(1)',
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        transition: 'transform 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
                        cursor: isZoomed ? 'zoom-out' : 'zoom-in'
                      }}
                      onError={() => setImageError(true)}
                    />
                  </AnimatePresence>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#000',
                    color: '#fff'
                  }}>
                    <FiImage size={48} />
                  </div>
                )}

                {!isZoomed && (
                  <motion.div 
                    style={{
                      position: 'absolute',
                      bottom: isMobile ? '10px' : '20px',
                      right: isMobile ? '10px' : '20px',
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 2,
                      color: 'white'
                    }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <FiZoomIn style={{ fontSize: '20px' }} />
                  </motion.div>
                )}
              </div>

              {/* Navigation Arrows */}
              {safeProduct.product_photos.length > 0 && (
                <>
                  <motion.button
                    style={{
                      position: 'absolute',
                      left: isMobile ? '10px' : '20px',
                      top: '40%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                      zIndex: 2,
                      color: 'white'
                    }}
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    whileHover={{ scale: 1.1 }}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: isHoveringImage || isZoomed ? 1 : 0.7,
                      x: isHoveringImage || isZoomed ? 0 : -10
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <FiChevronLeft style={{ fontSize: '20px' }} />
                  </motion.button>

                  <motion.button
                    style={{
                      position: 'absolute',
                      right: isMobile ? '10px' : '20px',
                      top: '40%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                      zIndex: 2,
                      color: 'white'
                    }}
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    whileHover={{ scale: 1.1 }}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: isHoveringImage || isZoomed ? 1 : 0.7,
                      x: isHoveringImage || isZoomed ? 0 : 10
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <FiChevronRight style={{ fontSize: '20px' }} />
                  </motion.button>
                </>
              )}

              {/* Thumbnail Navigation */}
              {safeProduct.product_photos.length > 1 && (
                <div style={{
                  display: 'flex',
                  padding: isMobile ? '10px' : '15px',
                  overflowX: 'auto',
                  margin: '0 auto',
                  width: '100%',
                  justifyContent: 'space-around',
                  scrollbarWidth: 'none',
                  background: 'black',
                  borderTop: '1px solid #333'
                }}>
                  {safeProduct.product_photos.map((photo, index) => (
                    <motion.div
                      key={index}
                      style={{
                        width: isMobile ? '50px' : '60px',
                        height: isMobile ? '50px' : '60px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: currentImageIndex === index ? '2px solid #3498db' : '2px solid transparent',
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                        position: 'relative'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                        pauseSlideshowTemporarily();
                      }}
                      whileHover={{ scale: 1.05 }}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                    >
                      <img 
                        src={getImageUrl(photo)} 
                        alt={`Thumbnail ${index}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.src = ''; // Clear the broken image
                          e.target.style.backgroundColor = '#333';
                        }}
                      />
                      {currentImageIndex === index && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(52, 152, 219, 0.3)'
                        }} />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Section */}
            <div style={{
              flex: 1,
              padding: isMobile ? '20px' : '40px',
              overflowY: isMobile ? 'visible' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              color: '#fff',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': {
                display: 'none'
              }
            }}>
              {/* Product Tags */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                flexWrap: 'wrap'
              }}>
                {safeProduct.tags.map((tag, index) => (
                  <motion.span 
                    key={index}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#fff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: 
                        tag === 'NEW' ? '#3498db' : 
                        tag === 'SALE' ? '#e74c3c' : 
                        tag === 'BESTSELLER' ? '#f39c12' : 
                        tag === 'LIMITED' ? '#9b59b6' : '#2c3e50'
                    }}
                    whileHover={{ y: -2 }}
                    layout
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
              
              {/* Product Title */}
              <motion.h1 
                style={{
                  margin: '0 0 16px 0',
                  fontSize: isMobile ? '15px' : '30px',
                  textAlign: 'justify',
                  fontWeight: '700',
                  color: '#fff'
                }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {safeProduct.product_name}
              </motion.h1>
              
              {/* Rating and SKU */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '16px',
                flexWrap: 'wrap'
              }}>

                <div style={{
                  padding: '4px 8px',
                  background: '#333',
                  borderRadius: '4px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '500'
                }}>
                  SKU: {safeProduct.sku || 'N/A'}
                </div>
              </div>
              
              {/* Price Section - Updated with range */}
              <div style={{
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid #333'
              }}>
                {renderPrice()}
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#fff'
                }}>
                  <span>Availability:</span>
                  <span style={{
                    color: safeProduct.stock > 0 ? '#2ecc71' : '#e74c3c',
                    fontWeight: '500'
                  }}>
                    {safeProduct.stock > 0 ? `${safeProduct.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>
              
              {/* Product Description */}
              <motion.div 
                style={{
                  fontSize: isMobile ? '14px' : '16px',
                  lineHeight: '1.6',
                  color: '#bdc3c7',
                  margin: '0 0 24px 0',
                  whiteSpace: 'pre-wrap'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div 
                  style={{
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    color: '#bdc3c7',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: (safeProduct.product_details || safeProduct.description || '')
                      .replace(/\n/g, '<br/>')
                      .replace(/✅/g, '✅ ')
                      .replace(/✨/g, '✨ ')
                  }} 
                />
              </motion.div>
              
              {/* B2B Features Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '24px',
                padding: '16px',
                background: '#222',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiTag style={{ color: '#3498db', fontSize: '18px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#95a5a6' }}>MOQ</div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{safeProduct.moq} units</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiTag style={{ color: '#3498db', fontSize: '18px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#95a5a6' }}>Bulk Discount</div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{safeProduct.bulk_discount || 'N/A'}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiTruck style={{ color: '#3498db', fontSize: '18px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#95a5a6' }}>Shipping</div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{safeProduct.shipping_info || 'N/A'}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiShield style={{ color: '#3498db', fontSize: '18px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#95a5a6' }}>Warranty</div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{safeProduct.warranty || 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              {/* Size Selection - Always show Customizable */}
              <div style={{
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0 0 12px 0',
                  color: '#fff'
                }}>Size / Color</h3>
                
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <motion.button
                    style={{
                      padding: '8px 16px',
                      background: '#3498db',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Customizable
                    <motion.span 
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#fff',
                        color: '#3498db',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <FiCheck />
                    </motion.span>
                  </motion.button>
                </div>
              </div>
              
              {/* Quantity Selector */}
              <div style={{
                marginBottom: '32px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0 0 12px 0',
                  color: '#fff'
                }}>Quantity</h3>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <motion.div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                    whileHover={{ boxShadow: '0 0 0 2px rgba(52, 152, 219, 0.5)' }}
                  >
                    <button
                      onClick={() => setQuantity(prev => Math.max(safeProduct.moq, prev - 1))}
                      style={{
                        width: '40px',
                        height: '40px',
                        background: '#333',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff'
                      }}
                      disabled={quantity <= safeProduct.moq}
                    >
                      <FiMinus />
                    </button>
                    
                    <span style={{
                      width: '50px',
                      textAlign: 'center',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#fff'
                    }}>
                      {quantity}
                    </span>
                    
                    <button
                      onClick={() => setQuantity(prev => prev + 1)}
                      style={{
                        width: '40px',
                        height: '40px',
                        background: '#333',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff'
                      }}
                    >
                      <FiPlus />
                    </button>
                  </motion.div>
                  
                  <span style={{
                    fontSize: '14px',
                    color: '#95a5a6'
                  }}>
                    Minimum order: {safeProduct.moq} units
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '32px'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  flexDirection: 'row'
                }}>
                  <motion.button
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#fff',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={handleAddToCart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isAddedToCart}
                  >
                    {isAddedToCart ? (
                      <>
                        <FiCheck style={{ fontSize: '18px' }} />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <FiShoppingCart style={{ fontSize: '15px' }} />
                        Add to Cart
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={handleBuyNow}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiMessageCircle style={{ fontSize: '15px' }} />
                    Inquiry
                  </motion.button>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '16px'
                }}>
                  <motion.button
                    style={{
                      width: '50px',
                      background: '#333',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={toggleWishlist}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiHeart style={{ 
                      fontSize: '20px', 
                      color: isWishlisted ? '#e74c3c' : '#e74c3c',
                      fill: isWishlisted ? '#e74c3c' : 'none'
                    }} />
                  </motion.button>
                  
                  <div style={{ position: 'relative' }} ref={shareButtonRef}>
                    <motion.button
                      style={{
                        width: '50px',
                        background: '#333',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={toggleShareOptions}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FiShare2 style={{ fontSize: '20px', color: '#fff' }} />
                    </motion.button>
                    
                    {/* Share Options Dropdown */}
                    {showShareOptions && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: 'absolute',
                          bottom: '60px',
                          left: 0,
                          backgroundColor: '#333',
                          borderRadius: '8px',
                          padding: '10px',
                          zIndex: 20,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          minWidth: '200px'
                        }}
                      >
                        <motion.button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                          whileHover={{ backgroundColor: '#444' }}
                          onClick={copyProductLink}
                        >
                          <FiCopy style={{ fontSize: '16px' }} />
                          Copy Product Link
                        </motion.button>
                        
                        <motion.button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                          whileHover={{ backgroundColor: '#444' }}
                          onClick={() => {
                            const link = getProductLink();
                            window.open(link, '_blank');
                            setShowShareOptions(false);
                          }}
                        >
                          <FiExternalLink style={{ fontSize: '16px' }} />
                          Open Product Page
                        </motion.button>
                        
                        <motion.button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                          whileHover={{ backgroundColor: '#444' }}
                          onClick={shareViaEmail}
                        >
                          <FiMail style={{ fontSize: '16px' }} />
                          Share via Email
                        </motion.button>
                        
                        <motion.button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                          whileHover={{ backgroundColor: '#444' }}
                          onClick={shareViaWhatsApp}
                        >
                          <FiMessageSquare style={{ fontSize: '16px' }} />
                          Share via WhatsApp
                        </motion.button>
                        
                        <motion.button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                          whileHover={{ backgroundColor: '#444' }}
                          onClick={shareViaFacebook}
                        >
                          <FiFacebook style={{ fontSize: '16px' }} />
                          Share on Facebook
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Product Info Tabs */}
              <div style={{
                marginBottom: '24px',
                borderBottom: '1px solid #333'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '16px'
                }}>
                  <button
                    style={{
                      padding: '12px 0',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'details' ? '2px solid #3498db' : '2px solid transparent',
                      color: activeTab === 'details' ? '#3498db' : '#95a5a6',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setActiveTab('details')}
                  >
                    Details
                  </button>
                  
                  <button
                    style={{
                      padding: '12px 0',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'specs' ? '2px solid #3498db' : '2px solid transparent',
                      color: activeTab === 'specs' ? '#3498db' : '#95a5a6',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setActiveTab('specs')}
                  >
                    Specifications
                  </button>

                  <button
                    style={{
                      padding: '12px 0',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'custom' ? '2px solid #3498db' : '2px solid transparent',
                      color: activeTab === 'custom' ? '#3498db' : '#95a5a6',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setActiveTab('custom')}
                  >
                    Customization
                  </button>
                </div>
              </div>
              
              {/* Tab Content */}
              <div style={{
                marginBottom: '24px'
              }}>
                {activeTab === 'details' ? (
                  <div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: '0 0 12px 0',
                      color: '#fff'
                    }}>Product Features</h4>
                    
                    <ul style={{
                      margin: '0 0 24px 0',
                      paddingLeft: '20px'
                    }}>
                      {safeProduct.features.map((feature, index) => (
                        <motion.li 
                          key={index}
                          style={{
                            fontSize: '14px',
                            color: '#bdc3c7',
                            marginBottom: '8px',
                            lineHeight: '1.5'
                          }}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                      gap: '16px',
                      marginBottom: '24px'
                    }}>
                      <div>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#95a5a6'
                        }}>Material</span>
                        <p style={{
                          fontSize: '14px',
                          margin: '4px 0 0 0',
                          color: '#fff'
                        }}>{safeProduct.material || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#95a5a6'
                        }}>Care Instructions</span>
                        <p style={{
                          fontSize: '14px',
                          margin: '4px 0 0 0',
                          color: '#fff'
                        }}>{safeProduct.care_instructions || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Additional Information Section */}
                    <div style={{
                      marginTop: '30px',
                      padding: '0px',
                      background: '#222',
                      borderRadius: '8px',
                      textAlign:'justify',
                    }}>
                      <h4 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0 0 12px 0',
                        textAlign: 'justify',
                        color: '#fff'
                      }}>Wholesale Clothing: Your One-Stop Source for Top Quality Apparel</h4>
                      
                      <p style={{
                        fontSize: '15px',
                        color: '#bdc3c7',
                        lineHeight: '1.4',
                        textAlign: 'justify',
                        margin: '0'
                      }}>
                        If you're looking for the best deals on wholesale apparel, including A4 shirts wholesale, acid wash t-shirts, and premium brands like American Apparel wholesale, then you've come to the right place. Our extensive selection of wholesale clothing is designed to meet the needs of retailers, e-commerce sellers, and boutique owners. Whether you're sourcing athletic wear, eco-friendly bamboo t-shirts, or the trendiest acid washed sweatshirts, we offer everything you need to build a successful clothing business.
                      </p>
                    </div>
                  </div>
                ) : activeTab === 'specs' ? (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                      gap: '16px',
                      marginBottom: '24px'
                    }}>
                      <div>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#95a5a6'
                        }}>Category</span>
                        <p style={{
                          fontSize: '14px',
                          margin: '4px 0 0 0',
                          color: '#fff'
                        }}>{safeProduct.category || 'N/A'} / {safeProduct.subcategory || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#95a5a6'
                        }}>SKU</span>
                        <p style={{
                          fontSize: '14px',
                          margin: '4px 0 0 0',
                          color: '#fff'
                        }}>{safeProduct.sku || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#95a5a6'
                        }}>Minimum Order</span>
                        <p style={{
                          fontSize: '14px',
                          margin: '4px 0 0 0',
                          color: '#fff'
                        }}>{safeProduct.moq} units</p>
                      </div>
                      
                      <div>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#95a5a6'
                        }}>Bulk Discount</span>
                        <p style={{
                          fontSize: '14px',
                          margin: '4px 0 0 0',
                          color: '#fff'
                        }}>{safeProduct.bulk_discount || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Additional Information Section */}
                    <div style={{
                      marginTop: '30px',
                      padding: '0px',
                      background: '#222',
                      textAlign: 'justify',

                      borderRadius: '8px'
                    }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        margin: '0 0 12px 0',
                        color: '#fff'
                      }}>Wholesale Clothing: Your One-Stop Source for Top Quality Apparel</h4>
                      
                      <p style={{
                        fontSize: '14px',
                        color: '#bdc3c7',
                        lineHeight: '1.6',
                        margin: '0'
                      }}>
                        If you're looking for the best deals on wholesale apparel, including A4 shirts wholesale, acid wash t-shirts, and premium brands like American Apparel wholesale, then you've come to the right place. Our extensive selection of wholesale clothing is designed to meet the needs of retailers, e-commerce sellers, and boutique owners. Whether you're sourcing athletic wear, eco-friendly bamboo t-shirts, or the trendiest acid washed sweatshirts, we offer everything you need to build a successful clothing business.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr',
                      gap: '16px',
                      marginBottom: '24px'
                    }}>
                      <div style={{
                        padding: '16px',
                        background: '#222',
                        borderRadius: '8px'
                      }}>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          margin: '0 0 12px 0',
                          color: '#fff'
                        }}>Customization Options</h4>
                        
                        <ul style={{
                          margin: '0',
                          paddingLeft: '20px',
                          listStyleType: 'none'
                        }}>
                          <li style={{
                            fontSize: '14px',
                            color: '#bdc3c7',
                            marginBottom: '8px',
                            lineHeight: '1.6',
                            display: 'flex',
                            alignItems: 'flex-start'
                          }}>
                            <span style={{ marginRight: '8px' }}>•</span>
                            <span>
                              <strong>Sampling:</strong> Ready stock sample can be delivered by same day
                            </span>
                          </li>
                          
                          <li style={{
                            fontSize: '14px',
                            color: '#bdc3c7',
                            marginBottom: '8px',
                            lineHeight: '1.6',
                            display: 'flex',
                            alignItems: 'flex-start'
                          }}>
                            <span style={{ marginRight: '8px' }}>•</span>
                            <span>
                              <strong>Private Label:</strong> We accept private labeling, we can customize the Hangtag, Price tag, Poly, Neck tag label, Care label, Box, and all accessories as per buyer requirements
                            </span>
                          </li>
                          
                          <li style={{
                            fontSize: '14px',
                            color: '#bdc3c7',
                            marginBottom: '8px',
                            lineHeight: '1.6',
                            display: 'flex',
                            alignItems: 'flex-start'
                          }}>
                            <span style={{ marginRight: '8px' }}>•</span>
                            <span>
                              <strong>Shipment:</strong> For Small Quantity DHL, TNT, Aramex, Express delivery, and For Bulk Quantity Air shipment, Sea vessel available
                            </span>
                          </li>
                          
                          <li style={{
                            fontSize: '14px',
                            color: '#bdc3c7',
                            marginBottom: '8px',
                            lineHeight: '1.6',
                            display: 'flex',
                            alignItems: 'flex-start'
                          }}>
                            <span style={{ marginRight: '8px' }}>•</span>
                            <span>
                              <strong>Payment:</strong> For Small quantity T/T, Bank wire (&lt;50,000 pcs) and bulk quantity 100% irrevocable L/C (&gt;50,000 pcs) at Sight
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Additional Information Section */}
                    <div style={{
                      marginTop: '24px',
                      padding: '16px',
                      background: '#222',
                      borderRadius: '8px',
                      textAlign: 'justify',
                    }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        margin: '0 0 12px 0',
                        color: '#fff'
                      }}>Wholesale Clothing: Your One-Stop Source for Top Quality Apparel</h4>
                      
                      <p style={{
                        fontSize: '14px',
                        color: '#bdc3c7',
                        lineHeight: '1.6',
                        margin: '0'
                      }}>
                        If you're looking for the best deals on wholesale apparel, including A4 shirts wholesale, acid wash t-shirts, and premium brands like American Apparel wholesale, then you've come to the right place. Our extensive selection of wholesale clothing is designed to meet the needs of retailers, e-commerce sellers, and boutique owners. Whether you're sourcing athletic wear, eco-friendly bamboo t-shirts, or the trendiest acid washed sweatshirts, we offer everything you need to build a successful clothing business.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Related Products - Maximum 6 products */}
              {finalRelatedProducts.length > 0 && (
                <div style={{
                  marginTop: '40px',
                  borderTop: '1px solid #333',
                  paddingTop: '24px'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    margin: '0 0 24px 0',
                    color: '#fff'
                  }}>Related Products ({finalRelatedProducts.length})</h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '16px'
                  }}>
                    {finalRelatedProducts.slice(0, 6).map(relatedProduct => { // Ensure max 6 products
                      const safeRelatedProduct = {
                        product_photos: [],
                        min_price: 0,
                        max_price: 0,
                        ...relatedProduct
                      };
                      
                      // Related product price display
                      const relatedMin = parseFloat(
                        safeRelatedProduct.min_price ?? safeRelatedProduct.discounted_price ?? safeRelatedProduct.price ?? 0
                      );
                      const relatedMax = parseFloat(
                        safeRelatedProduct.max_price ?? safeRelatedProduct.price ?? relatedMin ?? 0
                      );
                      const relatedDiscount = parseFloat(safeRelatedProduct.discounted_price ?? '');
                      const validRelatedMin = Number.isFinite(relatedMin) ? relatedMin : 0;
                      const validRelatedMax = Number.isFinite(relatedMax) ? (Number.isFinite(relatedMax) ? relatedMax : validRelatedMin) : validRelatedMin;
                      const hasPriceRange = Number.isFinite(relatedMin) && Number.isFinite(relatedMax) && validRelatedMin !== validRelatedMax;
                      const displayMinPrice = validRelatedMin;
                      const displayMaxPrice = validRelatedMax;
                      
                      return (
                        <motion.div
                          key={relatedProduct.id}
                          style={{
                            background: '#222',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => handleRelatedProductClick(relatedProduct)}
                          whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '150px',
                            overflow: 'hidden'
                          }}>
                            {safeRelatedProduct.product_photos.length > 0 ? (
                              <img 
                                src={getImageUrl(safeRelatedProduct.product_photos[0])} 
                                alt={safeRelatedProduct.product_name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  e.target.src = ''; // Clear the broken image
                                  e.target.style.backgroundColor = '#333';
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#333',
                                color: '#fff'
                              }}>
                                <FiImage size={24} />
                              </div>
                            )}
                          </div>
                          
                          <div style={{
                            padding: '12px'
                          }}>
                            <h4 style={{
                              margin: '0 0 4px 0',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#fff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{safeRelatedProduct.product_name}</h4>
                            
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '700',
                                background: hasPriceRange || safeRelatedProduct.discounted_price 
                                  ? 'linear-gradient(90deg, #FFD700, #FFA500, #FF8C00)' 
                                  : 'none',
                                WebkitBackgroundClip: hasPriceRange || safeRelatedProduct.discounted_price ? 'text' : 'unset',
                                WebkitTextFillColor: hasPriceRange || safeRelatedProduct.discounted_price ? 'transparent' : 'white',
                                display: 'inline-block'
                              }}>
                                {hasPriceRange 
                                  ? `$${displayMinPrice.toFixed(2)} - $${displayMaxPrice.toFixed(2)}`
                                  : `$${displayMinPrice.toFixed(2)}`
                                }
                              </span>
                              
                              {Number.isFinite(relatedDiscount) && !hasPriceRange && (
                                <span style={{
                                  fontSize: '12px',
                                  color: '#95a5a6',
                                  textDecoration: 'line-through'
                                }}>
                                  ${relatedDiscount.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Notification */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 25 }}
              style={{
                position: 'fixed',
                left: '50%',
                bottom: '30px',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                maxWidth: '90%',
                width: 'auto'
              }}
            >
              <div style={{
                background: 'rgba(76, 175, 80, 0.2)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FiCheck style={{ 
                  color: '#4CAF50', 
                  fontSize: '20px' 
                }} />
              </div>
              <div>
                <div style={{ 
                  fontWeight: '600',
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>
                  Added to Cart
                </div>
                <div style={{ 
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  {notificationMessage}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductModal;