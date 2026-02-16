import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSend, FiPaperclip, FiShoppingCart, FiX, FiMessageSquare, 
  FiClock, FiUser, FiMail, FiPhone, FiMapPin, FiEdit, FiCheck, 
  FiImage, FiChevronLeft, FiChevronRight, FiCheckCircle, 
  FiAlertCircle, FiLoader, FiExternalLink, FiDownload,
  FiFile, FiRefreshCw
} from 'react-icons/fi';
import { useCart } from '../pages/context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';
import { SOCKET_BASE, apiFetch, absoluteUrl } from '../utils/api';

// Firebase imports
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// Initialize Socket.IO client (uses shared SOCKET_BASE)
const socket = io(SOCKET_BASE, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// File icon mapping
const FILE_ICONS = {
  'image/jpeg': FiImage,
  'image/jpg': FiImage,
  'image/png': FiImage,
  'image/webp': FiImage,
  'image/gif': FiImage,
  'application/pdf': FiFile,
  'text/plain': FiFile,
  'application/msword': FiFile,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FiFile,
  'application/vnd.ms-excel': FiFile,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FiFile,
  'application/zip': FiFile,
  'application/vnd.rar': FiFile
};

// Country data with all countries
const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", 
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", 
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", 
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", 
  "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", 
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", 
  "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", 
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", 
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", 
  "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea North", "Korea South", "Kosovo", "Kuwait", "Kyrgyzstan", 
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", 
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", 
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", 
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", 
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", 
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", 
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", 
  "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", 
  "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", 
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", 
  "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", 
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// Auto-expanding TextArea Component
const AutoExpandingTextarea = ({ value, onChange, placeholder, disabled, onSend }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onSend) {
        onSend();
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      onKeyPress={handleKeyPress}
      style={{
        width: '100%',
        padding: '12px 15px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '25px',
        color: '#fff',
        fontSize: '15px',
        overflow: 'hidden',
        outline: 'none',
        resize: 'none',
        minHeight: '20px',
        maxHeight: '120px',
        fontFamily: 'inherit',
        lineHeight: '1.4'
      }}
      rows={1}
    />
  );
};

// File Preview Component
const FilePreview = ({ file, onRemove, isUploaded = false }) => {
  const isImage = file.type && file.type.startsWith('image/');
  const previewUrl = isImage && !isUploaded ? URL.createObjectURL(file) : null;
  const FileIcon = FILE_ICONS[file.type] || FiFile;
  
  const handleDownload = () => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      fontSize: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      maxWidth: '200px'
    }}>
      {isImage && previewUrl ? (
        <img 
          src={previewUrl} 
          alt="Preview" 
          style={{
            width: '24px',
            height: '24px',
            objectFit: 'cover',
            borderRadius: '4px'
          }}
        />
      ) : (
        <FileIcon size={14} />
      )}
      
      <span style={{ 
        maxWidth: '120px', 
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {file.name}
      </span>
      
      {isUploaded ? (
        <button 
          onClick={handleDownload}
          style={{
            background: 'none',
            border: 'none',
            color: '#3498db',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Download file"
        >
          <FiDownload size={12} />
        </button>
      ) : (
        <button 
          onClick={() => onRemove(file)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ff6b6b',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Remove file"
        >
          <FiX size={12} />
        </button>
      )}
    </div>
  );
};

// File Message Component
const FileMessage = ({ files, sender }) => {
  return (
    <div style={{ marginTop: '8px' }}>
      {files.map((file, index) => {
        const FileIcon = FILE_ICONS[file.type] || FiFile;
        const isImage = file.type && file.type.startsWith('image/');
        
        return (
          <div key={index} style={{ 
            padding: '8px 12px', 
            background: 'rgba(255,255,255,0.15)', 
            borderRadius: '8px',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            maxWidth: '300px'
          }}
          onClick={() => window.open(file.url, '_blank')}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
          }}>
            
            {isImage ? (
              <img
                src={file.url}
                alt={file.name}
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '4px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <FileIcon size={16} />
            )}
            
            <div style={{ 
              display: isImage ? 'none' : 'flex',
              width: '40px',
              height: '40px',
              background: 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              color: 'rgba(255,255,255,0.5)'
            }}>
              <FiImage size={16} />
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '500' }}>{file.name}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'File'}
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.open(file.url, '_blank');
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FiExternalLink size={10} />
              Open
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Image Message Component
const ImageMessage = ({ files }) => {
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '8px',
        maxWidth: '300px'
      }}>
        {files.map((file, index) => (
          <div key={index} style={{
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
          onClick={() => window.open(file.url, '_blank')}>
            <img
              src={file.url}
              alt={file.name}
              style={{
                width: '100%',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div style={{
              display: 'none',
              width: '100%',
              height: '80px',
              background: 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.5)'
            }}>
              <FiImage size={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Product photo processing function
const processProductPhotos = (photos) => {
  if (!photos) return [];
  
  let processedPhotos = [];
  
  try {
    if (typeof photos === 'string') {
      processedPhotos = JSON.parse(photos);
    } else if (Array.isArray(photos)) {
      processedPhotos = photos;
    }
    
    if (!Array.isArray(processedPhotos)) {
      processedPhotos = [];
    }
    
    return processedPhotos.map(photo => {
      if (!photo) return '';
      if (photo.startsWith('http')) return photo;
      return absoluteUrl(photo);
    });
    
  } catch (e) {
    console.error('Error parsing product photos:', e);
    return [];
  }
};

// Image URL helper
const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return absoluteUrl(imagePath);
};

// Product Gallery Component
const ProductGallery = ({ product, isMobile }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const safeProduct = {
    product_photos: [],
    ...product
  };

  const processedPhotos = processProductPhotos(safeProduct.product_photos);

  const nextImage = () => {
    if (processedPhotos.length === 0) return;
    setCurrentImageIndex(prev => 
      prev === processedPhotos.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (processedPhotos.length === 0) return;
    setCurrentImageIndex(prev => 
      prev === 0 ? processedPhotos.length - 1 : prev - 1
    );
  };

  if (processedPhotos.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: isMobile ? '150px' : '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2d2d2d',
        borderRadius: '8px',
        color: '#fff'
      }}>
        <FiImage size={32} />
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: isMobile ? '150px' : '200px',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#2d2d2d'
    }}>
      {/* Main Image */}
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}>
        <img
          src={getImageUrl(processedPhotos[currentImageIndex])}
          alt={product.product_name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* Thumbnails */}
      {processedPhotos.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '5px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '4px'
        }}>
          {processedPhotos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              style={{
                width: '10px',
                height: '10px',
                margin: '0 3px',
                borderRadius: '50%',
                border: 'none',
                background: currentImageIndex === index ? '#FFD700' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Price rendering function
const renderPriceRange = (item) => {
  const parseNumeric = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  };

  const rawMin = item?.min_price ?? item?.discounted_price ?? item?.price;
  const rawMax = item?.max_price ?? item?.price;
  const min = parseNumeric(rawMin);
  const max = parseNumeric(rawMax);
  const discounted = parseNumeric(item?.discounted_price);

  const hasPriceRange = min !== null && max !== null && min !== max;

  if (hasPriceRange) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <span style={{
          fontSize: '18px',
          fontWeight: '700',
          background: 'linear-gradient(90deg, #FFD700, #FFA500, #FF8C00)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block'
        }}>
          ${min?.toFixed(2) ?? '—'} - ${max?.toFixed(2) ?? '—'}
        </span>
        
        {discounted !== null && discounted !== min && (
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#95a5a6',
            textDecoration: 'line-through'
          }}>
            ${discounted.toFixed(2)}
          </span>
        )}
      </div>
    );
  } else {
    const displayPrice = min ?? max;
    const priceText = displayPrice !== null ? `$${displayPrice.toFixed(2)}` : 'Price on request';
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <span style={{
          fontSize: '18px',
          fontWeight: '700',
          background: discounted !== null && discounted !== displayPrice 
            ? 'linear-gradient(90deg, #FFD700, #FFA500, #FF8C00)'
            : 'none',
          WebkitBackgroundClip: discounted !== null && discounted !== displayPrice ? 'text' : 'unset',
          WebkitTextFillColor: discounted !== null && discounted !== displayPrice ? 'transparent' : '#fff',
          display: 'inline-block'
        }}>
          {priceText}
        </span>
        
        {discounted !== null && displayPrice !== null && discounted !== displayPrice && (
          <>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#95a5a6',
              textDecoration: 'line-through'
            }}>
              ${discounted.toFixed(2)}
            </span>
            {displayPrice > 0 && (
              <span style={{
                padding: '2px 6px',
                background: '#e74c3c',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#fff'
              }}>
                {Math.round((1 - discounted / displayPrice) * 100)}% OFF
              </span>
            )}
          </>
        )}
      </div>
    );
  }
};

// Product Details Component
const ProductDetails = ({ product, isMobile }) => {
  const safeProduct = {
    id: '',
    product_name: '',
    product_details: '',
    price: 0,
    min_price: 0,
    max_price: 0,
    discounted_price: null,
    category: '',
    subcategory: '',
    moq: 500,
    material: '',
    care_instructions: '',
    sku: '',
    shipping_info: '',
    warranty: '',
    bulk_discount: '',
    rating: 0,
    product_photos: [],
    sizes: [],
    colors: [],
    tags: [],
    features: [],
    ...product
  };

  const processedTags = Array.isArray(safeProduct.tags) ? safeProduct.tags : [];
  const processedFeatures = Array.isArray(safeProduct.features) ? safeProduct.features : [];

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      padding: isMobile ? '10px' : '15px',
      marginBottom: '10px'
    }}>
      {/* Product Tags */}
      {processedTags.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '8px',
          flexWrap: 'wrap'
        }}>
          {processedTags.map((tag, index) => (
            <span 
              key={index}
              style={{
                padding: '2px 5px',
                borderRadius: '3px',
                fontSize: isMobile ? '9px' : '10px',
                fontWeight: '700',
                color: '#fff',
                textTransform: 'uppercase',
                background: 
                  tag === 'NEW' ? '#3498db' : 
                  tag === 'SALE' ? '#e74c3c' : 
                  tag === 'BESTSELLER' ? '#f39c12' : 
                  tag === 'LIMITED' ? '#9b59b6' : '#2c3e50'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Product Title */}
      <h3 style={{
        margin: '0 0 6px 0',
        fontSize: isMobile ? '16px' : '18px',
        fontWeight: '700',
        color: '#fff',
        lineHeight: '1.3'
      }}>
        {safeProduct.product_name}
      </h3>
      
      {/* SKU */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px',
        fontSize: isMobile ? '11px' : '12px',
        color: '#bdc3c7'
      }}>
        <span>SKU: {safeProduct.sku || 'N/A'}</span>
      </div>
      
      {/* Price */}
      <div style={{ marginBottom: '8px' }}>
        {renderPriceRange(safeProduct)}
      </div>
      
      
      
      {/* MOQ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginBottom: '8px',
        fontSize: isMobile ? '11px' : '12px',
        color: '#bdc3c7'
      }}>
        <span>Minimum Order: {safeProduct.moq} units</span>
      </div>
      
      {/* Product Description (Shortened) */}
      {safeProduct.product_details && (
        <div style={{
          fontSize: isMobile ? '11px' : '12px',
          lineHeight: '1.4',
          color: '#bdc3c7',
          marginBottom: '8px',
          maxHeight: isMobile ? '45px' : '60px',
          overflow: 'hidden'
        }}>
          {safeProduct.product_details.substring(0, isMobile ? 100 : 150)}
          {safeProduct.product_details.length > (isMobile ? 100 : 150) ? '...' : ''}
        </div>
      )}
      
      {/* Key Features */}
      {processedFeatures.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{
            fontSize: isMobile ? '11px' : '12px',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '4px'
          }}>Key Features:</div>
          <ul style={{
            margin: 0,
            paddingLeft: '12px',
            fontSize: isMobile ? '10px' : '11px',
            color: '#bdc3c7',
            lineHeight: '1.3'
          }}>
            {processedFeatures.slice(0, 3).map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
            {processedFeatures.length > 3 && (
              <li>+ {processedFeatures.length - 3} more features</li>
            )}
          </ul>
        </div>
      )}
      
      {/* Material and Care */}
      {(safeProduct.material || safeProduct.care_instructions) && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '4px',
          fontSize: isMobile ? '10px' : '11px',
          color: '#bdc3c7'
        }}>
          {safeProduct.material && <div><strong>Material:</strong> {safeProduct.material}</div>}
          {safeProduct.care_instructions && <div><strong>Care:</strong> {safeProduct.care_instructions}</div>}
        </div>
      )}
    </div>
  );
};

// Product Loader Component
const ProductLoader = ({ isMobile }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: isMobile ? '10px' : '15px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    gap: isMobile ? '10px' : '15px',
    alignItems: 'center'
  }}>
    <div style={{
      width: isMobile ? '80px' : '100px',
      height: isMobile ? '80px' : '100px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff'
    }}>
      <FiLoader size={24} className="spin" />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{
        height: isMobile ? '16px' : '18px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        marginBottom: '8px',
        width: '80%'
      }}></div>
      <div style={{
        height: isMobile ? '12px' : '14px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        marginBottom: '6px',
        width: '60%'
      }}></div>
      <div style={{
        height: isMobile ? '10px' : '12px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        marginBottom: '6px',
        width: '40%'
      }}></div>
    </div>
  </div>
);

// Authentication Components
const LoginForm = ({ onClose, onSuccess, isMobile }) => {
  const [loginStep, setLoginStep] = useState('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpType, setOtpType] = useState('login');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        await handleFirebaseLogin(user);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFirebaseLogin = async (firebaseUser) => {
    try {
      setLoading(true);
      
      const response = await apiFetch('/api/user/auth/firebase-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified
          }
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('userToken', data.token);
        onSuccess(data.user);
        toast.success('Login successful!');
      } else {
        console.error('Backend authentication failed:', data.message);
        await signOut(auth);
        toast.error('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Firebase login error:', error);
      await signOut(auth);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (email, type = 'login') => {
    setLoading(true);
    try {
      const endpoint = type === 'login' 
        ? '/api/user/login/send-otp'
        : '/api/user/register/send-otp';
      
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setOtpType(type);
        setLoginStep('otp');
        setOtpCountdown(60);
        toast.success('OTP sent successfully to your email!');
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Email not registered. Please create an account by pressing the button below.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (email, otp, type = 'login') => {
    setLoading(true);
    try {
      const endpoint = type === 'login' 
        ? '/api/user/login/verify-otp'
        : '/api/user/register/verify-otp';
      
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('userToken', data.token);
        onSuccess(data.user);
        setLoginStep('email');
        setLoginEmail('');
        setLoginOtp('');
        setOtpCountdown(0);
        toast.success(type === 'login' ? 'Login successful!' : 'Registration successful!');
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Failed to verify OTP. Please try again.');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) {
      toast.info(`Please wait ${otpCountdown} seconds before requesting a new OTP`);
      return;
    }

    setLoading(true);
    try {
      const endpoint = otpType === 'login' 
        ? '/api/user/login/send-otp'
        : '/api/user/register/send-otp';
      
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: loginEmail })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setOtpCountdown(60);
        toast.success('OTP resent successfully!');
      } else {
        toast.error(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast.error('Failed to resend OTP. Please try again.');
    }
    setLoading(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '15px',
        padding: isMobile ? '20px' : '30px',
        maxWidth: '400px',
        width: '100%',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#FFD700', marginBottom: '10px' }}>
          {loginStep === 'email' ? 'Sign In / Sign Up' : 'Verify Your Email'}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          {loginStep === 'email' 
            ? 'Please sign in or create an account to continue' 
            : 'Enter the verification code sent to your email'}
        </p>
      </div>

      {/* Email Input Step */}
      {loginStep === 'email' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
        >
          <div>
            <label style={{ 
              display: 'block', 
              color: 'rgba(255, 255, 255, 0.8)', 
              marginBottom: '8px' 
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Enter your email address"
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => handleSendOtp(loginEmail, 'login')}
              disabled={loading || !loginEmail}
              style={{
                background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                color: 'black',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: loading || !loginEmail ? 'not-allowed' : 'pointer',
                opacity: loading || !loginEmail ? 0.6 : 1
              }}
            >
              {loading ? 'Sending OTP...' : 'Sign In with Email'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '10px 0' }}>
                Don't have an account?
              </p>
              <button
                onClick={() => {
                  setOtpType('registration');
                  handleSendOtp(loginEmail, 'registration');
                }}
                disabled={loading || !loginEmail}
                style={{
                  background: 'transparent',
                  color: '#FFD700',
                  border: '2px solid #FFD700',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: loading || !loginEmail ? 'not-allowed' : 'pointer',
                  opacity: loading || !loginEmail ? 0.6 : 1,
                  width: '100%'
                }}
              >
                Create New Account
              </button>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '10px 0',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
            <span style={{ padding: '0 10px', fontSize: '12px' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <FiUser />
            Continue with Google
          </button>
        </motion.div>
      )}

      {/* OTP Verification Step */}
      {loginStep === 'otp' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#FFD700', marginBottom: '5px' }}>
              {otpType === 'login' ? 'Sign In Verification' : 'Account Verification'}
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              We sent a 6-digit code to
            </p>
            <p style={{ color: '#FFD700', fontWeight: 'bold' }}>
              {loginEmail}
            </p>
            {otpCountdown > 0 && (
              <p style={{ color: '#ff4444', fontSize: '12px', marginTop: '5px' }}>
                OTP expires in: {formatTime(otpCountdown)}
              </p>
            )}
          </div>

          <input
            type="text"
            value={loginOtp}
            onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            style={{
              width: '100%',
              padding: '15px',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '18px',
              textAlign: 'center',
              letterSpacing: '10px',
              outline: 'none',
              fontWeight: 'bold'
            }}
          />

          <button
            onClick={() => handleVerifyOtp(loginEmail, loginOtp, otpType)}
            disabled={loading || loginOtp.length !== 6}
            style={{
              background: 'linear-gradient(135deg, #FFA500, #FFD700)',
              color: 'black',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading || loginOtp.length !== 6 ? 'not-allowed' : 'pointer',
              opacity: loading || loginOtp.length !== 6 ? 0.6 : 1
            }}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleResendOtp}
              disabled={loading || otpCountdown > 0}
              style={{
                background: 'transparent',
                border: 'none',
                color: otpCountdown > 0 ? 'rgba(255, 215, 0, 0.5)' : '#FFD700',
                cursor: loading || otpCountdown > 0 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                textDecoration: 'underline',
                marginRight: '10px'
              }}
            >
              {loading ? 'Sending...' : otpCountdown > 0 ? `Resend OTP (${formatTime(otpCountdown)})` : 'Resend OTP'}
            </button>
            
            <button
              onClick={() => setLoginStep('email')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFD700',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline'
              }}
            >
              ← Back to Email
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const ProfileCompletionForm = ({ user, onComplete, onSkip, isMobile }) => {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    company: user?.company || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || '',
    country: user?.country || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('userToken');
      const response = await apiFetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.success) {
        onComplete(data.user);
        toast.success('Profile completed successfully!');
      } else {
        toast.error(data.message || 'Failed to complete profile');
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      toast.error('Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.first_name && formData.last_name && formData.phone;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '15px',
        padding: isMobile ? '20px' : '30px',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#FFD700', marginBottom: '10px' }}>
          Complete Your Profile
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Please provide your information to continue with the inquiry
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px', fontSize: '12px' }}>
              First Name *
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px', fontSize: '12px' }}>
              Last Name *
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px', fontSize: '12px' }}>
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px', fontSize: '12px' }}>
            Company
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px', fontSize: '12px' }}>
              Country
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({...formData, country: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px', fontSize: '12px' }}>
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
            }}
          />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            type="submit"
            disabled={loading || !isFormValid}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #FFA500, #FFD700)',
              color: 'black',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading || !isFormValid ? 'not-allowed' : 'pointer',
              opacity: loading || !isFormValid ? 0.6 : 1
            }}
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const Inquiry = () => {
  const { cartItems, clearCart, setInquiryCheckoutProduct } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const directInquiryProduct = location.state?.product;
  const isDirectInquiry = location.state?.directInquiry;
  
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showProfileCompletionPopup, setShowProfileCompletionPopup] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inquiryInfo, setInquiryInfo] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    country: '',
    userId: ''
  });
  const [activeTab, setActiveTab] = useState('chat');
  const [currentInquiry, setCurrentInquiry] = useState(null);
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [productsData, setProductsData] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [isCheckoutActive, setIsCheckoutActive] = useState(false);
  const [priceData, setPriceData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasSentWelcomeMessage, setHasSentWelcomeMessage] = useState(false);
  const [hasAutoSentInitialMessage, setHasAutoSentInitialMessage] = useState(false);
  
  // FIXED: Track processed messages to prevent duplicates
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());
  const [hasInitializedInquiry, setHasInitializedInquiry] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  // Track which inquiries already got the auto customer message (guards dup sends across renders/socket reconnects)
  const sentInitialMessageRef = useRef(new Set());

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Generate initial inquiry message
  const generateInitialInquiryMessage = (product) => {
    const displayProduct = product || (productsData.length > 0 ? productsData[0] : null);
    
    if (!displayProduct) return '';
    
    const productName = displayProduct.product_name || displayProduct.name || 'Product';
    const quantity = displayProduct.quantity || 1;
    const size = displayProduct.selectedSize || 'Customizable';
    const minPrice = displayProduct.min_price || displayProduct.discounted_price || displayProduct.price || 0;
    const maxPrice = displayProduct.max_price || displayProduct.price || 0;
    const moq = displayProduct.moq || 500;
    const sku = displayProduct.sku || 'N/A';
    
    return `Product Inquiry: ${productName.toUpperCase()}

Product Details:
- Quantity: ${quantity} units
- Size: ${size}
- Price Range: $${minPrice.toFixed(1)} - $${maxPrice.toFixed(1)}
- MOQ: ${moq} units
- SKU: ${sku}

Please provide your best price for this quantity.`;
  };

  // Function to send automatic welcome message from admin
  const sendWelcomeMessage = async (inquiryId) => {
    try {
      const welcomeMessage = {
        inquiryId: inquiryId,
        message: `Thank you for your inquiry! We appreciate your interest in our products. Our sales team will review your request and get back to you shortly. Please keep an eye on your email and this message center for updates.`,
        senderType: 'admin',
        timestamp: new Date().toISOString()
      };

      socket.emit('send_message', welcomeMessage);
      console.log('Welcome message sent to inquiry:', inquiryId);
      
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  };

  // Function to automatically send initial inquiry message
  const sendInitialInquiryMessage = async (inquiryId, product) => {
    try {
      // Idempotency: prevent sending the initial message more than once per inquiry
      const sentKey = `initialMessageSent:${inquiryId}`;
      if (
        !inquiryId ||
        hasAutoSentInitialMessage ||
        sessionStorage.getItem(sentKey) === 'true' ||
        sentInitialMessageRef.current.has(inquiryId)
      ) {
        console.log('Initial inquiry message already sent. Skipping duplicate send.');
        return;
      }
      // Pre-mark before any async work to avoid race conditions from rapid double-calls
      sentInitialMessageRef.current.add(inquiryId);
      const initialMessageText = generateInitialInquiryMessage(product);
      
      const initialMessage = {
        inquiryId: inquiryId,
        message: initialMessageText,
        senderType: 'user',
        timestamp: new Date().toISOString()
      };

      socket.emit('send_message', initialMessage);
      console.log('Initial inquiry message sent automatically');
      setHasAutoSentInitialMessage(true);
      sessionStorage.setItem(sentKey, 'true');
      
    } catch (error) {
      console.error('Error sending initial inquiry message:', error);
    }
  };

  // Enhanced initializeInquiry function - FIXED: Prevent duplicate initialization
  const initializeInquiry = async (userData) => {
    if (hasInitializedInquiry) {
      console.log('Inquiry already initialized, skipping...');
      return;
    }

    if (!directInquiryProduct && cartItems.length === 0) {
      console.log('No products available for inquiry');
      return;
    }

    const product = directInquiryProduct || cartItems[0];
    
    if (!product.id) {
      console.error('Product missing ID:', product);
      toast.error('Product information is incomplete');
      return;
    }

    try {
      console.log('Initializing inquiry for product:', product.id);
      setHasInitializedInquiry(true);
      
      const response = await apiFetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.user_id,
          product: {
            ...product,
            id: product.id,
            product_name: product.product_name || product.name,
            price: product.min_price || product.discounted_price || product.price,
            min_price: product.min_price || product.discounted_price || product.price,
            max_price: product.max_price || product.price,
            product_photos: product.product_photos || [],
            quantity: product.quantity || 1,
            selectedSize: product.selectedSize || 'Customizable'
          },
          customerInfo: {
            name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
            email: userData.email,
            phone: userData.phone,
            company: userData.company,
            country: userData.country,
            userId: userData.user_id
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.inquiry) {
        console.log('Inquiry initialized successfully:', data.inquiry.id);
        
        setCurrentInquiry(data.inquiry);
        setMessages(data.inquiry.messages || []);
        setIsCheckoutActive(data.inquiry.is_checkout_active);
        setPriceData(data.inquiry.price_data);
        
        // Join Socket.IO room
        if (socket.connected && data.inquiry.id) {
          socket.emit('join_inquiry', data.inquiry.id);
          console.log('Joined Socket.IO room:', data.inquiry.id);
        }
        
        // Send automatic messages only for brand new inquiries (guard against duplicates)
        if (data.isNewInquiry && !hasAutoSentInitialMessage) {
          // Mark as sent BEFORE scheduling to avoid race conditions from double init
          setHasAutoSentInitialMessage(true);

          // Send initial inquiry message from user first (once per inquiry id)
          const sentKey = `initialMessageSent:${data.inquiry.id}`;
          if (sessionStorage.getItem(sentKey) !== 'true') {
            setTimeout(() => {
              sendInitialInquiryMessage(data.inquiry.id, product);
            }, 500);
          }

          // Then send welcome message from admin after a short delay
          setTimeout(() => {
            if (!hasSentWelcomeMessage) {
              sendWelcomeMessage(data.inquiry.id);
              setHasSentWelcomeMessage(true);
            }
          }, 2500);
        }
        
        setShouldScrollToBottom(true);
      } else {
        console.error('Inquiry creation failed:', data.message);
        toast.error('Failed to create inquiry: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error initializing inquiry:', error);
      setHasInitializedInquiry(false); // Reset on error
      toast.error('Failed to initialize inquiry: ' + error.message);
    }
  };

  // Socket.IO useEffect - FIXED: Enhanced duplicate message prevention
  useEffect(() => {
    console.log('Setting up Socket.IO connection...');

    const handleNewMessage = (message) => {
      // console.log('New message received:', message);
      // Ignore echo of user's own messages to prevent duplicates
      if (message && message.sender_type === 'user') {
        return;
      }
      
      if (message.inquiryId === currentInquiry?.id) {
        setMessages(prev => {
          // Enhanced duplicate detection
          const messageExists = prev.some(msg => 
            msg.id === message.id || 
            (msg.temporaryId && msg.temporaryId === message.temporaryId) ||
            (msg.message === message.message && msg.sender_type === message.sender_type && 
             Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 1000)
          );
          
          if (!messageExists) {
            const updatedMessages = [...prev, message];
            
            // Show notification only for new admin messages
            if (message.sender_type === 'admin' && !processedMessageIds.has(message.id)) {
              setProcessedMessageIds(prev => new Set([...prev, message.id]));
              // toast.info('New message from admin');
            }
            
            return updatedMessages;
          }
          return prev;
        });
        setShouldScrollToBottom(true);
      }
    };

    const handleMessageSent = (data) => {
      console.log('Message sent confirmation:', data);
      
      if (data.success && data.message && data.message.inquiryId === currentInquiry?.id) {
        setMessages(prev => {
          return prev.map(msg => 
            msg.temporaryId === data.temporaryId 
              ? { ...data.message, id: data.message.id }
              : msg
          );
        });
      }
    };

    const handleMessageError = (data) => {
      console.error('Message error:', data);
      if (data.temporaryId) {
        setMessages(prev => prev.filter(msg => msg.temporaryId !== data.temporaryId));
      }
      toast.error(data.error || 'Failed to send message');
    };

    socket.on('connect', () => {
      console.log('Connected to server');
      if (currentInquiry) {
        socket.emit('join_inquiry', currentInquiry.id);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_error', handleMessageError);

    socket.on('inquiry_status_updated', (update) => {
      if (update.inquiryId === currentInquiry?.id) {
        setCurrentInquiry(prev => ({
          ...prev,
          status: update.status,
          updated_at: update.updated_at
        }));
      }
    });

    socket.on('checkout_activated', (data) => {
      if (data.inquiryId === currentInquiry?.id) {
        setIsCheckoutActive(true);
        setPriceData(data.prices);
        toast.success('Checkout has been activated! You can now proceed to purchase.');
      }
    });

    socket.on('admin_typing', () => {
      setIsTyping(true);
    });

    socket.on('admin_stop_typing', () => {
      setIsTyping(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('message_error', handleMessageError);
      socket.off('inquiry_status_updated');
      socket.off('checkout_activated');
      socket.off('admin_typing');
      socket.off('admin_stop_typing');
    };
  }, [currentInquiry, processedMessageIds]);

  // Join room when inquiry is selected
  useEffect(() => {
    if (currentInquiry && socket.connected) {
      socket.emit('join_inquiry', currentInquiry.id);
      console.log('Joined room:', currentInquiry.id);
    }

    return () => {
      if (currentInquiry) {
        socket.emit('leave_inquiry', currentInquiry.id);
      }
    };
  }, [currentInquiry]);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsInitializing(true);
      const token = localStorage.getItem('userToken');
      
      if (token) {
        try {
          const response = await apiFetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
              setUser(data.user);
              setIsLoggedIn(true);
              
              setInquiryInfo(prev => ({
                ...prev,
                name: `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim(),
                email: data.user.email || '',
                phone: data.user.phone || '',
                company: data.user.company || '',
                country: data.user.country || '',
                userId: data.user.user_id
              }));
              
              const needsCompletion = !data.user.first_name || !data.user.last_name || !data.user.phone;
              setNeedsProfileCompletion(needsCompletion);
              
              if (needsCompletion) {
                setShowProfileCompletionPopup(true);
              } else {
                setIsChatEnabled(true);
                initializeInquiry(data.user);
              }
            } else {
              localStorage.removeItem('userToken');
              setShowLoginPopup(true);
            }
          } else {
            localStorage.removeItem('userToken');
            setShowLoginPopup(true);
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          localStorage.removeItem('userToken');
          setShowLoginPopup(true);
        }
      } else {
        setShowLoginPopup(true);
      }
      setIsInitializing(false);
    };

    checkAuthStatus();
  }, []);

  // Load messages for current inquiry
  const loadMessages = async () => {
    if (!currentInquiry) return;
    
    try {
      const response = await apiFetch(`/api/inquiries/${currentInquiry.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.inquiry.messages);
          setShouldScrollToBottom(true);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Check checkout status
  const checkCheckoutStatus = async () => {
    if (!currentInquiry) return;
    
    try {
      const response = await apiFetch(`/api/inquiries/${currentInquiry.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsCheckoutActive(data.inquiry.is_checkout_active);
          setPriceData(data.inquiry.price_data);
        }
      }
    } catch (error) {
      console.error('Error checking checkout status:', error);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (shouldScrollToBottom && messagesContainerRef.current) {
      const scrollContainer = messagesContainerRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      setShouldScrollToBottom(false);
    }
  }, [messages, shouldScrollToBottom]);

  // Update window width
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle direct inquiry product
  useEffect(() => {
    if (isDirectInquiry && directInquiryProduct && isLoggedIn) {
      setProductsData([{
        ...directInquiryProduct,
        id: directInquiryProduct.id,
        product_name: directInquiryProduct.product_name || directInquiryProduct.name,
        name: directInquiryProduct.product_name || directInquiryProduct.name,
        price: directInquiryProduct.min_price || directInquiryProduct.discounted_price || directInquiryProduct.price,
        min_price: directInquiryProduct.min_price || directInquiryProduct.discounted_price || directInquiryProduct.price,
        max_price: directInquiryProduct.max_price || directInquiryProduct.price,
        discounted_price: directInquiryProduct.discounted_price,
        product_photos: directInquiryProduct.product_photos || [],
        product_details: directInquiryProduct.product_details || '',
        moq: directInquiryProduct.moq || 500,
        sku: directInquiryProduct.sku || '',
        material: directInquiryProduct.material || '',
        care_instructions: directInquiryProduct.care_instructions || '',
        shipping_info: directInquiryProduct.shipping_info || '',
        warranty: directInquiryProduct.warranty || '',
        tags: directInquiryProduct.tags || [],
        features: directInquiryProduct.features || [],
        category: directInquiryProduct.category || '',
        subcategory: directInquiryProduct.subcategory || '',
        selectedSize: directInquiryProduct.selectedSize || 'Customizable',
        quantity: directInquiryProduct.quantity || 1
      }]);
      setLoadingProducts(false);
    }
  }, [isDirectInquiry, directInquiryProduct, isLoggedIn]);

  // Fetch product details for cart items
  useEffect(() => {
    if (isDirectInquiry || !isLoggedIn) return;

    const fetchProductDetails = async () => {
      if (cartItems.length === 0) return;

      setLoadingProducts(true);
      try {
        const productPromises = cartItems.map(async (item) => {
          try {
            const response = await apiFetch(`/api/products/${item.id}`);
            if (!response.ok) throw new Error(`Failed to fetch product ${item.id}`);
            const productData = await response.json();
            return {
              ...item,
              ...productData,
              product_name: productData.product_name || item.name,
              product_details: productData.product_details || item.product_details,
              min_price: productData.min_price || item.min_price || item.price,
              max_price: productData.max_price || item.max_price || item.price,
              price: productData.price || item.price,
              discounted_price: productData.discounted_price || item.discounted_price,
              moq: productData.moq || item.moq,
              sku: productData.sku || item.sku,
              material: productData.material || item.material,
              care_instructions: productData.care_instructions || item.care_instructions,
              shipping_info: productData.shipping_info || item.shipping_info,
              warranty: productData.warranty || item.warranty,
              product_photos: productData.product_photos || item.product_photos,
              tags: productData.tags || item.tags,
              features: productData.features || item.features
            };
          } catch (error) {
            console.error(`Error fetching product ${item.id}:`, error);
            return item;
          }
        });

        const updatedProducts = await Promise.all(productPromises);
        setProductsData(updatedProducts);
      } catch (error) {
        console.error('Error fetching product details:', error);
        toast.error('Failed to load product details');
        setProductsData(cartItems);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProductDetails();
  }, [cartItems, isDirectInquiry, isLoggedIn]);

  // Real-time message polling fallback
  useEffect(() => {
    if (!isChatEnabled || !currentInquiry) return;

    const pollMessages = () => {
      loadMessages();
      checkCheckoutStatus();
    };

    const interval = setInterval(pollMessages, 5000);
    return () => clearInterval(interval);
  }, [isChatEnabled, currentInquiry, lastRefresh]);

  // File upload function
  const uploadFiles = async (files) => {
    if (!currentInquiry) {
      throw new Error('No inquiry available');
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const token = localStorage.getItem('userToken');
      const response = await apiFetch(`/api/inquiries/${currentInquiry.id}/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };

  const handleFileAttach = () => {
    if (!isChatEnabled) {
      toast.info('Please complete authentication first');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 
        'text/plain', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/vnd.rar'
      ];
      
      const validFiles = files.filter(file => allowedTypes.includes(file.type));
      
      if (validFiles.length === 0) {
        toast.error('Please select valid files (images, PDF, documents, archives)');
        return;
      }

      if (validFiles.length > 5) {
        toast.error('Maximum 5 files allowed at once');
        return;
      }

      const oversizedFiles = validFiles.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error('File size should be less than 10MB');
        return;
      }

      setAttachedFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) attached successfully`);
      e.target.value = '';
    }
  };

  const removeFile = (fileToRemove) => {
    setAttachedFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  // Enhanced send message function - FIXED: No duplicate messages
  const sendMessage = async (messageText, files = []) => {
    if ((!messageText.trim() && files.length === 0) || !isChatEnabled || !currentInquiry) return;

    let uploadedFiles = [];
    
    if (files.length > 0) {
      setIsUploading(true);
      try {
        uploadedFiles = await uploadFiles(files);
        console.log('Files uploaded successfully:', uploadedFiles);
      } catch (error) {
        toast.error('Failed to upload files');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const temporaryId = `temp-${Date.now()}`;
    const userMessage = {
      id: temporaryId,
      temporaryId: temporaryId,
      inquiry_id: currentInquiry.id,
      sender_type: 'user',
      message: messageText,
      files: uploadedFiles,
      timestamp: new Date().toISOString(),
      is_read: true
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setAttachedFiles([]);
    setIsLoading(true);
    setShouldScrollToBottom(true);

    try {
      socket.emit('send_message', {
        inquiryId: currentInquiry.id,
        message: messageText,
        senderType: 'user',
        files: uploadedFiles,
        temporaryId: temporaryId
      });

      console.log('Message sent via Socket.IO');

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.temporaryId !== temporaryId));
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Typing indicators
  const handleTypingStart = () => {
    if (currentInquiry) {
      socket.emit('typing_start', { 
        inquiryId: currentInquiry.id, 
        userId: user?.user_id 
      });
    }
  };

  const handleTypingStop = () => {
    if (currentInquiry) {
      socket.emit('typing_stop', { 
        inquiryId: currentInquiry.id, 
        userId: user?.user_id 
      });
    }
  };

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.trim()) {
      handleTypingStart();
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 1000);
    } else {
      handleTypingStop();
    }
  };

  const handleSendMessage = () => {
    handleTypingStop();
    sendMessage(newMessage, attachedFiles);
  };

  // Authentication handlers
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setShowLoginPopup(false);
    
    setInquiryInfo(prev => ({
      ...prev,
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
      email: userData.email || '',
      phone: userData.phone || '',
      company: userData.company || '',
      country: userData.country || '',
      userId: userData.user_id
    }));
    
    const needsCompletion = !userData.first_name || !userData.last_name || !userData.phone;
    setNeedsProfileCompletion(needsCompletion);
    
    if (needsCompletion) {
      setShowProfileCompletionPopup(true);
    } else {
      setIsChatEnabled(true);
      initializeInquiry(userData);
    }
  };

  const handleProfileCompletion = (userData) => {
    setUser(userData);
    setNeedsProfileCompletion(false);
    setShowProfileCompletionPopup(false);
    setIsChatEnabled(true);
    
    setInquiryInfo(prev => ({
      ...prev,
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
      phone: userData.phone || '',
      company: userData.company || '',
      country: userData.country || '',
      userId: userData.user_id
    }));

    initializeInquiry(userData);
  };

  const handleProfileSkip = () => {
    setShowProfileCompletionPopup(false);
    setIsChatEnabled(true);
    initializeInquiry(user);
    toast.info('You can complete your profile later');
  };

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    if (!isCheckoutActive) {
      toast.info('Checkout will be activated once the admin sets the prices');
      return;
    }

    const displayProducts = isDirectInquiry ? productsData : (productsData.length > 0 ? productsData : cartItems);
    
    if (displayProducts.length === 0) {
      toast.error('No products in inquiry');
      return;
    }

    try {
      setIsLoading(true);
      
      toast.success('Proceeding to checkout with approved prices!');
      
      // Use the new CartContext function to set inquiry product
      const productToCheckout = displayProducts[0]; // Get the first product
      setInquiryCheckoutProduct(
        productToCheckout,
        priceData,
        currentInquiry?.inquiry_number,
        currentInquiry?.id
      );
      
      // Navigate to checkout page
      setTimeout(() => {
        if (!isDirectInquiry) {
          clearCart();
        }
        // Navigate to checkout page
        window.location.href = `/Checkout?source=inquiry&inquiryId=${currentInquiry?.id}&inquiryNumber=${currentInquiry?.inquiry_number}`;
      }, 1000);
      
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Failed to proceed with checkout');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced message bubble with file support
  const getMessageBubbleStyle = (type) => {
    const baseStyle = {
      padding: isMobile ? '12px' : '15px',
      borderRadius: '18px',
      marginBottom: '12px',
      maxWidth: isMobile ? '85%' : '70%',
      alignSelf: type === 'user' ? 'flex-end' : 'flex-start',
      wordWrap: 'break-word',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      position: 'relative'
    };

    switch (type) {
      case 'user':
        return {
          ...baseStyle,
          background: 'rgba(52, 152, 219, 0.15)',
          border: '1px solid rgba(52, 152, 219, 0.3)',
          color: '#fff'
        };
      case 'admin':
        return {
          ...baseStyle,
          background: 'rgba(46, 204, 113, 0.15)',
          border: '1px solid rgba(46, 204, 113, 0.3)',
          color: '#fff'
        };
      default:
        return baseStyle;
    }
  };

  // Render message content with files
  const renderMessageContent = (msg) => {
    const hasImages = msg.files && msg.files.some(file => file.type && file.type.startsWith('image/'));
    const hasFiles = msg.files && msg.files.some(file => !file.type.startsWith('image/'));
    
    return (
      <>
        {msg.message && (
          <div style={{ 
            whiteSpace: 'pre-wrap', 
            marginBottom: msg.files && msg.files.length > 0 ? '8px' : '0',
            fontSize: isMobile ? '14px' : '15px',
            lineHeight: '1.4'
          }}>
            {msg.message}
          </div>
        )}
        
        {hasImages && (
          <ImageMessage files={msg.files.filter(file => file.type && file.type.startsWith('image/'))} />
        )}
        
        {hasFiles && (
          <FileMessage 
            files={msg.files.filter(file => !file.type.startsWith('image/'))} 
            sender={msg.sender_type}
          />
        )}
      </>
    );
  };

  const displayProducts = isDirectInquiry ? productsData : 
                         (productsData.length > 0 ? productsData : cartItems);

  // Format time function
  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  // Manual refresh function
  const manualRefresh = () => {
    setIsManualRefresh(true);
    setLastRefresh(Date.now());
    loadMessages();
    checkCheckoutStatus();
    setTimeout(() => setIsManualRefresh(false), 1000);
  };

  // Responsive styles
  const styles = {
    container: {
      minHeight: '100vh',
      marginBottom: '5vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: '#fff',
      margin: 0,
      padding: isMobile ? '10px' : isTablet ? '15px' : '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      boxSizing: 'border-box'
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '10px' : '20px'
    },
    header: {
      backdropFilter: 'blur(10px)',
      borderRadius: isMobile ? '8px' : '15px',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      width: '100%',
      margin: '0 auto 20px auto',
      padding: isMobile ? '12px' : '15px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '20px',
      gap: isMobile ? '10px' : '0'
    },
    inquiryNumber: {
      fontSize: isMobile ? '14px' : '16px',
      fontWeight: '700',
      background: 'linear-gradient(90deg, #FFD700, #FFA500)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    refreshButton: {
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      color: '#FFD700',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontWeight: '600',
      fontSize: '12px'
    },
    content: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 350px' : '1fr 400px',
      gap: isMobile ? '15px' : '20px',
      margin: '0 auto',
      marginBottom: '8vh'
    },
    chatContainer: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px',
      padding: isMobile ? '15px' : '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'hidden',
      padding: '10px',
      marginBottom: '15px',
      display: 'flex',
      flexDirection: 'column'
    },
    messageBubble: (type) => getMessageBubbleStyle(type),
    messageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '8px',
      fontSize: isMobile ? '6px' : '8px',
      gap: '6px',
      opacity: '0.8',
      fontWeight: '500'
    },
    inputContainer: {
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-end'
    },
    attachmentButton: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      borderRadius: '50%',
      width: isMobile ? '35px' : '40px',
      height: isMobile ? '35px' : '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isChatEnabled ? 'pointer' : 'not-allowed',
      color: '#fff',
      flexShrink: 0
    },
    sendButton: {
      background: isChatEnabled 
        ? 'linear-gradient(135deg, #3498db, #2980b9)'
        : 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      borderRadius: '50%',
      width: isMobile ? '45px' : '50px',
      height: isMobile ? '45px' : '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isChatEnabled ? 'pointer' : 'not-allowed',
      flexShrink: 0
    },
    sidebar: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px',
      padding: isMobile ? '15px' : '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      height: 'fit-content',
      position: 'sticky',
      top: '70px'
    },
    tabContainer: {
      display: 'flex',
      gap: '8px',
      marginBottom: '15px'
    },
    tabButton: (isActive) => ({
      flex: 1,
      padding: isMobile ? '10px' : '12px',
      background: isActive ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
      border: isActive ? '1px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      color: isActive ? '#FFD700' : '#fff',
      cursor: 'pointer',
      textAlign: 'center',
      fontWeight: '600',
      fontSize: isMobile ? '13px' : '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '5px'
    }),
    chatDisabledOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '15px',
      zIndex: 10,
      padding: '20px'
    },
    statusIndicator: {
      display:  'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: isMobile ? '10px' : '12px',
      fontWeight: '600',
    },
    filePreviewContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginBottom: '10px',
      padding: '10px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    infoOverview: {
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      padding: isMobile ? '12px' : '15px',
      marginBottom: '15px'
    },
    infoItem: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
      fontSize: isMobile ? '13px' : '14px'
    },
    editButton: {
      background: 'rgba(255, 215, 0, 0.2)',
      border: '1px solid #FFD700',
      borderRadius: '5px',
      padding: '6px 10px',
      color: '#FFD700',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: isMobile ? '11px' : '12px'
    },
    productsGrid: {
      display: 'grid',
      gap: '12px',
      overflowY: 'auto'
    },
    productCard: {
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      padding: isMobile ? '12px' : '15px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    typingIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 15px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '18px',
      alignSelf: 'flex-start',
      maxWidth: '150px',
      marginBottom: '12px',
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)'
    },
    sendingIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 15px',
      background: 'rgba(52, 152, 219, 0.1)',
      borderRadius: '18px',
      alignSelf: 'flex-end',
      maxWidth: '120px',
      marginBottom: '12px',
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)'
    }
  };

  // Show loading during initialization
  if (isInitializing) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <FiLoader size={40} className="spin" style={{ marginBottom: '20px', color: '#FFD700' }} />
          <p>Loading Inquiry Page...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} ref={containerRef}>
      {/* Login Popup */}
      <AnimatePresence>
        {showLoginPopup && (
          <motion.div
            style={styles.overlay}
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

      {/* Profile Completion Popup */}
      <AnimatePresence>
        {showProfileCompletionPopup && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProfileCompletionForm 
              user={user}
              onComplete={handleProfileCompletion}
              onSkip={handleProfileSkip}
              isMobile={isMobile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <div style={styles.inquiryNumber}>
            {isLoggedIn && currentInquiry ? `Inquiry #: ${currentInquiry.inquiry_number}` : 
             isLoggedIn ? 'Setting up your inquiry..' : 'Please Sign In to Continue'}
          </div>
          <button 
            style={styles.refreshButton}
            onClick={manualRefresh}
            disabled={isManualRefresh}
          >
            <FiRefreshCw className={isManualRefresh ? 'spin' : ''} />
            {isManualRefresh ? '' : ''}
          </button>
        </div>
        
        {/* Status indicators */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '10px' : '15px', 
          flexWrap: 'wrap',
          marginTop: isMobile ? '10px' : '0'
        }}>
          {isTyping && (
            <div style={styles.typingIndicator}>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              Admin is typing...
            </div>
          )}
          <div style={{ 
            ...styles.statusIndicator, 
            background: isChatEnabled ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            color: isChatEnabled ? '#2ecc71' : '#fff'
          }}>
            {isChatEnabled ? '✓ Chat Enabled' : 
             isLoggedIn ? '⏳ Complete Profile to Enable Chat' : '🔒 Sign In Required'}
          </div>
          {isCheckoutActive && (
            <div style={{ 
              ...styles.statusIndicator, 
              background: 'rgba(46, 204, 113, 0.2)',
              color: '#2ecc71'
            }}>
              <FiCheckCircle size={12} style={{ marginRight: '5px' }} />
              Checkout Active
            </div>
          )}
          {loadingProducts && (
            <div style={{ 
              ...styles.statusIndicator, 
              background: 'rgba(52, 152, 219, 0.2)',
              color: '#3498db'
            }}>
              <FiLoader size={12} className="spin" style={{ marginRight: '5px' }} />
              Loading Product Details...
            </div>
          )}
        </div>
      </div>

      {isLoggedIn ? (
        <div style={styles.content}>
          {/* Left Column - Chat and Products */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Tabs */}
            <div style={styles.tabContainer}>
              <button 
                style={styles.tabButton(activeTab === 'chat')}
                onClick={() => setActiveTab('chat')}
              >
                <FiMessageSquare size={isMobile ? 14 : 16} />
                {isMobile ? 'Chat' : 'Live Chat'} {!isChatEnabled && '🔒'}
              </button>
              <button 
                style={styles.tabButton(activeTab === 'products')}
                onClick={() => setActiveTab('products')}
              >
                <FiShoppingCart size={isMobile ? 14 : 16} />
                {isMobile ? 'Products' : (isDirectInquiry ? 'Product Details' : `Products (${displayProducts.length})`)}
              </button>
            </div>

            {/* Chat Container */}
            {activeTab === 'chat' && (
              <div style={styles.chatContainer}>
                {!isChatEnabled && (
                  <div style={styles.chatDisabledOverlay}>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <FiMessageSquare size={isMobile ? 36 : 48} style={{ marginBottom: '10px', opacity: 0.7 }} />
                      <h3>Complete Your Profile</h3>
                      <p>Please complete your profile information to enable live chat</p>
                      <button 
                        style={{
                          background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                          color: 'black',
                          border: 'none',
                          padding: '12px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          marginTop: '10px'
                        }}
                        onClick={() => setShowProfileCompletionPopup(true)}
                      >
                        Complete Profile
                      </button>
                    </div>
                  </div>
                )}
                
                <div 
                  ref={messagesContainerRef}
                  style={styles.messagesContainer}
                >
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id || msg.temporaryId}
                      style={styles.messageBubble(msg.sender_type)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderMessageContent(msg)}
                      <div style={styles.messageHeader}>
                        <span>{msg.sender_type === 'user' ? 'You' : 'Admin'}</span>
                        <span>{formatTime(msg.timestamp)}</span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <div style={styles.typingIndicator}>
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      Admin is typing...
                    </div>
                  )}
                  
                  {(isLoading || isUploading) && (
                    <motion.div
                      style={styles.sendingIndicator}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #fff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <span>{isUploading ? 'Uploading...' : 'Sending...'}</span>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* File Previews */}
                {attachedFiles.length > 0 && (
                  <div style={styles.filePreviewContainer}>
                    {attachedFiles.map((file, index) => (
                      <FilePreview
                        key={index}
                        file={file}
                        onRemove={removeFile}
                      />
                    ))}
                  </div>
                )}

                <div style={styles.inputContainer}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip,.rar"
                    multiple
                  />
                  <button 
                    style={styles.attachmentButton}
                    onClick={handleFileAttach}
                    title="Attach files"
                    disabled={!isChatEnabled}
                  >
                    <FiPaperclip />
                  </button>
                  <AutoExpandingTextarea
                    value={newMessage}
                    onChange={handleMessageChange}
                    placeholder={isChatEnabled ? "Type your message..." : "Complete your profile to enable chat"}
                    disabled={!isChatEnabled || isUploading}
                    onSend={handleSendMessage}
                  />
                  <button 
                    style={styles.sendButton}
                    onClick={handleSendMessage}
                    disabled={!isChatEnabled || isLoading || isUploading || (newMessage.trim() === '' && attachedFiles.length === 0)}
                  >
                    <FiSend color="#fff" />
                  </button>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div style={{...styles.chatContainer, height: 'auto', minHeight: isMobile ? '400px' : '500px'}}>
                <h3 style={{ marginBottom: '15px', color: '#FFD700' }}>
                  {isDirectInquiry ? 'Product Details' : `Inquiry Items (${displayProducts.length})`}
                </h3>
                
                {displayProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>
                    <FiShoppingCart size={isMobile ? 36 : 48} style={{ marginBottom: '10px' }} />
                    <p>No products in inquiry</p>
                  </div>
                ) : (
                  <div style={styles.productsGrid}>
                    {loadingProducts && !isDirectInquiry ? (
                      Array.from({ length: cartItems.length }).map((_, index) => (
                        <ProductLoader key={index} isMobile={isMobile} />
                      ))
                    ) : (
                      displayProducts.map((item, index) => (
                        <motion.div 
                          key={`${item.id}-${index}`} 
                          style={styles.productCard}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '120px 1fr',
                            gap: '12px'
                          }}>
                            {/* Product Gallery */}
                            <div>
                              <ProductGallery 
                                product={item} 
                                isMobile={isMobile}
                              />
                            </div>
                            
                            {/* Product Details */}
                            <div>
                              <ProductDetails product={item} isMobile={isMobile} />
                              
                              {/* Order Information */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '8px',
                                paddingTop: '8px',
                                borderTop: '1px solid rgba(255,255,255,0.1)'
                              }}>
                                <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#bdc3c7' }}>
                                  <div>Size: {item.selectedSize || 'Customizable'}</div>
                                  <div>Quantity: {item.quantity || 1} units</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Customer Info */}
          <div style={styles.sidebar}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#FFD700', margin: 0, fontSize: isMobile ? '16px' : '18px' }}>Your Information</h3>
              <button 
                style={styles.editButton}
                onClick={() => setShowProfileCompletionPopup(true)}
              >
                <FiEdit size={isMobile ? 12 : 14} />
                Edit
              </button>
            </div>
            
            <div style={styles.infoOverview}>
              <div style={styles.infoItem}>
                <span>Name:</span>
                <span style={{ fontWeight: '600' }}>{inquiryInfo.name || 'Not provided'}</span>
              </div>
              <div style={styles.infoItem}>
                <span>Email:</span>
                <span style={{ fontWeight: '600' }}>{inquiryInfo.email || 'Not provided'}</span>
              </div>
              <div style={styles.infoItem}>
                <span>Phone:</span>
                <span style={{ fontWeight: '600' }}>{inquiryInfo.phone || 'Not provided'}</span>
              </div>
              <div style={styles.infoItem}>
                <span>Country:</span>
                <span style={{ fontWeight: '600' }}>{inquiryInfo.country || 'Not provided'}</span>
              </div>
              {inquiryInfo.company && (
                <div style={styles.infoItem}>
                  <span>Company:</span>
                  <span style={{ fontWeight: '600' }}>{inquiryInfo.company}</span>
                </div>
              )}
            </div>

            {/* Inquiry Summary */}
            <div style={{ marginTop: '15px', padding: isMobile ? '12px' : '15px', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '8px', color: '#FFD700', fontSize: isMobile ? '14px' : '16px' }}>Inquiry Summary</h4>
              <div style={{ fontSize: isMobile ? '13px' : '14px', lineHeight: '1.5' }}>
                <div>Items: {displayProducts.length} {isDirectInquiry ? 'product' : 'products'}</div>
                <div>Total Quantity: {displayProducts.reduce((sum, item) => sum + (item.quantity || 500), 0)} units</div>
              </div>
            </div>

            {/* Checkout Section */}
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              borderRadius: '12px', 
              background: isCheckoutActive 
                ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.2), rgba(39, 174, 96, 0.3))' 
                : 'linear-gradient(135deg, #ffa50047, #ffc60017)', 
              color: '#333', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
            }}>
              <p style={{ 
                fontWeight: '350', 
                fontSize: '11px', 
                textAlign: 'justify',
                marginBottom: '15px', 
                lineHeight: '1.8',
                color: '#fff',
              }}>
                {isCheckoutActive 
                  ? 'The admin has approved the prices for your products. You can now proceed to checkout and complete your purchase.'
                  : 'Product prices will be confirmed by our sales team. Once the price is finalized through negotiation, the Checkout button will be enabled, allowing you to proceed with your purchase.'
                }
              </p>

              <button 
                style={{
                  background: isCheckoutActive 
                    ? 'linear-gradient(135deg, #2ecc71, #27ae60)'
                    : 'linear-gradient(135deg, #ff9700, #ffc102)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '30px',
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginTop: '5px',
                  cursor: isCheckoutActive ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                  opacity: (!isChatEnabled || isLoading || displayProducts.length === 0 || !isCheckoutActive) ? 0.6 : 1
                }}
                onClick={handleCheckout}
                disabled={!isChatEnabled || isLoading || displayProducts.length === 0 || !isCheckoutActive}
                onMouseOver={e => {
                  if (isCheckoutActive) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseOut={e => {
                  if (isCheckoutActive) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {isLoading ? 'Processing...' : isCheckoutActive ? 'Proceed to Checkout' : 'Checkout (Pending Approval)'}
              </button>

              {!isCheckoutActive && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginTop: '10px',
                  padding: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '6px'
                }}>
                  <FiAlertCircle size={14} color="#f39c12" />
                  <span style={{ fontSize: '12px', color: '#f39c12' }}>
                    Waiting for admin to set prices
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Not Logged In State */
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <FiUser size={isMobile ? 48 : 64} style={{ marginBottom: '20px', color: '#FFD700' }} />
          <h2 style={{ color: '#FFD700', marginBottom: '10px' }}>Authentication Required</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '30px' }}>
            Please sign in or create an account to access the inquiry system
          </p>
          <button 
            style={{
              background: 'linear-gradient(135deg, #FFA500, #FFD700)',
              color: 'black',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => setShowLoginPopup(true)}
          >
            Sign In / Sign Up
          </button>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .spin {
            animation: spin 1s linear infinite;
          }

          .typing-dots {
            display: inline-flex;
            align-items: center;
            margin-right: 8px;
          }

          .typing-dots span {
            height: 8px;
            width: 8px;
            background: #3498db;
            border-radius: 50%;
            display: block;
            margin: 0 1px;
            animation: typing 1s infinite ease-in-out;
          }

          .typing-dots span:nth-child(1) {
            animation-delay: 0.2s;
          }

          .typing-dots span:nth-child(2) {
            animation-delay: 0.4s;
          }

          .typing-dots span:nth-child(3) {
            animation-delay: 0.6s;
          }

          @keyframes typing {
            0%, 100% {
              transform: translateY(0);
              opacity: 0.5;
            }
            50% {
              transform: translateY(-5px);
              opacity: 1;
            }
          }

          ::-webkit-scrollbar {
            width: 6px;
          }

          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }

          ::-webkit-scrollbar-thumb {
            background: rgba(255, 215, 0, 0.5);
            border-radius: 3px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 215, 0, 0.7);
          }

          input:disabled, textarea:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          button:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          select option {
            background: #2d2d2d;
            color: #fff;
          }

          textarea {
            font-family: inherit;
          }
        `}
      </style>
    </div>
  );
};

export default Inquiry;
export { LoginForm };
