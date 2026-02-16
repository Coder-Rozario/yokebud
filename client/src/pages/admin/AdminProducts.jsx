import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiPlus, FiImage, FiCopy } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Helmet } from "react-helmet-async";
import ProtectedRoute from '../../components/ProtectedRoute';

const AdminProducts = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [nameWidths, setNameWidths] = useState({});
  
  const navigate = useNavigate();

  // Category color helper functions
  const getCategoryColor = (category) => {
    const colors = {
      'Men': 'rgba(52, 152, 219, 0.2)',
      'Women': 'rgba(155, 89, 182, 0.2)',
      'Kids': 'rgba(46, 204, 113, 0.2)',
      'Accessories': 'rgba(241, 196, 15, 0.2)',
      'New Arrivals': 'rgba(231, 76, 60, 0.2)',
      'Best Sellers': 'rgba(230, 126, 34, 0.2)',
      'SALE': 'rgba(39, 174, 96, 0.2)',
      'WINTER': 'rgba(41, 128, 185, 0.2)',
      'SUMMER': 'rgba(211, 84, 0, 0.2)',
      'LIMITED': 'rgba(142, 68, 173, 0.2)',
      'Customizeable': 'rgba(44, 62, 80, 0.2)'
    };
    return colors[category] || 'rgba(255, 165, 0, 0.2)';
  };

  const getCategoryTextColor = (category) => {
    const colors = {
      'Men': '#3498db',
      'Women': '#9b59b6',
      'Kids': '#2ecc71',
      'Accessories': '#f1c40f',
      'New Arrivals': '#e74c3c',
      'Best Sellers': '#e67e22',
      'SALE': '#27ae60',
      'WINTER': '#2980b9',
      'SUMMER': '#d35400',
      'LIMITED': '#8e44ad',
      'Customizeable': '#2c3e50'
    };
    return colors[category] || '#FFA500';
  };

  // Load search term from localStorage on component mount
  useEffect(() => {
    const savedSearchTerm = localStorage.getItem('adminProductsSearch');
    if (savedSearchTerm) {
      setSearchTerm(savedSearchTerm);
    }
  }, []);

  // Save search term to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminProductsSearch', searchTerm);
  }, [searchTerm]);

  // Disable right-click and dev tools
  useEffect(() => {
    const disableRightClick = (e) => {
      e.preventDefault();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return false;
    };

    const disableDevTools = (e) => {
      if (e.keyCode === 123 || // F12
          (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
          (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
          (e.ctrlKey && e.keyCode === 85)) { // Ctrl+U
        e.preventDefault();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return false;
      }
    };

    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('keydown', disableDevTools);

    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('keydown', disableDevTools);
    };
  }, []);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://api.yokebud.com/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        
        const processedData = data.map(product => {
          let photos = product.product_photos;
          if (typeof photos === 'string') {
            try {
              photos = JSON.parse(photos);
            } catch (e) {
              photos = [];
            }
          }
          
          // Parse categories from database - handle multiple formats
          let categories = [];
          if (product.category) {
            if (typeof product.category === 'string') {
              // Try to parse as JSON first
              try {
                const parsed = JSON.parse(product.category);
                if (Array.isArray(parsed)) {
                  categories = parsed;
                } else {
                  categories = [product.category];
                }
              } catch (e) {
                // If it's not JSON, check if it's a comma-separated string
                if (product.category.includes(',')) {
                  categories = product.category.split(',').map(cat => cat.trim());
                } else {
                  categories = [product.category];
                }
              }
            } else if (Array.isArray(product.category)) {
              categories = product.category;
            }
          }
          
          const firstImage = Array.isArray(photos) && photos.length > 0 
            ? photos[0] 
            : null;

          // Handle price range - use min_price/max_price if available
          const minPrice = product.min_price || product.discounted_price || product.price;
          const maxPrice = product.max_price || product.price;

          return {
            ...product,
            price: Number(product.price),
            min_price: Number(minPrice),
            max_price: Number(maxPrice),
            discounted_price: product.discounted_price ? Number(product.discounted_price) : null,
            firstImage: firstImage,
            allImages: photos || [],
            categories: categories.filter(cat => cat && cat.trim() !== '')
          };
        });
        
        setProducts(processedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Check for mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Measure product name widths
  useEffect(() => {
    if (!loading && !error && products.length > 0) {
      const newNameWidths = {};
      const containerWidth = isMobile ? 150 : 200;
      
      products.forEach(product => {
        const element = document.getElementById(`name-${product.id}`);
        if (element) {
          const textWidth = element.scrollWidth;
          newNameWidths[product.id] = textWidth > containerWidth;
        }
      });
      
      setNameWidths(newNameWidths);
    }
  }, [loading, error, products, isMobile]);

  // Refresh products after edit/delete/duplicate
  const refreshProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.yokebud.com/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      
      const processedData = data.map(product => {
        let photos = product.product_photos;
        if (typeof photos === 'string') {
          try {
            photos = JSON.parse(photos);
          } catch (e) {
            photos = [];
            }
          }
          
          let categories = [];
          if (product.category) {
            if (typeof product.category === 'string') {
              try {
                const parsed = JSON.parse(product.category);
                if (Array.isArray(parsed)) {
                  categories = parsed;
                } else {
                  categories = [product.category];
                }
              } catch (e) {
                if (product.category.includes(',')) {
                  categories = product.category.split(',').map(cat => cat.trim());
                } else {
                  categories = [product.category];
                }
              }
            } else if (Array.isArray(product.category)) {
              categories = product.category;
            }
          }
          
          const firstImage = Array.isArray(photos) && photos.length > 0 
            ? photos[0] 
            : null;

          const minPrice = product.min_price || product.discounted_price || product.price;
          const maxPrice = product.max_price || product.price;

          return {
            ...product,
            price: Number(product.price),
            min_price: Number(minPrice),
            max_price: Number(maxPrice),
            discounted_price: product.discounted_price ? Number(product.discounted_price) : null,
            firstImage: firstImage,
            allImages: photos || [],
            categories: categories.filter(cat => cat && cat.trim() !== '')
          };
        });
        
        setProducts(processedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.categories && product.categories.some(cat => 
      cat.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const handleDelete = async (productId) => {
    toast.info(
      <div>
        <p>Are you sure you want to delete this product?</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <button 
            onClick={() => {
              toast.dismiss();
              confirmDelete(productId);
            }}
            style={{
              padding: '0.3rem 0.8rem',
              background: '#F44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Yes
          </button>
          <button 
            onClick={() => toast.dismiss()}
            style={{
              padding: '0.3rem 0.8rem',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            No
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        draggable: false,
        style: { background: '#1a1a1a', color: '#e0e0e0' }
      }
    );
  };

  const confirmDelete = async (productId) => {
    try {
      const response = await fetch(`https://api.yokebud.com/api/products/${productId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      await refreshProducts();
      
      toast.success('Product deleted successfully!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to delete product', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    }
  };

  const handleDuplicate = async (productId) => {
    toast.info(
      <div>
        <p>Are you sure you want to duplicate this product?</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <button 
            onClick={() => {
              toast.dismiss();
              confirmDuplicate(productId);
            }}
            style={{
              padding: '0.3rem 0.8rem',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Yes
          </button>
          <button 
            onClick={() => toast.dismiss()}
            style={{
              padding: '0.3rem 0.8rem',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            No
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        draggable: false,
        style: { background: '#1a1a1a', color: '#e0e0e0' }
      }
    );
  };

  const confirmDuplicate = async (productId) => {
    try {
      const productToDuplicate = products.find(p => p.id === productId);
      if (!productToDuplicate) {
        throw new Error('Product not found');
      }

      const timestamp = new Date().getTime();
      const newSku = `${productToDuplicate.sku}-COPY-${timestamp}`;

      const newProduct = {
        name: `Copy of ${productToDuplicate.product_name}`,
        description: productToDuplicate.product_details,
        price: productToDuplicate.price,
        discounted_price: productToDuplicate.discounted_price,
        categories: productToDuplicate.categories,
        subcategory: productToDuplicate.subcategory,
        moq: productToDuplicate.moq,
        material: productToDuplicate.material,
        care: productToDuplicate.care_instructions,
        sku: newSku,
        shipping: productToDuplicate.shipping_info,
        warranty: productToDuplicate.warranty,
        bulk_discount: productToDuplicate.bulk_discount,
        sizes: productToDuplicate.sizes,
        colors: productToDuplicate.colors,
        tags: productToDuplicate.tags,
        features: productToDuplicate.features,
        imageUrls: productToDuplicate.allImages || []
      };

      Object.keys(newProduct).forEach(key => {
        if (newProduct[key] === null || newProduct[key] === undefined) {
          delete newProduct[key];
        }
      });

      const response = await fetch('https://api.yokebud.com/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to duplicate product');
      }

      await refreshProducts();

      toast.success('Product duplicated successfully!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    } catch (err) {
      console.error('Error duplicating product:', err);
      toast.error(err.message || 'Failed to duplicate product', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    }
  };

  const handleEdit = (productId) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  // Styles
  const styles = {
    container: {
      display: 'flex',
      minHeight: '105vh',
      width: '100vw',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      overflow: 'hidden', // Prevent main body scroll
      margin: 0,
      padding: 0,
    },
    mainContent: {
      flex: 1,
      marginLeft: isMobile ? 0 : 230,
      padding: isMobile ? '0.5rem' : '2rem',
      width: isMobile ? '100%' : 'calc(100% - 230px)',
      minWidth: 0,
      background: 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)',
      boxSizing: 'border-box',
      transition: 'margin-left 0.3s ease, padding 0.3s ease',
      display: 'flex', // Enable flex layout
      flexDirection: 'column', // Stack header and table vertical
      height: '100vh', // Full viewport height
      overflow: 'hidden', // Prevent scroll on parent
    },
    header: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'flex-start' : 'center',
      marginBottom: '1rem',
      gap: '1rem',
      width: '100%',
      flexShrink: 0, // Prevent header from shrinking
    },
    title: {
      fontSize: isMobile ? '1.5rem' : '1.8rem',
      textAlign: isMobile ? 'left' : 'center',
      marginBottom: isMobile ? '1rem' : '1rem',
      fontWeight: '600',
      background: 'linear-gradient(90deg, #FFA500, #FFD700)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      margin: 0,
    },
    searchInput: {
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      background: 'rgba(30, 30, 30, 0.8)',
      color: '#e0e0e0',
      width: isMobile ? '100%' : '300px',
      fontSize: '0.9rem',
      outline: 'none',
      transition: 'all 0.3s ease',
      ':focus': {
        borderColor: '#FFA500',
        boxShadow: '0 0 0 2px rgba(255, 165, 0, 0.2)',
      },
    },
    // The Container for the table - Handles scrolling
    tableContainer: {
      background: 'rgba(40, 40, 40, 0.7)',
      borderRadius: '12px',
      padding: 0, // Removed padding to make sticky header touch edges
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(255, 215, 0, 0.1)',
      flex: 1, // Fill remaining space
      overflowY: 'auto', // Enable Vertical Scroll
      overflowX: 'auto', // Enable Horizontal Scroll
      position: 'relative',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate', // Use separate to allow spacing if needed, but 'collapse' is fine too
      borderSpacing: 0, // Ensure no gaps for sticky header
      minWidth: isMobile ? '600px' : '800px',
    },
    th: {
      textAlign: 'center', // Default align center
      padding: isMobile ? '0.75rem 0.5rem' : '1rem',
      backgroundColor: '#1a1a1a', // Solid background for sticky
      borderBottom: '2px solid rgba(255, 165, 0, 0.3)', // Stronger border
      color: '#FFA500',
      fontWeight: '600',
      fontSize: isMobile ? '0.8rem' : '0.95rem',
      whiteSpace: 'nowrap',
      position: 'sticky', // FIX THE HEADER
      top: 0,
      zIndex: 10,
      boxShadow: '0 2px 5px rgba(0,0,0,0.5)', // Shadow to separate header
    },
    // Specific styles for Product Name Header to align Left
    thName: {
        textAlign: 'left',
        paddingLeft: '1.5rem',
    },
    td: {
      padding: isMobile ? '0.5rem' : '0.75rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      fontSize: isMobile ? '0.8rem' : '0.9rem',
      verticalAlign: 'middle',
      textAlign: 'center', // Align values to center matching headers
    },
    // Specific styles for Product Name Cell to align Left
    tdName: {
        textAlign: 'left',
        paddingLeft: '1.5rem',
    },
    productImageContainer: {
      width: '60px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '4px',
      overflow: 'hidden',
      margin: '0 auto', // Center image in cell
    },
    productImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFA500',
      backgroundColor: 'rgba(255, 165, 0, 0.1)',
    },
    
    actionButton: {
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      border: 'none',
      background: 'rgba(255, 165, 0, 0.2)',
      color: '#FFA500',
      cursor: 'pointer',
      marginRight: '0.5rem',
      transition: 'all 0.2s ease',
      fontSize: isMobile ? '0.7rem' : '0.8rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.3rem',
      ':hover': {
        background: 'rgba(255, 165, 0, 0.3)',
      },
    },
    duplicateButton: {
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      border: 'none',
      background: 'rgba(100, 149, 237, 0.2)',
      color: '#6495ED',
      cursor: 'pointer',
      marginRight: '0.5rem',
      transition: 'all 0.2s ease',
      fontSize: isMobile ? '0.7rem' : '0.8rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.3rem',
      ':hover': {
        background: 'rgba(100, 149, 237, 0.3)',
      },
    },
    deleteButton: {
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      border: 'none',
      background: 'rgba(244, 67, 54, 0.2)',
      color: '#F44336',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: isMobile ? '0.7rem' : '0.8rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.3rem',
      ':hover': {
        background: 'rgba(244, 67, 54, 0.3)',
      },
    },
    addButton: {
      padding: isMobile ? '5px': '0.5rem 1rem',
      borderRadius: '6px',
      border: 'none',
      background: 'linear-gradient(90deg, #FFA500, #FFD700)',
      color: '#1a1a1a',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: isMobile ? '0.6rem' : '0.9rem',
      transition: 'all 0.3s ease',
      marginBottom: '0', // Removed margin bottom
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(255, 165, 0, 0.3)',
      },
    },
    actionButtons: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.3rem',
      justifyContent: 'center', // Center action buttons
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
      width: '100%',
    },
    loadingAnimation: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
    },
    spinner: {
      width: '60px',
      height: '60px',
      border: '4px solid rgba(255, 215, 0, 0.3)',
      borderTop: '4px solid #FFA500',
      borderRight: '4px solid #FFA500',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    loadingText: {
      color: '#FFA500',
      fontSize: '1.2rem',
      fontWeight: '500',
      textAlign: 'center',
      background: 'linear-gradient(90deg, #FFA500, #FFD700, #FFA500)',
      backgroundSize: '200% auto',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      animation: 'gradient 2s linear infinite',
    },
    error: {
      color: '#F44336',
      textAlign: 'center',
      padding: '2rem',
    },
    productNameContainer: {
      maxWidth: isMobile ? '150px' : '200px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    },
    productName: {
      display: 'inline-block',
    },
    marquee: {
      display: 'inline-block',
      animation: 'marquee 10s linear infinite',
      paddingLeft: '100%',
      whiteSpace: 'nowrap',
    },
    categoryPill: {
      display: 'inline-block',
      padding: '0.2rem 0.5rem',
      borderRadius: '12px',
      fontSize: '0.7rem',
      margin: '0.1rem',
      whiteSpace: 'nowrap',
      maxWidth: '120px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      cursor: 'default',
      transition: 'all 0.2s ease',
      ':hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      },
    },
    priceRange: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.2rem',
      alignItems: 'center', // Center align price
    },
    singlePrice: {
      fontSize: '0.9rem',
      fontWeight: '600',
    },
    discountedPrice: {
      fontSize: '0.8rem',
      color: '#95a5a6',
      textDecoration: 'line-through',
    }
  };

  return (
    <ProtectedRoute>
      <div style={styles.container}>
        <Helmet>
          <title>Admin Products | Yokebud Group Oy</title>
          <meta name="description" content="Manage products in the admin panel" />
        </Helmet>

        {showToast && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            justifyContent: 'center',
            backgroundColor: 'black',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transform: 'translateY(0)',
            opacity: 1,
            animation: 'toast-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            borderLeft: '4px solid #f56565'
          }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ color: '#f56565', flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>Action Restricted</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>This function is disabled on this website.</div>
            </div>
          </div>
        )}
        
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
        
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobile={isMobile} />
        
        <main style={styles.mainContent}>
          <header style={styles.header}>
            <motion.h1 
              style={styles.title}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Product Management
            </motion.h1>
            <div style={{ display: 'flex', gap: '1rem', width: isMobile ? '100%' : 'auto' }}>
              <input
                type="text"
                placeholder="Search products..."
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <motion.button
                style={styles.addButton}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/admin/upload')}
              >
                <FiPlus /> Add Product
              </motion.button>
            </div>
          </header>

          <motion.div 
            style={styles.tableContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.loadingAnimation}>
                  <div style={styles.spinner}></div>
                  <div style={styles.loadingText}>Loading Products...</div>
                </div>
              </div>
            ) : error ? (
              <div style={styles.error}>
                <p>Error: {error}</p>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Image</th>
                    {/* Align Name to Left */}
                    <th style={{...styles.th, ...styles.thName}}>Product Name</th>
                    <th style={styles.th}>Categories</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <tr key={product.id}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>
                        <div style={styles.productImageContainer}>
                          {product.firstImage ? (
                            <img 
                              src={product.firstImage.startsWith('http') ? product.firstImage : `https://api.yokebud.com${product.firstImage}`}
                              alt={product.product_name}
                              style={styles.productImage}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.parentElement.querySelector('.image-fallback');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <div style={styles.imagePlaceholder}>
                              <FiImage size={20} />
                            </div>
                          )}
                          <div 
                            className="image-fallback"
                            style={{
                              ...styles.imagePlaceholder,
                              display: product.firstImage ? 'none' : 'flex'
                            }}
                          >
                            <FiImage size={20} />
                          </div>
                        </div>
                      </td>
                      {/* Align Name to Left */}
                      <td style={{...styles.td, ...styles.tdName}}>
                        <div style={styles.productNameContainer}>
                          <span 
                            id={`name-${product.id}`}
                            style={{
                              ...styles.productName,
                              ...(nameWidths[product.id] ? styles.marquee : {})
                            }}
                          >
                            {product.product_name}
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        {product.categories && product.categories.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', maxWidth: '200px', justifyContent: 'center' }}>
                            {product.categories.map((category, idx) => (
                              <span 
                                key={idx} 
                                style={{
                                  ...styles.categoryPill,
                                  backgroundColor: getCategoryColor(category),
                                  color: getCategoryTextColor(category)
                                }}
                                title={category}
                              >
                                {category.length > 12 ? category.substring(0, 12) + '...' : category}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#888', fontStyle: 'italic' }}>No category</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {product.min_price && product.max_price && product.min_price !== product.max_price ? (
                          <div style={styles.priceRange}>
                            <span style={{ 
                              fontSize: '0.9rem', 
                              fontWeight: '600',
                              color: '#FFA500'
                            }}>
                              ${product.min_price.toFixed(2)} - ${product.max_price.toFixed(2)}
                            </span>
                            {product.discounted_price && product.discounted_price !== product.min_price && (
                              <span style={styles.discountedPrice}>
                                Discount: ${product.discounted_price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span style={styles.singlePrice}>
                              ${(product.min_price || product.price).toFixed(2)}
                            </span>
                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                {product.discounted_price && product.discounted_price !== (product.min_price || product.price) && (
                                <span style={styles.discountedPrice}>
                                    (${product.discounted_price.toFixed(2)})
                                </span>
                                )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button 
                            style={styles.actionButton}
                            onClick={() => handleEdit(product.id)}
                          >
                            <FiEdit2 size={14} /> Edit
                          </button>
                          <button 
                            style={styles.duplicateButton}
                            onClick={() => handleDuplicate(product.id)}
                          >
                            <FiCopy size={14} /> Duplicate
                          </button>
                          <button 
                            style={styles.deleteButton}
                            onClick={() => handleDelete(product.id)}
                          >
                            <FiTrash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        </main>

        <style>
          {`
            /* Custom Scrollbar Styling */
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: #2a2a2a;
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb {
              background: #555;
              border-radius: 4px;
              border: 2px solid #2a2a2a;
              transition: background 0.3s ease;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #FFA500; /* Gold/Orange on hover */
            }
            ::-webkit-scrollbar-corner {
              background: #2a2a2a;
            }

            /* Animations */
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
          `}
        </style>
      </div>
    </ProtectedRoute>
  );
};

export default AdminProducts;
