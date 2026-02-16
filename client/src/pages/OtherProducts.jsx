import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTh, 
  FaRecycle, 
  FaShoppingBag, 
  FaGem, 
  FaRunning, 
  FaTshirt, 
  FaPalette,
  FaTshirt as FaFashionShirt,
  FaArrowLeft,
  FaSlidersH,
  FaTimes,
  FaTags,
  FaLayerGroup,
  FaTshirt as FaShirt
} from 'react-icons/fa';
import Slider from '@mui/material/Slider';
import { FiHeart, FiStar, FiShoppingCart, FiPlus, FiMinus, FiCheck, FiExternalLink, FiImage } from 'react-icons/fi';
import ProductModal from '../components/ProductModal';
import bglogoimg from '../assades/bglogo.png';
import { useCart } from '../pages/context/CartContext';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import MobileNav from '../components/MobileNav';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
        const cachedProducts = localStorage.getItem('cachedAccessoriesProducts');
        const cacheTimestamp = localStorage.getItem('cachedAccessoriesTimestamp');
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
        
        localStorage.setItem('cachedAccessoriesProducts', JSON.stringify(processedData));
        localStorage.setItem('cachedAccessoriesTimestamp', Date.now().toString());
        
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

// Custom hook for categories fetching
const useCategoriesData = () => {
  const [availableCategories, setAvailableCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await fetch('https://api.yokebud.com/api/subcategories', {
          signal: abortController.signal
        });
        
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        
        const accessoriesCategories = data.Accessories || [];
        setAvailableCategories(['All', ...accessoriesCategories]);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching categories:', err);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();
    
    return () => {
      abortController.abort();
    };
  }, []);

  return { availableCategories, categoriesLoading };
};

// Custom hook for filters with URL persistence
const useFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialCategory = searchParams.get('category') || 'All';
  const initialMinPrice = parseInt(searchParams.get('minPrice')) || 0;
  const initialMaxPrice = parseInt(searchParams.get('maxPrice')) || 500;
  const initialSearch = searchParams.get('search') || '';
  
  const [category, setCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState([initialMinPrice, initialMaxPrice]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (category !== 'All') params.set('category', category);
    if (priceRange[0] !== 0) params.set('minPrice', priceRange[0]);
    if (priceRange[1] !== 500) params.set('maxPrice', priceRange[1]);
    if (searchQuery) params.set('search', searchQuery);
    
    setSearchParams(params, { replace: true });
  }, [category, priceRange, searchQuery, setSearchParams]);
  
  const resetFilter = useCallback(() => {
    setCategory('All');
    setPriceRange([0, 500]);
    setSearchQuery('');
  }, []);
  
  const handlePriceChange = useCallback((event, newValue) => {
    setPriceRange(newValue);
  }, []);
  
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);
  
  const handleCategoryChange = useCallback((categoryType) => {
    setCategory(categoryType);
  }, []);
  
  return {
    category,
    priceRange,
    searchQuery,
    resetFilter,
    handlePriceChange,
    handleSearchChange,
    handleCategoryChange
  };
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

// Memoized product card component with lazy loading
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
      onClick={onClick}
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
                  {/* (${((product.discounted_price || product.min_price || product.price) * quantity).toFixed(2)}) */}
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

// Skeleton loading component
const SkeletonLoader = ({ isMobile, isSmallScreen }) => (
  <motion.div 
    layout
    style={{
      display: 'grid',
      gridTemplateColumns: isSmallScreen ? 'repeat(2, 1fr)' : isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: isSmallScreen ? '10px' : '12px',
      marginBottom: '40px',
      position: 'relative',
      zIndex: 1
    }}
  >
    {Array.from({ length: 8 }).map((_, index) => (
      <div 
        key={index}
        style={{
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            position: 'relative',
            border: '1px solid #333',
            height: '380px',
            display: 'flex',
            flexDirection: 'column',
            width: isSmallScreen ? 'calc(50vw - 20px)' : isMobile ? 'calc(50vw - 24px)' : '280px',
            margin: isSmallScreen ? '0 0 10px 0' : '6px',
          }}
        >
          <div style={{
            position: 'relative',
            width: '100%',
            height: '0',
            paddingBottom: '100%',
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: '#2a2a2a'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #2a2a2a 0%, #333 50%, #2a2a2a 100%)',
              backgroundSize: '200% 100%',
              animation: 'loading 1.5s infinite'
            }} />
          </div>
          
          <div style={{
            padding: isSmallScreen ? '8px' : '12px',
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1
          }}>
            <div style={{
              width: '80%',
              height: '20px',
              backgroundColor: '#333',
              borderRadius: '4px',
              marginBottom: '10px',
              animation: 'loading 1.5s infinite'
            }} />
            
            <div style={{
              width: '50%',
              height: '16px',
              backgroundColor: '#333',
              borderRadius: '4px',
              marginBottom: '15px',
              animation: 'loading 1.5s infinite',
              animationDelay: '0.2s'
            }} />
            
            <div style={{
              width: '40%',
              height: '14px',
              backgroundColor: '#333',
              borderRadius: '4px',
              marginBottom: '15px',
              animation: 'loading 1.5s infinite',
              animationDelay: '0.4s'
            }} />
          </div>
        </div>
      </div>
    ))}
  </motion.div>
);

// Category loading skeleton
const CategorySkeleton = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  }}>
    {Array.from({ length: 6 }).map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0.5 }}
        animate={{ 
          opacity: [0.5, 0.8, 0.5],
          transition: { 
            duration: 1.5, 
            repeat: Infinity,
            delay: index * 0.1
          }
        }}
        style={{
          padding: '0.75rem 1rem',
          marginBottom: '0.5rem',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          height: '20px'
        }}
      />
    ))}
  </div>
);

// Fetching animation component
const FetchingAnimation = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '300px',
      width: '100%',
      position: 'relative',
      zIndex: 1
    }}
  >
    <motion.div
      animate={{ 
        rotate: 360,
        scale: [1, 1.2, 1]
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
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: '3px solid rgba(255, 165, 0, 0.3)',
        borderTop: '3px solid #FFA500',
        marginBottom: '20px'
      }}
    />
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        color: '#FFA500',
        fontSize: '18px',
        fontWeight: '600',
        textAlign: 'center',
        margin: 0
      }}
    >
      Fetching Latest Products...
    </motion.p>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      transition={{ delay: 0.4 }}
      style={{
        color: '#95a5a6',
        fontSize: '14px',
        textAlign: 'center',
        margin: '10px 0 0 0'
      }}
    >
      This will just take a moment
    </motion.p>
  </motion.div>
);

// Main component
const OtherProducts = () => {
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
  
  const { addToCart } = useCart();
  
  // Memoized product processing function
  const processProductData = useCallback((data) => {
    return data.filter(product => 
      product.category === 'Accessories' || 
      ['Jute Bag', 'Cotton Waste', 'Jewellery', 'Cap', 'Socks', 'Others'].includes(product.subcategory)
    ).map(product => {
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
        tags: typeof product.tags === 'string' ? JSON.parse(product.tags) : product.tags,
        features: typeof product.features === 'string' ? JSON.parse(product.features) : product.features
      };
    });
  }, []);

  // Use custom hooks for data fetching
  const { products, isFetching, error } = useProductsData(processProductData);
  const { availableCategories, categoriesLoading } = useCategoriesData();
  
  // Use custom hook for filters
  const {
    category,
    priceRange,
    searchQuery,
    resetFilter,
    handlePriceChange,
    handleSearchChange,
    handleCategoryChange
  } = useFilters();

  // Memoized filtered products - Updated to use min_price for filtering
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = category === 'All' || 
                           (product.category === 'Accessories' && product.subcategory === category) ||
                           (product.category !== 'Accessories' && product.subcategory === category);
      
      // Use min_price for filtering or fallback to price
      const productMinPrice = product.min_price || product.price;
      const matchesPrice = productMinPrice >= priceRange[0] && 
                          productMinPrice <= priceRange[1];
      
      const matchesSearch = searchQuery === '' || 
                          product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.tags && Array.isArray(product.tags) && 
                           product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
      return matchesCategory && matchesPrice && matchesSearch;
    });
  }, [products, category, priceRange, searchQuery]);

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

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  // Animation variants
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

  // Sidebar styles - Updated to match Clothing page style
