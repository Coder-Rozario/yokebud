import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiChevronDown, FiUpload, FiX, FiCheck, FiTrash2, FiSave, FiMove, FiBox, FiDollarSign, FiTag } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminUpload = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '', // max_price
    min_price: '', // min_price
    categories: [],
    subcategory: '',
    moq: 1,
    material: '',
    care: '',
    sku: '',
    shipping: 'Free shipping on orders over $500',
    warranty: '1 year quality guarantee',
    bulk_discount: '10% off for 50+ units',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#2c3e50', '#e74c3c', '#3498db'],
    tags: ['NEW'],
    features: ['High quality material', 'Durable', 'Comfortable fit']
  });
  
  const [previews, setPreviews] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isFileLabelHovered, setIsFileLabelHovered] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [allSubcategories, setAllSubcategories] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  const navigate = useNavigate();

  const categories = ['Men', 'Women', 'Kids', 'Accessories'];

  // Global Scrollbar Styles
  const scrollbarStyles = `
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05); 
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 165, 0, 0.5); 
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 165, 0, 0.8); 
    }
    /* Firefox */
    * {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 165, 0, 0.5) rgba(255, 255, 255, 0.05);
    }
  `;

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const response = await fetch('https://api.yokebud.com/api/subcategories', {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch subcategories');
        const data = await response.json();
        setAllSubcategories(data);
      } catch (err) {
        console.error('Error fetching subcategories:', err);
      }
    };

    fetchSubcategories();
  }, []);

  const getSubcategories = (selectedCategories) => {
    if (!selectedCategories || selectedCategories.length === 0) return [];
    
    const combinedSubcategories = new Set();
    selectedCategories.forEach(category => {
      if (allSubcategories[category]) {
        allSubcategories[category].forEach(sub => combinedSubcategories.add(sub));
      }
    });
    
    return Array.from(combinedSubcategories).sort();
  };

  // Helper for Auto SKU Generation
  const generateSKUHelper = (nameInput, categoryList) => {
    if (!nameInput) return '';
    
    const categoryCode = (categoryList && categoryList.length > 0) 
        ? categoryList[0].substring(0, 3).toUpperCase() 
        : 'GEN';
        
    const nameCode = nameInput.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now().toString().slice(-4);
    
    return `${categoryCode}-${nameCode}-${randomNum}-${timestamp}`;
  };

  const generateSKU = () => {
    return generateSKUHelper(product.name, product.categories);
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const showToast = (type, message) => {
    toast[type](message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "dark",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setProduct(prev => {
        let updatedProduct = { 
            ...prev, 
            [name]: value,
            ...(name === 'categories' ? { subcategory: '' } : {})
        };

        // Auto-update SKU if Name changes
        if (name === 'name') {
            updatedProduct.sku = generateSKUHelper(value, prev.categories);
        }

        return updatedProduct;
    });

    if (name === 'categories') {
      setIsSubcategoryOpen(false);
    }
  };

  const handleCategoryChange = (category) => {
    setProduct(prev => {
      let newCategories = [];
      
      if (category === 'Accessories') {
        newCategories = [category];
      } else {
        newCategories = [...prev.categories];
        const index = newCategories.indexOf(category);
        
        if (index === -1) {
          newCategories.push(category);
        } else {
          newCategories.splice(index, 1);
        }
        newCategories = newCategories.filter(cat => cat !== 'Accessories');
      }
      
      // Update SKU when category changes
      const newSKU = generateSKUHelper(prev.name, newCategories.length > 0 ? newCategories : []);

      return { 
        ...prev, 
        categories: newCategories,
        subcategory: newCategories.length === 0 ? prev.subcategory : '',
        sku: newSKU
      };
    });
    setIsSubcategoryOpen(false);
  };

  const handleArrayChange = (field, value) => {
    setProduct(prev => {
      const currentArray = [...prev[field]];
      const index = currentArray.indexOf(value);
      
      if (index === -1) {
        currentArray.push(value);
      } else {
        currentArray.splice(index, 1);
      }
      
      return { ...prev, [field]: currentArray };
    });
  };

  const addFeature = () => {
    const newFeature = prompt('Enter new feature:');
    if (newFeature && newFeature.trim() !== '') {
      setProduct(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      showToast('success', 'Feature added successfully!');
    }
  };

  const handleAddSubcategory = async () => {
    if (newSubcategory.trim() && product.categories.length > 0) {
      try {
        const response = await fetch('https://api.yokebud.com/api/subcategories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            category: product.categories[0],
            subcategory: newSubcategory.trim()
          })
        });

        if (!response.ok) throw new Error('Failed to add subcategory');

        const updatedSubcategories = { ...allSubcategories };
        product.categories.forEach(category => {
          if (!updatedSubcategories[category]) updatedSubcategories[category] = [];
          updatedSubcategories[category].push(newSubcategory.trim());
        });
        
        setAllSubcategories(updatedSubcategories);
        setProduct(prev => ({ ...prev, subcategory: newSubcategory.trim() }));
        setNewSubcategory('');
        setShowAddSubcategory(false);
        showToast('success', 'Subcategory added successfully!');
      } catch (err) {
        console.error('Error adding subcategory:', err);
        showToast('error', 'Failed to add subcategory.');
      }
    } else {
      showToast('error', 'Please enter a valid subcategory name');
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newPreviews = await Promise.all(
        files.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        })
      );

      setPreviews(prev => [...prev, ...newPreviews]); // Append to end for better UX

      const uploadResults = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('images', file);

        const response = await fetch('https://api.yokebud.com/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) throw new Error('Failed to upload images');

        const result = await response.json();
        
        if (result.success && result.images) {
          uploadResults.push(...result.images);
          setUploadProgress(prev => prev + (100 / files.length));
        } else {
          throw new Error(result.message || 'Failed to upload images');
        }
      }

      setUploadedImages(prev => [...prev, ...uploadResults]);
      showToast('success', 'Images uploaded successfully!');
    } catch (err) {
      console.error('Image upload error:', err);
      showToast('error', err.message || 'Failed to upload images.');
      // Remove previews if upload fails (simplified)
      setPreviews(prev => prev.slice(0, prev.length - files.length));
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    const confirmDelete = () => {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
      setPreviews(prev => prev.filter((_, i) => i !== index));
      showToast('success', 'Image removed');
    };

    // Simple confirm for modern UI cleanliness, or you can use custom toast UI
    if (window.confirm("Are you sure you want to remove this image?")) {
        confirmDelete();
    }
  };

  const handleDragStart = (index) => setDraggedIndex(index);
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newPreviews = [...previews];
    const [draggedItem] = newPreviews.splice(draggedIndex, 1);
    newPreviews.splice(targetIndex, 0, draggedItem);
    setPreviews(newPreviews);

    const newUploadedImages = [...uploadedImages];
    const [draggedImage] = newUploadedImages.splice(draggedIndex, 1);
    newUploadedImages.splice(targetIndex, 0, draggedImage);
    setUploadedImages(newUploadedImages);

    setDraggedIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!product.name || !product.description || !product.price || !product.min_price || 
        product.categories.length === 0 || !product.subcategory || 
        !product.material || !product.care || !product.sku || uploadedImages.length === 0) {
      showToast('error', 'Please fill in all required fields and upload at least one image');
      return;
    }

    if (parseFloat(product.min_price) > parseFloat(product.price)) {
      showToast('error', 'Minimum price cannot be greater than maximum price');
      return;
    }

    setIsUploading(true);

    try {
      const productData = {
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        min_price: parseFloat(product.min_price),
        discounted_price: null,
        categories: product.categories,
        subcategory: product.subcategory,
        moq: parseInt(product.moq),
        material: product.material,
        care: product.care,
        sku: product.sku,
        shipping: product.shipping,
        warranty: product.warranty,
        bulk_discount: product.bulk_discount,
        sizes: product.sizes,
        colors: product.colors,
        tags: product.tags,
        features: product.features,
        imageUrls: uploadedImages.map(img => img.url)
      };

      const response = await fetch('https://api.yokebud.com/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create product');
      }

      const result = await response.json();

      if (result.success) {
        setProduct({
          name: '', description: '', price: '', min_price: '', categories: [], subcategory: '',
          moq: 1, material: '', care: '', sku: '', shipping: 'Free shipping on orders over $500',
          warranty: '1 year quality guarantee', bulk_discount: '10% off for 50+ units',
          sizes: ['S', 'M', 'L', 'XL'], colors: ['#2c3e50', '#e74c3c', '#3498db'],
          tags: ['NEW'], features: ['High quality material', 'Durable', 'Comfortable fit']
        });
        setPreviews([]);
        setUploadedImages([]);
        
        showToast('success', 'Product uploaded successfully!');
        navigate('/admin/products');
      } else {
        throw new Error(result.message || 'Failed to upload product');
      }
    } catch (err) {
      console.error('Submission error:', err);
      showToast('error', err.message || 'Failed to upload product');
    } finally {
      setIsUploading(false);
    }
  };

  // Modern Styles System (Matches AdminEdit)
  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      background: '#0F0F10',
      color: '#E0E0E0',
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      overflowX: 'hidden',
    },
    mainContent: {
      flex: 1,
      marginLeft: isMobile ? 0 : '260px',
      padding: isMobile ? '1rem' : '3rem',
      width: isMobile ? '100%' : 'calc(100% - 260px)',
      background: 'radial-gradient(circle at top right, #1a1a1a 0%, #0F0F10 100%)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      minWidth: 0,
    },
    header: {
      marginBottom: '2.5rem',
      position: 'relative',
    },
    title: {
      fontSize: isMobile ? '1.8rem' : '2.5rem',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #FFFFFF 0%, #B3B3B3 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.02em',
      marginBottom: '0.5rem',
    },
    subtitle: {
        fontSize: '0.95rem',
        color: '#888',
        fontWeight: '400'
    },
    formContainer: {
      background: 'rgba(30, 30, 30, 0.4)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      padding: isMobile ? '1.5rem' : '2rem',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
      width: '100%',
      margin: '0 auto',
      boxSizing: 'border-box',
    },
    sectionTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#FFA500',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderBottom: '1px solid rgba(255, 165, 0, 0.2)',
      paddingBottom: '0.5rem',
      marginTop: '1rem'
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: isMobile ? '1.5rem' : '2rem',
      marginBottom: '1.5rem',
    },
    formGroup: {
      marginBottom: '1.5rem',
      position: 'relative',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontSize: '0.85rem',
      fontWeight: '600',
      color: '#A0A0A0',
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    input: {
      width: '100%',
      padding: '1rem 1.25rem',
      background: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      color: '#FFFFFF',
      fontSize: '1rem',
      transition: 'all 0.2s ease',
      outline: 'none',
      boxSizing: 'border-box',
    },
    inputFocus: {
      borderColor: '#FFA500',
      boxShadow: '0 0 0 4px rgba(255, 165, 0, 0.1)',
      background: 'rgba(0, 0, 0, 0.4)',
    },
    textarea: {
      width: '100%',
      padding: '1rem 1.25rem',
      background: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      color: '#FFFFFF',
      fontSize: '1rem',
      minHeight: '400px', // Matches Edit component
      resize: 'vertical',
      lineHeight: '1.6',
      outline: 'none',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box',
    },
    fileUploadArea: {
      border: '2px dashed rgba(255, 165, 0, 0.3)',
      borderRadius: '16px',
      padding: '3rem',
      textAlign: 'center',
      background: isFileLabelHovered ? 'rgba(255, 165, 0, 0.05)' : 'rgba(0,0,0,0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
    },
    previewGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '1rem',
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '16px'
    },
    previewCard: {
        position: 'relative',
        aspectRatio: '1',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        group: 'preview-card'
    },
    previewImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform 0.3s ease'
    },
    removeBtn: {
        position: 'absolute',
        top: '6px',
        right: '6px',
        background: 'rgba(0,0,0,0.7)',
        color: '#ff4d4d',
        border: 'none',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backdropFilter: 'blur(4px)'
    },
    submitButton: {
      background: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
      color: '#000',
      padding: '1rem 2rem',
      borderRadius: '12px',
      border: 'none',
      fontSize: '1.1rem',
      fontWeight: '700',
      cursor: 'pointer',
      width: '100%',
      marginTop: '2rem',
      boxShadow: '0 8px 20px rgba(255, 165, 0, 0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    tagContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.8rem',
        marginTop: '0.8rem'
    },
    tag: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        background: 'rgba(255, 165, 0, 0.15)',
        border: '1px solid rgba(255, 165, 0, 0.3)',
        borderRadius: '100px',
        fontSize: '0.85rem',
        color: '#FFA500',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    activeTag: {
        background: '#FFA500',
        color: '#000',
        fontWeight: '600'
    },
    helperText: {
        fontSize: '0.75rem',
        color: '#666',
        marginTop: '0.4rem',
        marginLeft: '0.2rem'
    }
  };

  const getInputStyle = (fieldName) => ({
      ...styles.input,
      ...(focusedField === fieldName ? styles.inputFocus : {})
  });

  return (
    <div style={styles.container}>
      <style>{scrollbarStyles}</style>
      <ToastContainer position="top-right" theme="dark" />
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobile={isMobile} />
      
      <main style={styles.mainContent}>
        <header style={styles.header}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={styles.title}>Upload New Product</h1>
                <p style={styles.subtitle}>Add a new item to your inventory with detailed specifications</p>
            </motion.div>
        </header>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={styles.formContainer}
        >
          <form onSubmit={handleSubmit}>
            {/* Basic Info Section */}
            <div style={styles.sectionTitle}><FiBox /> Basic Information</div>
            
            <div style={styles.gridContainer}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Product Name <span style={{color: '#ef4444'}}>*</span></label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle('name')}
                  placeholder="e.g. Premium Cotton Hoodie"
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>SKU <span style={{color: '#ef4444'}}>*</span></label>
                <div style={styles.inputWrapper}>
                  <input
                    type="text"
                    name="sku"
                    value={product.sku}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('sku')}
                    onBlur={() => setFocusedField(null)}
                    style={{...getInputStyle('sku'), paddingRight: '50px'}}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setProduct(prev => ({ ...prev, sku: generateSKU() }))}
                    disabled={!product.name}
                    style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        color: '#FFA500',
                        cursor: 'pointer',
                        padding: '5px'
                    }}
                    title="Regenerate SKU manually"
                  >
                    ⟳
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description <span style={{color: '#ef4444'}}>*</span></label>
              <textarea
                name="description"
                value={product.description}
                onChange={handleChange}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                style={{
                    ...styles.textarea,
                    ...(focusedField === 'description' ? styles.inputFocus : {})
                }}
                required
              />
            </div>

            {/* Pricing Section */}
            <div style={styles.sectionTitle}><FiDollarSign /> Pricing & Costs</div>
            <div style={styles.gridContainer}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Maximum Price ($) <span style={{color: '#ef4444'}}>*</span></label>
                <input
                  type="number"
                  name="price"
                  value={product.price}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('price')}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle('price')}
                  min="0"
                  step="0.01"
                  required
                />
                <div style={styles.helperText}>Visible max price to customers</div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Minimum Price ($) <span style={{color: '#ef4444'}}>*</span></label>
                <input
                  type="number"
                  name="min_price"
                  value={product.min_price}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('min_price')}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle('min_price')}
                  min="0"
                  step="0.01"
                  required
                />
                 <div style={styles.helperText}>Lowest possible price</div>
              </div>
            </div>

            {/* Details Section */}
            <div style={styles.sectionTitle}><FiTag /> Product Details</div>
            <div style={styles.gridContainer}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Material</label>
                <input
                  type="text"
                  name="material"
                  value={product.material}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('material')}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle('material')}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Care Instructions</label>
                <input
                  type="text"
                  name="care"
                  value={product.care}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('care')}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle('care')}
                  required
                />
              </div>
            </div>

            <div style={styles.gridContainer}>
                {/* Category Selection */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Category</label>
                    <div style={styles.tagContainer}>
                        {categories.map(cat => (
                            <motion.div
                                key={cat}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    ...styles.tag,
                                    ...(product.categories.includes(cat) ? styles.activeTag : {})
                                }}
                                onClick={() => handleCategoryChange(cat)}
                            >
                                {product.categories.includes(cat) && <FiCheck size={14}/>} {cat}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Subcategory */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Subcategory</label>
                    <div style={styles.inputWrapper}>
                        <div 
                            style={{...getInputStyle('subcat'), cursor: 'pointer', display: 'flex', justifyContent: 'space-between'}}
                            onClick={() => product.categories.length > 0 && setIsSubcategoryOpen(!isSubcategoryOpen)}
                        >
                            {product.subcategory || 'Select Subcategory'}
                            <FiChevronDown />
                        </div>
                        
                        <AnimatePresence>
                        {isSubcategoryOpen && product.categories.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    zIndex: 50,
                                    background: '#1e1e1e',
                                    border: '1px solid #333',
                                    borderRadius: '12px',
                                    marginTop: '8px',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                }}
                            >
                                {getSubcategories(product.categories).map(sub => (
                                    <div
                                        key={sub}
                                        onClick={() => {
                                            handleChange({ target: { name: 'subcategory', value: sub } });
                                            setIsSubcategoryOpen(false);
                                        }}
                                        style={{
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            color: product.subcategory === sub ? '#FFA500' : '#ccc'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,165,0,0.1)'}
                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                    >
                                        {sub}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                    
                    {!showAddSubcategory && product.categories.length > 0 && (
                        <div 
                            style={{marginTop: '0.5rem', color: '#FFA500', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px'}}
                            onClick={() => setShowAddSubcategory(true)}
                        >
                            <FiPlus /> Add New Subcategory
                        </div>
                    )}
                     {showAddSubcategory && (
                        <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                             <input 
                                type="text" 
                                value={newSubcategory} 
                                onChange={(e) => setNewSubcategory(e.target.value)}
                                style={{...styles.input, padding: '8px 12px', fontSize: '0.9rem'}}
                                placeholder="New subcategory name"
                             />
                             <button type="button" onClick={handleAddSubcategory} style={{background: '#FFA500', border: 'none', borderRadius: '8px', padding: '0 15px', fontWeight: 'bold'}}>Add</button>
                        </div>
                     )}
                </div>
            </div>

            <div style={styles.gridContainer}>
                <div style={styles.formGroup}>
                     <label style={styles.label}>MOQ</label>
                     <input type="number" name="moq" value={product.moq} onChange={handleChange} style={getInputStyle('moq')} min="1" />
                </div>
                 <div style={styles.formGroup}>
                     <label style={styles.label}>Tags</label>
                     <div style={styles.tagContainer}>
                        {['NEW', 'SALE', 'BESTSELLER', 'LIMITED', 'SUMMER', 'WINTER', 'Customizeable'].map(tag => (
                             <div 
                                key={tag}
                                onClick={() => handleArrayChange('tags', tag)}
                                style={{...styles.tag, ...(product.tags.includes(tag) ? styles.activeTag : {})}}
                             >
                                {product.tags.includes(tag) && <FiCheck />} {tag}
                             </div>
                        ))}
                     </div>
                </div>
            </div>
            
            <div style={styles.gridContainer}>
                <div style={styles.formGroup}>
                     <label style={styles.label}>Shipping Info</label>
                     <input type="text" name="shipping" value={product.shipping} onChange={handleChange} style={getInputStyle('shipping')} />
                </div>
                <div style={styles.formGroup}>
                     <label style={styles.label}>Warranty</label>
                     <input type="text" name="warranty" value={product.warranty} onChange={handleChange} style={getInputStyle('warranty')} />
                </div>
            </div>

            <div style={styles.formGroup}>
                <label style={styles.label}>Bulk Discount</label>
                <input type="text" name="bulk_discount" value={product.bulk_discount} onChange={handleChange} style={getInputStyle('bulk_discount')} />
            </div>
            
            <div style={styles.formGroup}>
                 <label style={styles.label}>Features</label>
                 <div style={{marginBottom: '1rem'}}>
                    {product.features.map((feature, idx) => (
                        <span key={idx} style={{...styles.tag, display: 'inline-flex', marginRight: '10px', marginBottom: '10px', cursor: 'default', color: '#E0E0E0', background: 'rgba(255,255,255,0.05)', border: '1px solid #333'}}>
                            {feature}
                            <FiX style={{cursor: 'pointer', marginLeft: '5px', color: '#ef4444'}} onClick={() => setProduct(p => ({...p, features: p.features.filter((_, i) => i !== idx)}))} />
                        </span>
                    ))}
                 </div>
                 <button type="button" onClick={addFeature} style={{background: 'transparent', border: '1px dashed #FFA500', color: '#FFA500', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
                    <FiPlus /> Add Feature
                 </button>
            </div>

            {/* Images Section */}
            <div style={styles.sectionTitle}>
                <div style={{display:'flex', alignItems:'center', gap: '8px'}}><FiUpload /> Product Images</div>
            </div>

            <div style={styles.formGroup}>
                <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    style={{display: 'none'}}
                />
                <label 
                    htmlFor="image-upload" 
                    style={styles.fileUploadArea}
                    onMouseEnter={() => setIsFileLabelHovered(true)}
                    onMouseLeave={() => setIsFileLabelHovered(false)}
                >
                    {isUploading ? (
                         <div style={{color: '#FFA500'}}>Uploading... {Math.round(uploadProgress)}%</div>
                    ) : (
                        <>
                            <div style={{width: '60px', height: '60px', background: 'rgba(255,165,0,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <FiUpload size={24} color="#FFA500"/>
                            </div>
                            <div>
                                <h4 style={{margin: '0 0 5px 0', color: '#E0E0E0'}}>Click to upload or drag and drop</h4>
                                <p style={{margin: 0, color: '#888', fontSize: '0.85rem'}}>SVG, PNG, JPG or GIF (max. 800x400px)</p>
                            </div>
                        </>
                    )}
                </label>

                {previews.length > 0 && (
                    <div style={styles.previewGrid}>
                        {previews.map((preview, index) => (
                            <motion.div 
                                key={index} 
                                layout
                                style={styles.previewCard}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e)}
                                onDrop={(e) => handleDrop(e, index)}
                                whileHover={{ scale: 1.02 }}
                            >
                                <img src={preview} alt="Preview" style={styles.previewImage} />
                                <button type="button" style={styles.removeBtn} onClick={() => removeImage(index)}><FiX size={14}/></button>
                                <div style={{position: 'absolute', bottom: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '4px', cursor: 'grab'}}>
                                    <FiMove size={12} color="white"/>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <motion.button
                type="submit"
                style={styles.submitButton}
                whileHover={{ scale: 1.01, boxShadow: '0 12px 25px rgba(255, 165, 0, 0.35)' }}
                whileTap={{ scale: 0.98 }}
                disabled={isUploading}
            >
                {isUploading ? (
                    <>
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%' }}
                    />
                    Uploading...
                    </>
                ) : <><FiUpload /> Upload Product</>}
            </motion.button>

          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminUpload;