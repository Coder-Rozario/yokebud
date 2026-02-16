import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiStar, FiShoppingCart, FiPlus, FiMinus, FiCheck, FiChevronRight, FiExternalLink, FiImage } from 'react-icons/fi';
import ProductModal from '../components/ProductModal';
import Slider from '../components/Slider';
import '../pages/styles/Home.scss';
import heroImgLogo from '../assades/logo.jpg';
import LoadingAnimation from '../components/LoadingAnimation';
import AOS from 'aos';
import bglogoimg from '../assades/bglogo.png';
import 'aos/dist/aos.css';
import { useCart } from '../pages/context/CartContext';
import MobileNav from '../components/MobileNav';
import { FaSlidersH, FaTimes, FaArrowLeft, FaTshirt, FaRuler, FaPalette, FaTags, FaLayerGroup, FaSearch } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Helmet } from "react-helmet-async";


const heroBg = heroImgLogo;
const menBg = 'https://images.unsplash.com/photo-1617137968427-85924c800a22?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
const womenBg = 'https://images.pexels.com/photos/974911/pexels-photo-974911.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';
const kidsBg = 'https://images.unsplash.com/photo-1604467794349-0b74285de7e7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const newArrivalsBg = 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';
const bestSellersBg = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';

// Custom hook for window size with debounce
const useWindowSize = (debounceMs = 100) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    let timeoutId = null;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  return windowSize;
};

// Custom hook for data fetching with caching and error handling
const useProductsData = (processProductData) => {
  const [products, setProducts] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchProducts = async () => {
      setIsFetching(true);
      try {
        const cachedProducts = localStorage.getItem('cachedHomeProducts');
        const cacheTimestamp = localStorage.getItem('cachedHomeTimestamp');
        const isCacheValid = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < 300000;
        
        if (cachedProducts && isCacheValid) {
          setProducts(JSON.parse(cachedProducts));
          setIsFetching(false);
          return;
        }
        
        const response = await fetch('https://api.yokebud.com/api/products', {
          signal: abortController.signal
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        const processedData = processProductData(data);
        
        localStorage.setItem('cachedHomeProducts', JSON.stringify(processedData));
        localStorage.setItem('cachedHomeTimestamp', Date.now().toString());
        
        setProducts(processedData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          toast.error(`Failed to load products: ${err.message}`);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsFetching(false);
        }
      }
    };

    fetchProducts();
    
    return () => {
      abortController.abort();
    };
  }, [processProductData]);

  return { products, isFetching, error };
};

// Price display logic for all frontend components - ALWAYS show price range
const renderPrice = (product, isSmallScreen, isMobile) => {
  // Always show price range, even if min_price and max_price are the same
  const minPrice = product.min_price || product.price || 0;
  const maxPrice = product.max_price || product.price || 0;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{
        fontSize: isSmallScreen ? '12px' : isMobile ? '14px' : '16px',
        fontWeight: '700',
        background: 'linear-gradient(90deg, #FFD700, #FFA500, #FF8C00)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        display: 'inline-block'
      }}>
        ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
      </span>
    </div>
  );
};

// Skeleton loading component
const SkeletonProductCard = ({ isMobile, isSmallScreen }) => (
  <div 
    className="product-card"
    style={{
      background: '#1a1a1a',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      position: 'relative',
      border: '1px solid #333',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      width: isSmallScreen ? 'calc(50vw - 20px)' : '280px',
      margin: isSmallScreen ? '0 0 10px 0' : '6px',
    }}
  >        
    {/* Skeleton Image */}
    <div style={{
      position: 'relative',
      width: '100%',
      height: '0',
      paddingBottom: '100%',
      overflow: 'hidden',
      flexShrink: 0,
      backgroundColor: '#2a2a2a',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s infinite linear',
      }} />
    </div>
    
    {/* Skeleton Info */}
    <div style={{
      padding: isSmallScreen ? '8px' : '12px',
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1
    }}>
      <div style={{
        width: '100%',
        height: isSmallScreen ? '20px' : '24px',
        marginBottom: '8px',
        background: '#2a2a2a',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%)',
          backgroundSize: '200% 100%',
          animation: 'skeletonShimmer 1.5s infinite linear',
        }} />
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{
          width: '60px',
          height: isSmallScreen ? '12px' : '16px',
          background: '#2a2a2a',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonShimmer 1.5s infinite linear',
          }} />
        </div>
        
        <div style={{
          width: '40px',
          height: isSmallScreen ? '10px' : '12px',
          background: '#2a2a2a',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonShimmer 1.5s infinite linear',
          }} />
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{
          width: '80px',
          height: isSmallScreen ? '8px' : '10px',
          background: '#2a2a2a',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonShimmer 1.5s infinite linear',
        }} />
        </div>
        
        <div style={{
          width: '50px',
          height: isSmallScreen ? '8px' : '10px',
          background: '#2a2a2a',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonShimmer 1.5s infinite linear',
          }} />
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto'
      }}>
        <div style={{
          width: '40px',
          height: isSmallScreen ? '8px' : '10px',
          background: '#2a2a2a',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonShimmer 1.5s infinite linear',
          }} />
        </div>
        
        <div style={{
          width: '100px',
          height: isSmallScreen ? '8px' : '10px',
          background: '#2a2a2a',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonShimmer 1.5s infinite linear',
          }} />
        </div>
      </div>
    </div>
  </div>
);