const sidebarBaseStyle = {
  background: 'rgba(26, 26, 26, 0.95)',
  backdropFilter: 'blur(10px)',
  padding: '1rem',
  borderRadius: isMobile ? '0' : '12px',
  height: isMobile ? '120vh' : 'fit-content',
  boxShadow: '0 4px 30px rgba(255, 165, 0, 0.15)',
  zIndex: isMobile ? '20000000000' : '1001',
  borderRight: isMobile ? '1px solid rgba(255, 215, 0, 0.1)' : 'none',
  overflowY: 'scroll',
  overflowX: 'hidden',
  maxHeight: isMobile ? 'calc(100vh - 60px)' : 'calc(100vh - 120px)',

  /* Scrollbar styling */
  scrollbarWidth: 'thin', /* Firefox */
  scrollbarColor: 'rgb(212 175 55 / 28%) rgba(255, 255, 255, 0.05)', /* Firefox */
};

const sidebarDesktopStyle = {
  ...sidebarBaseStyle,
  width: '230px',
  position: 'sticky',
  display: 'flex',
  flexDirection: 'column',
  top: '80px',

  /* Webkit scrollbar for Chrome, Edge, Safari */
  '&::-webkit-scrollbar': {
    width: '5px',
    height: '5px'
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(212, 175, 55, 0.28)', /* soft gold */
    borderRadius: '10px',
    border: '2px solid rgba(26, 26, 26, 0.95)', /* glossy border */
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: 'rgba(212, 175, 55, 0.45)',
  },
};

const sidebarMobileStyle = {
  ...sidebarBaseStyle,
  position: 'fixed',
  top: 0,
  left: 0,
  width: '85%',
  maxWidth: '320px',
  transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
  opacity: sidebarOpen ? 1 : 0,

  /* Webkit scrollbar for mobile */
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(212, 175, 55, 0.28)',
    borderRadius: '10px',
    border: '2px solid rgba(26, 26, 26, 0.95)',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: 'rgba(212, 175, 55, 0.45)',
  },
};



  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
    backdropFilter: 'blur(2px)',
  };

  const filterItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    marginBottom: '0.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: isActive ? 'rgba(255, 165, 0, 0.15)' : 'transparent',
    border: isActive ? '1px solid rgba(255, 165, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
    color: isActive ? '#FFD700' : 'rgba(255, 255, 255, 0.8)',
  });

  const sectionHeadingStyle = {
    display: 'flex',
    alignItems: 'center',
    color: '#FFA500',
    fontSize: '0.9rem',
    margin: '0.5rem 0 1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid rgba(255, 165, 0, 0.2)',
  };

  const titleGradient = {
    background: 'linear-gradient(90deg, #FFA500, #FFD700)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    display: 'inline-block',
    fontSize: isMobile ? '0.4rem':'0.9rem',
    position: 'relative',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
  };

  const titleUnderline = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '2px',
    background: 'linear-gradient(90deg, rgba(255, 165, 0, 0.8), rgba(255, 215, 0, 0.5))',
    borderRadius: '2px',
  };

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ 
        width: '100%',
        backgroundColor: '#0d0d0d',
        minHeight: '100vh',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: isMobile ? '60px' : '0'
      }}
    >
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

      {/* Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={overlayStyle} 
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div style={{
        display: 'flex',
        flexGrow: 1,
        position: 'relative',
        width: '100%',
        marginBottom:'5vh',
      }}>
        {/* Sidebar - Updated to match Clothing page style */}
        <motion.aside
          style={isMobile ? sidebarMobileStyle : sidebarDesktopStyle}
          initial={isMobile ? { x: -320 } : { opacity: 0 }}
          animate={isMobile ? { 
            x: sidebarOpen ? 0 : -320,
            opacity: sidebarOpen ? 1 : 0
          } : { 
            opacity: 1 
          }}
          transition={isMobile ? { 
            type: 'spring', 
            damping: 25,
            stiffness: 300
          } : { 
            duration: 0.5 
          }}
        >
          {/* Reset Filters Button at Bottom */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255, 165, 0, 0.2)' }}
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
          </motion.div>

          {/* Price Range */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}
          >
            <h6 style={sectionHeadingStyle}>
              <FaTags style={{ marginRight: '0.75rem' }} />
              Price Range
            </h6>
            <Slider
              value={priceRange}
              onChange={handlePriceChange}
              valueLabelDisplay="auto"
              min={0}
              max={500}
              sx={{
                color: '#FFA500',
                height: 6,
                '& .MuiSlider-thumb': {
                  width: 16,
                  height: 16,
                  backgroundColor: '#FFA500',
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(255, 165, 0, 0.16)',
                  },
                },
                '& .MuiSlider-valueLabel': {
                  backgroundColor: '#FFA500',
                  color: '#121212',
                  fontWeight: 'bold',
                  transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                },
                '& .MuiSlider-rail': {
                  opacity: 0.5,
                  backgroundColor: '#444',
                },
              }}
            />
            <motion.div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.85rem'
              }}
              animate={{
                opacity: [0.5, 1],
                transition: { duration: 0.5 }
              }}
            >
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </motion.div>
          </motion.div>

          {/* Categories */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h6 
              style={sectionHeadingStyle}
              variants={itemVariants}
            >
              <FaLayerGroup style={{ marginRight: '0.75rem' }} />
              Categories
            </motion.h6>
            
            {categoriesLoading ? (
              <CategorySkeleton />
            ) : (
              availableCategories.map((cat) => (
                <motion.div
                  key={cat}
                  style={filterItemStyle(category === cat)}
                  onClick={() => {
                    handleCategoryChange(cat);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  variants={itemVariants}
                  whileHover={{ 
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    borderColor: 'rgba(255, 165, 0, 0.3)',
                    scale: 1.02
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <span style={{ fontSize: '0.8rem' }}>
                    {cat === 'All' ? 'All Accessories' : cat}
                  </span>
                </motion.div>
              ))
            )}
          </motion.div>
        </motion.aside>

        {/* Main Content */}
        <main style={{ 
          flex: 1, 
          padding: isMobile ? '0rem' : '1.5rem',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: isMobile ? '10px 10px' : '40px 20px',
            borderRadius: '15px',
            background: 'rgba(26, 26, 26, 0.95)',
            minHeight: 'calc(100vh - 80px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background logo */}
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 0,
              opacity: 0.1,
              width: '80%',
              maxWidth: '800px',
              height: '80%',
              backgroundImage: `url(${bglogoimg})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              pointerEvents: 'none'
            }} />

            <div style={{display: 'flex', flexDirection: 'row', justifyContent:'space-between'}}>
              <motion.div 
                style={titleGradient}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.h1 
                  style={{ margin: 0 }}
                  key={category}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {category === 'All' ? 'All Accessories' : category}
                </motion.h1>
                <div style={titleUnderline} />
              </motion.div>
              
              {/* Results Count */}
              {!isFetching && !error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    marginBottom: '1.5rem',
                    color: '#95a5a6',
                     fontSize: isMobile ? '0.6rem':'0.9rem'
                  }}
                >
                  Showing {filteredProducts.length} of {products.length} products
                  {searchQuery && (
                    <span> for "<strong>{searchQuery}</strong>"</span>
                  )}
                </motion.div>
              )}
            </div>
            
            {/* Products Grid */}
            <div id="other-products">
              {isFetching ? (
                <SkeletonLoader isMobile={isMobile} isSmallScreen={isSmallScreen} />
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
                <motion.div 
                  layout
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isSmallScreen ? 'repeat(2, 1fr)' : isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: isSmallScreen ? '10px' : '12px',
                    marginBottom: '40px',
                    position: 'relative',
                    zIndex: 1
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
                        onClick={() => setSelectedProduct(product)}
                        isMobile={isMobile}
                        isSmallScreen={isSmallScreen}
                        nameWidths={nameWidths}
                        addToCartWithNotification={addToCartWithNotification}
                      />
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div 
                  data-aos="fade-up"
                  style={{
                    textAlign: 'center',
                    padding: '60px 0',
                    position: 'relative',
                    zIndex: 1
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
            
            {/* Modal */}
            {selectedProduct && (
              <ProductModal 
                product={selectedProduct}
                relatedProducts={products.filter(
                  p => (p.category === selectedProduct.category || 
                       p.subcategory === selectedProduct.subcategory) && 
                       p.id !== selectedProduct.id
                ).slice(0, 4)}
                onClose={() => setSelectedProduct(null)}
                onRelatedProductClick={(product) => {
                  setSelectedProduct(product);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav 
          onCategoryClick={() => setSidebarOpen(true)} 
          onCloseSidebar={handleCloseSidebar}
        />
      )}

      {/* Notification */}
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

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }
          
          @keyframes toast-in {
            0% { transform: translateY(30px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
          
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </motion.section>
  );
};

export default OtherProducts;