// Memoized product card component with lazy loading - UPDATED to always show price range
const ProductCard = React.memo(({ product, onClick, isMobile, isSmallScreen, nameWidths, addToCartWithNotification }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showAddToCart, setShowAddToCart] = useState(false);
  const [quantity, setQuantity] = useState(product.moq || 1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [inView, setInView] = useState(false);
  const cardRef = useRef();
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);
  
  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCartWithNotification(product, quantity);
    setShowAddToCart(false);
  };

  const toggleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <motion.div 
      ref={cardRef}
      className="product-card"
      data-aos="fade-up"
      data-aos-delay={Math.random() * 100}
      onClick={() => onClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowAddToCart(false);
      }}
      style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        position: 'relative',
        border: '1px solid #333',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width: isSmallScreen ? 'calc(50vw - 20px)' : isMobile ? 'calc(50vw - 24px)' : '280px',
        margin: isSmallScreen ? '0 0 10px 0' : '6px',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)'
      }}
    >
      {/* Product Image */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '0',
        paddingBottom: '100%',
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: '#000'
      }}>
        {/* Image loading animation */}
        {imageLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#2a2a2a',
              zIndex: 1
            }}
          >
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { 
                  repeat: Infinity, 
                  duration: 1.5, 
                  ease: "linear" 
                },
                scale: {
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeInOut"
                }
              }}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 165, 0, 0.3)',
                borderTop: '2px solid #FFA500',
              }}
            />
          </motion.div>
        )}
        
        {/* Product Tags */}
        <div 
          style={{
            position: 'absolute',
            bottom:'0px',
            left: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            zIndex: 2,
            maxWidth: 'calc(100% - 16px)',
            paddingBottom: isSmallScreen ? '10px' : '5px'
          }}>
          {product.tags?.map((tag, index) => (
            <div 
              key={index} 
              data-aos="fade-right"
              data-aos-delay={index * 100 + 200}
              style={{
                padding: '2px 6px',
                background: 
                  tag === 'NEW' ? 'linear-gradient(90deg, #6dd5fa, #3498db)' :
                  tag === 'SALE' ? 'linear-gradient(90deg, #ff6a6a, #e74c3c)' :
                  tag === 'BESTSELLER' ? 'linear-gradient(90deg, #f9d423, #f39c12)' :
                  tag === 'ECO-FRIENDLY' ? 'linear-gradient(90deg, #2ecc71, #27ae60)' :
                  'linear-gradient(90deg, #4b6cb7, #2c3e50)',
                borderRadius: '4px',
                fontSize: isSmallScreen ? '8px' : '10px',
                fontWeight: '700',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'inline-block',
                whiteSpace: 'nowrap'
              }}>
              {tag}
            </div>
          ))}
        </div>
        
        {inView && !imageError && product.firstImage ? (
          <>
            <motion.img 
              src={product.firstImage} 
              alt={product.product_name}
              initial={{ scale: 1 }}
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                opacity: imageLoading ? 0 : 1,
                transition: 'opacity 0.3s ease'
              }}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          </>
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 165, 0, 0.1)',
            color: '#FFA500',
            zIndex: 2
          }}>
            <FiImage size={24} />
          </div>
        )}
        
        {/* Wishlist Button */}
        <motion.div
          whileTap={{ scale: 0.9 }}
          onClick={toggleFavorite}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '50%',
            width: isSmallScreen ? '24px' : '28px',
            height: isSmallScreen ? '24px' : '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 3,
            cursor: 'pointer'
          }}
        >
          <FiHeart style={{ 
            color: isFavorite ? '#FFD700' : 'white', 
            fontSize: isSmallScreen ? '12px' : '14px',
            transition: 'color 0.3s ease',
            fill: isFavorite ? '#FFD700' : 'transparent'
          }} />
        </motion.div>
        
        {/* Add to Cart Overlay */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              padding: isSmallScreen ? '8px' : '12px',
              zIndex: 5
            }}
          >
            {showAddToCart ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuantity(prev => Math.max(product.moq || 1, prev - 1));
                    }}
                    style={{
                      width: isSmallScreen ? '24px' : '28px',
                      height: isSmallScreen ? '24px' : '28px',
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <FiMinus />
                  </motion.button>
                  
                  <span style={{
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: isSmallScreen ? '10px' : '12px'
                  }}>
                    {quantity}
                  </span>
                  
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuantity(prev => prev + 1);
                    }}
                    style={{
                      width: isSmallScreen ? '24px' : '28px',
                      height: isSmallScreen ? '24px' : '28px',
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <FiPlus />
                  </motion.button>
                </div>
                
                <motion.button
                  whileHover={{ 
                    background: 'linear-gradient(90deg, #FFD700, #FFA500, #FF8C00)',
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.6)',
                    transition: { duration: 0.3 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToCart}
                  style={{
                    width: '100%',
                    padding: isSmallScreen ? '6px' : '8px',
                    background: 'linear-gradient(90deg, #FFC600, #FF8C00)',
                    color: '#111',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: isSmallScreen ? '10px' : '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                  }}
                >
                  <FiShoppingCart size={isSmallScreen ? 12 : 14} />
                  Add 
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                whileHover={{ 
                    background: 'linear-gradient(90deg, #FFD700, #FFA500, #FF8C00)',
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.6)',
                    transition: { duration: 0.3 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddToCart(true);
                  }}
                  style={{
                    width: '100%',
                    padding: isSmallScreen ? '6px' : '8px',
                    background: 'linear-gradient(90deg, #FFC600, #FF8C00)',
                    color: '#111',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: isSmallScreen ? '10px' : '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                  }}
                >
                  <FiShoppingCart size={isSmallScreen ? 12 : 14} />
                  Add to Cart
                </motion.button>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Product Info */}
      <div style={{
        padding: isSmallScreen ? '8px' : '12px',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1
      }}>
        <div style={{
          width: '100%',
          height: isSmallScreen ? '20px' : '24px',
          overflow: 'hidden',
          marginBottom: '4px',
          position: 'relative'
        }}>
          <div 
            id={`name-${product.id}`}
            style={{
              position: 'absolute',
              whiteSpace: 'nowrap',
              fontSize: isSmallScreen ? '12px' : isMobile ? '14px' : '16px',
              fontWeight: '600',
              color: '#fff',
              animation: nameWidths[product.id] ? 'marquee 10s linear infinite' : 'none',
              paddingLeft: nameWidths[product.id] ? '100%' : '0',
              willChange: 'transform'
            }}
          >
            {product.product_name}
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* ALWAYS show price range using the renderPrice function */}
            {renderPrice(product, isSmallScreen, isMobile)}
          </div>
          
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '2px'
          }}>
            <FiStar style={{ 
              color: '#f1c40f', 
              fontSize: isSmallScreen ? '10px' : '12px' 
            }} />
            <span style={{ 
              fontSize: isSmallScreen ? '10px' : '12px', 
              color: '#fff'
            }}>{product.rating || '4.5'}</span>
            <span style={{ 
              fontSize: isSmallScreen ? '8px' : '10px', 
              color: '#95a5a6'
            }}>({product.reviews || '0'})</span>
          </div>
        </div>
        
        {/* Category Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isSmallScreen ? '4px' : '8px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              fontSize: isSmallScreen ? '8px' : '10px',
              color: '#7f8c8d',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              {product.category}
            </span>
            {product.subcategory && (
              <span style={{
                fontSize: isSmallScreen ? '8px' : '10px',
                color: '#95a5a6'
              }}>
                / {product.subcategory}
              </span>
            )}
          </div>
                    <div style={{
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: isSmallScreen ? '8px' : '10px',
            fontWeight: '500',
            color: '#fff',
            // width: isSmallScreen ? '40%' : '35%'
          }}>
            MOQ: {product.moq || 1}
          </div>

        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto'
        }}>

          
          <span style={{
            fontSize: isSmallScreen ? '8px' : '10px',
            color: '#95a5a6',
            fontStyle: 'italic'
          }}>
            {product.shipping_info || 'Free shipping on orders over $50'}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

// Category Section Component
const CategorySection = ({ title, products, bgImage, isMobile, isSmallScreen, nameWidths, addToCartWithNotification, handleFilter, initialProductsCount, setSelectedProduct }) => {
  const hasMoreProducts = products.length > initialProductsCount;
  
  return (
    <div 
      className="category-section" 
      data-aos="fade-up"
      data-aos-duration="800"
      style={{
        margin: isSmallScreen ? '16px 0' : '40px 0',
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        height: 'fit-content',
        boxShadow: '0 15px 30px rgba(0,0,0,0.3)',
      }}
    >
      <div 
        data-aos="zoom-out"
        data-aos-duration="1000"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: isSmallScreen ? 'scroll' : 'fixed',
          zIndex: 0,
          filter: 'brightness(0.7)',
          transition: 'transform 0.5s ease, filter 0.5s ease'
        }} 
      />
      
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(45deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)',
        zIndex: 1
      }} />
      
      <div style={{
        position: 'relative',
        zIndex: 2,
        padding: isSmallScreen ? '16px 8px' : '40px 20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isSmallScreen ? '12px' : '30px',
          paddingBottom: '15px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <motion.h2 
            data-aos="fade-right"
            data-aos-delay="200"
            style={{
              color: '#fff',
              fontSize: isSmallScreen ? '20px' : '32px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              margin: 0,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            {title}
          </motion.h2>
          
          {hasMoreProducts && (
            <motion.div
              data-aos="fade-left"
              data-aos-delay="300"
            >
              <Link to="#" onClick={() => handleFilter(title)} style={{
                display: 'flex',
                alignItems: 'center',
                color: '#FFD700',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: isSmallScreen ? '12px' : '16px',
                transition: 'all 0.3s ease',
                padding: isSmallScreen ? '6px 10px' : '10px 20px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '50px',
                border: '2px solid #FFD700'
              }}>
                View All <FiChevronRight style={{ marginLeft: '5px' }} />
              </Link>
            </motion.div>
          )}
        </div>
        
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: isSmallScreen ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: isSmallScreen ? '8px' : '20px',
            padding: isSmallScreen ? '4px' : '10px',
            marginTop: 'auto'
          }}
        >
          {products.slice(0, initialProductsCount).map((product, index) => (
            <div 
              key={product.id}
              data-aos="fade-up"
              data-aos-delay={index % 5 * 100}
              style={{
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <ProductCard 
                product={product} 
                onClick={setSelectedProduct}
                isMobile={isMobile}
                isSmallScreen={isSmallScreen}
                nameWidths={nameWidths}
                addToCartWithNotification={addToCartWithNotification}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main component
const Home = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: false,
      mirror: true
    });
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const { width: windowWidth } = useWindowSize();
  
  const isMobile = windowWidth < 992;
  const isSmallScreen = windowWidth < 576;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [nameWidths, setNameWidths] = useState({});
  const [notificationState, setNotificationState] = useState({
    show: false,
    product: null,
    quantity: 1
  });
  
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(true);
  const [initialProductsCount] = useState(20);
  
  const { addToCart } = useCart();
  
  // Memoized product processing function
  const processProductData = useCallback((data) => {
    return data.map(product => {
      let photos = product.product_photos;
      if (typeof photos === 'string') {
        try {
          photos = JSON.parse(photos);
        } catch (e) {
          photos = [];
        }
      }
      
      const processedPhotos = photos.map(photo => {
        if (photo.startsWith('http') || photo.startsWith('https')) {
          return photo;
        }
        return `https://api.yokebud.com${photo.startsWith('/') ? '' : '/'}${photo}`;
      });

      const firstImage = processedPhotos.length > 0 ? processedPhotos[0] : null;

      let tags = product.tags;
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch (e) {
          tags = [];
        }
      }
      tags = tags.map(tag => tag.toUpperCase());

      // Parse categories
      let categories = product.categories;
      if (typeof categories === 'string') {
        try {
          categories = JSON.parse(categories);
        } catch (e) {
          categories = product.category ? [product.category] : [];
        }
      } else if (!Array.isArray(categories) && product.category) {
        categories = [product.category];
      }

      return {
        ...product,
        price: Number(product.price),
        min_price: product.min_price ? Number(product.min_price) : Number(product.price),
        max_price: product.max_price ? Number(product.max_price) : Number(product.price),
        discounted_price: product.discounted_price ? Number(product.discounted_price) : null,
        firstImage: firstImage,
        allImages: processedPhotos,
        colors: typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors,
        sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes,
        tags: tags,
        features: typeof product.features === 'string' ? JSON.parse(product.features) : product.features,
        categories: categories
      };
    });
  }, []);

  // Use custom hooks for data fetching
  const { products, isFetching, error } = useProductsData(processProductData);
  
  // Handle search from Navbar
  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery);
      setFilter('All');
      setShowAll(false);
      
      setTimeout(() => {
        const element = document.getElementById('home_product');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.state]);

  // Measure product name widths after data loads and renders
  useEffect(() => {
    if (!isFetching && !error && products.length > 0) {
      const newNameWidths = {};
      const containerWidth = isSmallScreen ? 120 : isMobile ? 150 : 200;
      
      products.forEach(product => {
        const element = document.getElementById(`name-${product.id}`);
        if (element) {
          const textWidth = element.scrollWidth;
          newNameWidths[product.id] = textWidth > containerWidth;
        }
      });
      
      setNameWidths(newNameWidths);
    }
  }, [isFetching, error, products, isMobile, isSmallScreen]);

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = 
        filter === 'All' || 
        (filter === "Men's Collection" && product.categories.includes('Men')) ||
        (filter === "Women's Collection" && product.categories.includes('Women')) ||
        (filter === "Kids Collection" && product.categories.includes('Kids')) ||
        product.categories.includes(filter);
      
      const matchesSpecialFilter = 
        filter === 'All' ||
        (filter === 'New Arrivals' && product.tags?.includes('NEW')) ||
        (filter === 'Best Sellers' && product.tags?.includes('BESTSELLER')) ||
        (filter === 'SALE' && product.tags?.includes('SALE')) ||
        (filter === 'WINTER' && product.tags?.includes('WINTER')) ||
        (filter === 'SUMMER' && product.tags?.includes('SUMMER')) ||
        (filter === 'LIMITED' && product.tags?.includes('LIMITED')) ||
        (filter === 'Customizeable' && product.tags?.includes('CUSTOMIZEABLE'));
      
      const matchesSearch = 
        searchQuery && (
          product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          product.product_details.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      return (matchesCategory || matchesSpecialFilter) && (searchQuery ? matchesSearch : true);
    });
  }, [products, filter, searchQuery]);

  // Memoized products by category
  const productsByCategory = useMemo(() => ({
    "Men's Collection": products.filter(p => p.categories.includes('Men')),
    "Women's Collection": products.filter(p => p.categories.includes('Women')),
    "Kids Collection": products.filter(p => p.categories.includes('Kids')),
    'New Arrivals': products.filter(p => p.tags?.includes('NEW')),
    'Best Sellers': products.filter(p => p.tags?.includes('BESTSELLER'))
  }), [products]);

  // Add to cart with notification
  const addToCartWithNotification = useCallback((product, quantity) => {
    addToCart({
      ...product,
      image: product.firstImage || ''
    }, quantity);
    
    setNotificationState({
      show: true,
      product,
      quantity
    });
    
    setTimeout(() => {
      setNotificationState(prev => ({ ...prev, show: false }));
    }, 3000);
  }, [addToCart]);

  const performSearch = (query) => {
    setSearchQuery(query);
    setFilter('All');
    setShowAll(false);
    
    setTimeout(() => {
      const element = document.getElementById('home_product');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() === '') return;
    performSearch(searchQuery);
  };

  const handleFilter = (filterType) => {
    setFilter(filterType);
    setShowAll(false);
    setSearchQuery('');
    setTimeout(() => {
      const element = document.getElementById('home_product');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const resetFilter = () => {
    setFilter('All');
    setShowAll(true);
    setSearchQuery('');
    navigate('.', { replace: true, state: {} });
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const tabHover = {
    scale: 1.05,
    boxShadow: "0 8px 20px rgba(255, 215, 0, 0.4)",
    transition: { type: "spring", stiffness: 300 }
  };

  const tabTap = {
    scale: 0.98,
    transition: { duration: 0.2 }
  };

  return (
    <>
      <Helmet>
        <title>Premium B2B Clothing Manufacturer | Yokebud Group Oy</title>
        <meta name="description" content="Yokebud Group Oy - Your trusted B2B partner for high-quality clothing manufacturing, wholesale supply, and private label services with global delivery." />
      </Helmet>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              height: '100vh',
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 1000,
              backdropFilter: 'blur(2px)',
            }} 
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobile && (
          <motion.aside
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              backdropFilter: 'blur(10px)',
              padding: '1rem',
              borderRadius: '0',
              height: '100%',
              boxShadow: '0 4px 30px rgba(255, 165, 0, 0.15)',
              zIndex: 20000000000,
              borderRight: '1px solid rgba(255, 215, 0, 0.1)',
              position: 'fixed',
              top: 0,
              left: 0,
              width: '85%',
              maxWidth: '320px',
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              opacity: sidebarOpen ? 1 : 0,
            }}
            initial={{ x: -320 }}
            animate={{ 
              x: sidebarOpen ? 0 : -320,
              opacity: sidebarOpen ? 1 : 0
            }}
            transition={{ 
              type: 'spring', 
              damping: 25,
              stiffness: 300
            }}
          >
            <motion.button 
              onClick={resetFilter}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 165, 0, 0.5)',
                color: '#FFA500',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
              whileHover={{ 
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
                scale: 1.02
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <FaArrowLeft />
              <span>Reset All Filters</span>
            </motion.button>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {["Men's Collection", "Women's Collection", "Kids Collection",'SALE','WINTER',"New Arrivals", "Best Sellers", 'LIMITED', 'SUMMER', 'Customizeable'].map((item) => (
                <motion.div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: filter === item ? 'rgba(255, 165, 0, 0.15)' : 'transparent',
                    border: filter === item ? '1px solid rgba(255, 165, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: filter === item ? '#FFD700' : 'rgba(255, 255, 255, 0.8)',
                  }}
                  onClick={() => handleFilter(item)}
                  variants={itemVariants}
                  whileHover={{ 
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    borderColor: 'rgba(255, 165, 0, 0.3)',
                    scale: 1.02
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <span style={{ fontSize: '0.9rem' }}>
                    {item}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      <section className="container">
        <section id="Home">
          <div className="slider-with-sidebars">
            {!isMobile && (
              <section className="left-sidebar">
                <motion.ul
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {["Men's Collection", "Women's Collection", "Kids Collection",'SALE','WINTER'].map((item) => (
                    <motion.div
                      key={item}
                      variants={itemVariants}
                      whileHover={tabHover}
                      whileTap={tabTap}
                    >
                      <Link className="filter_btn" id={item} onClick={() => handleFilter(item)} to="#all_products">
                        <li>{item}</li>
                      </Link>
                    </motion.div>
                  ))}
                </motion.ul>
              </section>
            )}
            
            <Slider />
            
            {!isMobile && (
              <section className="right-sidebar">
                <motion.ul
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {['Customizeable',"New Arrivals", "Best Sellers", 'LIMITED', 'SUMMER'].map((item) => (
                    <motion.div
                      key={item}
                      variants={itemVariants}
                      whileHover={tabHover}
                      whileTap={tabTap}
                    >
                      <Link className="filter_btn" id={item} onClick={() => handleFilter(item)} to="#all_products">
                        <li>{item}</li>
                      </Link>
                    </motion.div>
                  ))}
                </motion.ul>
              </section>
            )}
          </div>
          
          <main id="home_product">
            {isFetching ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div />
               <LoadingAnimation />
              </div>
            ) : filter === 'All' && !searchQuery ? (
              <>
                <div 
                  style={{
                    position: 'relative',
                    height: isSmallScreen ? '180px' : '250px',
                    margin: isSmallScreen ? '8px 0' : '10px 0',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  }}
                >
                  <div 
                    style={{
                      position: isSmallScreen ? 'absolute' : 'fixed',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.7)), url(${heroBg})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      zIndex: 0,
                      opacity: 0.9,
                      filter: 'brightness(0.9)',
                      backgroundRepeat: 'no-repeat',
                    }} 
                  />

                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                      color: '#f9f9f9',
                    }}
                  >
                    <motion.h1
                      data-aos="fade-up"
                      data-aos-delay="200"
                      style={{
                        fontSize: isSmallScreen ? '18px' : '50px',
                        fontWeight: '800',
                        marginBottom: isSmallScreen ? '8px' : '18px',
                        textShadow: '0 4px 20px rgba(0,0,0,0.6)',
                        letterSpacing: '1px',
                        background: 'linear-gradient(60deg, #FFD600, #FFA700)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Our Latest Collection
                    </motion.h1>

                    <motion.p
                      data-aos="fade-up"
                      data-aos-delay="400"
                      style={{
                        fontSize: isSmallScreen ? '10px' : '20px',
                        maxWidth: '750px',
                        textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        lineHeight: '1.6',
                        marginBottom: isSmallScreen ? '8px' : '20px',
                        width: '90%',
                      }}
                    >
                      Discover our latest collection designed for retailers and boutiques - a premium blend of style, comfort, and quality.
                    </motion.p>
                  </div>
                </div>
                
                {productsByCategory['New Arrivals'].length > 0 && (
                  <CategorySection 
                    title="New Arrivals" 
                    products={productsByCategory['New Arrivals']} 
                    bgImage={newArrivalsBg}
                    isMobile={isMobile}
                    isSmallScreen={isSmallScreen}
                    nameWidths={nameWidths}
                    addToCartWithNotification={addToCartWithNotification}
                    handleFilter={handleFilter}
                    initialProductsCount={initialProductsCount}
                    setSelectedProduct={setSelectedProduct}
                  />
                )}
                
                {productsByCategory['Best Sellers'].length > 0 && (
                  <CategorySection 
                    title="Best Sellers" 
                    products={productsByCategory['Best Sellers']} 
                    bgImage={bestSellersBg}
                    isMobile={isMobile}
                    isSmallScreen={isSmallScreen}
                    nameWidths={nameWidths}
                    addToCartWithNotification={addToCartWithNotification}
                    handleFilter={handleFilter}
                    initialProductsCount={initialProductsCount}
                    setSelectedProduct={setSelectedProduct}
                  />
                )}
                
                {productsByCategory["Men's Collection"].length > 0 && (
                  <CategorySection 
                    title="Men's Collection" 
                    products={productsByCategory["Men's Collection"]} 
                    bgImage={menBg}
                    isMobile={isMobile}
                    isSmallScreen={isSmallScreen}
                    nameWidths={nameWidths}
                    addToCartWithNotification={addToCartWithNotification}
                    handleFilter={handleFilter}
                    initialProductsCount={initialProductsCount}
                    setSelectedProduct={setSelectedProduct}
                  />
                )}
                
                {productsByCategory["Women's Collection"].length > 0 && (
                  <CategorySection 
                    title="Women's Collection" 
                    products={productsByCategory["Women's Collection"]} 
                    bgImage={womenBg}
                    isMobile={isMobile}
                    isSmallScreen={isSmallScreen}
                    nameWidths={nameWidths}
                    addToCartWithNotification={addToCartWithNotification}
                    handleFilter={handleFilter}
                    initialProductsCount={initialProductsCount}
                    setSelectedProduct={setSelectedProduct}
                  />
                )}
                
                {productsByCategory["Kids Collection"].length > 0 && (
                  <CategorySection 
                    title="Kids Collection" 
                    products={productsByCategory["Kids Collection"]} 
                    bgImage={kidsBg}
                    isMobile={isMobile}
                    isSmallScreen={isSmallScreen}
                    nameWidths={nameWidths}
                    addToCartWithNotification={addToCartWithNotification}
                    handleFilter={handleFilter}
                    initialProductsCount={initialProductsCount}
                    setSelectedProduct={setSelectedProduct}
                  />
                )}
              </>
            ) : (
              <>
                <button onClick={resetFilter} className={`RF ${showAll ? 'hidden' : ''}`}>
                  <i id="refresh" className="fa-solid fa-arrow-left">
                    <label className="RFL" htmlFor="refresh">
                      Back to All
                    </label>
                  </i>
                </button>

                <div 
                  data-aos="fade-in"
                  style={{
                    maxWidth: '1400px',
                    margin: '0px auto',
                    padding: isSmallScreen ? '16px 8px' : '40px 20px',
                    borderRadius: '15px',
                    background: 'black',
                    minHeight: '100vh',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    data-aos="fade-down"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: isSmallScreen ? '16px' : '30px',
                      paddingBottom: '15px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <h2 style={{
                      fontSize: isSmallScreen ? '18px' : '28px',
                      fontWeight: '700',
                      color: '#fff',
                      margin: 0
                    }}>
                      {searchQuery ? `Search Results for "${searchQuery}"` : filter}
                    </h2>
                    
                    <div style={{
                      fontSize: isSmallScreen ? '12px' : '14px',
                      color: '#95a5a6'
                    }}>
                      {filteredProducts.length} products
                    </div>
                  </div>

                  {isFetching ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '200px',
                      color: '#FFA500',
                      position: 'relative',
                      zIndex: 1,
                      flexDirection: 'column',
                      gap: '20px'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid rgba(255, 215, 0, 0.3)',
                        borderTop: '4px solid #FFD700',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <p style={{ color: '#FFD700', fontWeight: '600' }}>Loading Products...</p>
                    </div>
                  ) : error ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '60px 0',
                      position: 'relative',
                      zIndex: 1,
                      color: '#e74c3c'
                    }}>
                      <p>Error loading products: {error}</p>
                      <button
                        onClick={() => window.location.reload()}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(90deg, #FFC500, #FF8C00)',
                          color: 'black',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          marginTop: '20px'
                        }}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    <div 
                      style={{
                        display: 'grid',
                        gridTemplateColumns: isSmallScreen ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: isSmallScreen ? '8px' : '24px',
                        marginBottom: '40px'
                      }}
                    >
                      {filteredProducts.map((product, index) => (
                        <div 
                          key={product.id}
                          data-aos="fade-up"
                          data-aos-delay={index % 5 * 100}
                          style={{
                            display: 'flex',
                            justifyContent: 'center'
                          }}
                        >
                          <ProductCard 
                            product={product} 
                            onClick={setSelectedProduct}
                            isMobile={isMobile}
                            isSmallScreen={isSmallScreen}
                            nameWidths={nameWidths}
                            addToCartWithNotification={addToCartWithNotification}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div 
                      data-aos="fade-up"
                      style={{
                        textAlign: 'center',
                        padding: '60px 0'
                      }}
                    >
                      <h3 style={{
                        fontSize: '20px',
                        color: '#95a5a6',
                        marginBottom: '16px'
                      }}>No products found</h3>
                      <button
                        onClick={resetFilter}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(90deg, #FFC500, #FF8C00)',
                          color: 'black',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {selectedProduct && (
              <ProductModal 
                product={selectedProduct}
                relatedProducts={products.filter(
                  p => p.categories.some(cat => selectedProduct.categories.includes(cat)) && 
                  p.id !== selectedProduct.id
                ).slice(0, 4)}
                onClose={() => setSelectedProduct(null)}
                onRelatedProductClick={(product) => {
                  setSelectedProduct(product);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </main>
        </section>
      </section>

      {isMobile && (
        <MobileNav 
          onCategoryClick={() => setSidebarOpen(true)} 
          onCloseSidebar={handleCloseSidebar}
        />
      )}

      <AnimatePresence>
        {notificationState.show && notificationState.product && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            transition={{ type: 'spring', damping: 25 }}
            style={{
              position: 'fixed',
              left: '50%',
              bottom: isMobile ? '80px' : '30px',
              zIndex: 1000,
              background: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              padding: isSmallScreen ? '12px 16px' : '16px 24px',
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
              width: isSmallScreen ? '28px' : '32px',
              height: isSmallScreen ? '28px' : '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FiCheck style={{ 
                color: '#4CAF50', 
                fontSize: isSmallScreen ? '16px' : '20px' 
              }} />
            </div>
            <div>
              <div style={{ 
                fontWeight: '600',
                fontSize: isSmallScreen ? '14px' : '16px',
                marginBottom: '4px'
              }}>
                Added to Cart
              </div>
              <div style={{ 
                fontSize: isSmallScreen ? '12px' : '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '8px'
              }}>
                {notificationState.quantity} × {notificationState.product.product_name}
              </div>
              <Link 
                to="/cart" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#FFD700',
                  fontSize: isSmallScreen ? '12px' : '14px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setNotificationState(prev => ({ ...prev, show: false }))}
              >
                <span>View Cart</span>
                <FiExternalLink size={14} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
          
          @keyframes skeletonShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default Home;
