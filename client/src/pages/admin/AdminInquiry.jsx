import React, { useState, useEffect, useRef, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiMessageSquare, FiUser, FiMail, FiPhone,
  FiShoppingCart, FiClock, FiCheck, FiX, FiEye, FiSend,
  FiPaperclip, FiEdit, FiChevronLeft, FiChevronRight,
  FiImage, FiDollarSign, FiCheckCircle, FiAlertCircle,
  FiLoader, FiRefreshCw, FiArrowLeft, FiMessageCircle,
  FiExternalLink, FiFile, FiBell, FiMenu, FiX as FiClose
} from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

// Socket.IO client
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.yokebud.com';
const socket = io(BACKEND_URL, {
  transports: ['websocket'], // Use only websocket to avoid polling issues
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  forceNew: true,
  timeout: 10000
});

// Constants
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

// Enhanced time formatting
const formatTime = (timestamp) => {
  if (!timestamp) return 'Unknown';
  try {
    const now = new Date();
    const time = new Date(timestamp);
    if (isNaN(time.getTime())) return 'Invalid date';
    
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return time.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Time error';
  }
};

// Helper functions
const getStatusColor = (status) => {
  switch (status) {
    case 'new': return '#e74c3c';
    case 'pending': return '#f39c12';
    case 'processing': return '#3498db';
    case 'completed': return '#27ae60';
    case 'cancelled': return '#95a5a6';
    default: return '#95a5a6';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'new': return 'New Inquiry';
    case 'pending': return 'Pending';
    case 'processing': return 'Processing';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

const safeJsonParse = (str, fallback = {}) => {
  if (!str) return fallback;
  try {
    return typeof str === 'string' ? JSON.parse(str) : str;
  } catch (error) {
    return fallback;
  }
};

const formatPriceRange = (productData) => {
  if (!productData) return 'N/A';
  
  // Use min_price and max_price if available (new format)
  const minPrice = parseFloat(productData.min_price) || parseFloat(productData.discounted_price) || parseFloat(productData.price) || 0;
  const maxPrice = parseFloat(productData.max_price) || parseFloat(productData.price) || 0;
  
  if (minPrice === maxPrice) {
    return `$${minPrice.toFixed(2)}`;
  }
  
  return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
};

// UI Components
const AutoExpandingTextarea = ({ value, onChange, placeholder, disabled, onSend, className = '' }) => {
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
      if (onSend) onSend();
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
      className={`auto-expanding-textarea ${className}`}
      rows={1}
    />
  );
};

const ProductGallery = ({ product, isMobile }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const safeProduct = { product_photos: [], ...product };
  const processedPhotos = Array.isArray(safeProduct.product_photos)
    ? safeProduct.product_photos
    : (typeof safeProduct.product_photos === 'string'
      ? safeJsonParse(safeProduct.product_photos || '[]')
      : []);

  const nextImage = (e) => {
    e.stopPropagation();
    if (processedPhotos.length === 0) return;
    setCurrentImageIndex(prev => prev === processedPhotos.length - 1 ? 0 : prev + 1);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (processedPhotos.length === 0) return;
    setCurrentImageIndex(prev => prev === 0 ? processedPhotos.length - 1 : prev - 1);
  };

  const className = `product-gallery ${isMobile ? 'mobile' : ''}`;

  if (processedPhotos.length === 0) {
    return (
      <div className={`${className} no-image`}>
        <FiImage size={24} />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="product-gallery-image-wrapper">
        <img
          src={processedPhotos[currentImageIndex]}
          alt={product.product_name}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="product-gallery-image-error">
          <FiImage size={24} />
        </div>
      </div>

      {processedPhotos.length > 1 && (
        <>
          <button onClick={prevImage} className="gallery-nav prev">
            <FiChevronLeft />
          </button>
          <button onClick={nextImage} className="gallery-nav next">
            <FiChevronRight />
          </button>
          <div className="gallery-counter">
            {currentImageIndex + 1}/{processedPhotos.length}
          </div>
        </>
      )}
    </div>
  );
};

const FileMessage = ({ files }) => {
  const imageFiles = files.filter(file => file.type && file.type.startsWith('image/'));
  const otherFiles = files.filter(file => !file.type || !file.type.startsWith('image/'));

  return (
    <div className="file-message-container">
      {imageFiles.map((file, index) => (
        <div key={`img-${index}`} className="file-message-image">
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <img 
              src={file.url} 
              alt={file.name} 
              onError={(e) => { 
                e.target.style.display = 'none'; 
                e.target.closest('.file-message-image').classList.add('error');
              }}
            />
          </a>
        </div>
      ))}

      {otherFiles.map((file, index) => {
        const FileIcon = FILE_ICONS[file.type] || FiFile;
        return (
          <div
            key={`file-${index}`}
            className="file-message-item"
            onClick={() => window.open(file.url, '_blank')}
          >
            <FileIcon size={16} />
            <div className="file-info">
              <div className="file-name">{file.name}</div>
              <div className="file-size">
                {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'File'}
              </div>
            </div>
            <button
              className="file-open-button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(file.url, '_blank');
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

const FilePreview = ({ files, onRemove }) => (
  <div className="file-preview-container">
    {files.map((file, index) => {
      const isImage = file.type && file.type.startsWith('image/');
      const previewUrl = isImage ? URL.createObjectURL(file) : null;
      const Icon = isImage ? FiImage : FiPaperclip;

      return (
        <div key={index} className="file-preview-item">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt="Preview" className="file-image-preview" onLoad={() => URL.revokeObjectURL(previewUrl)} />
          ) : (
            <Icon size={12} />
          )}
          <span>{file.name}</span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="remove-file-button"
          >
            <FiX size={12} />
          </button>
        </div>
      );
    })}
  </div>
);

const StatusBadge = ({ status, className = '' }) => (
  <span
    className={`status-badge ${className}`}
    style={{ backgroundColor: getStatusColor(status) }}
  >
    {getStatusText(status)}
  </span>
);

const InquiryListItem = React.memo(({ inquiry, isSelected, onSelect }) => {
  const productData = inquiry.product_data;
  const hasUnreadMessages = inquiry.admin_unread_count > 0;
  const hasNewStatus = inquiry.status === 'new';

  let itemClasses = 'inquiry-list-item';
  if (isSelected) itemClasses += ' selected';
  if (hasNewStatus) itemClasses += ' new-status';
  if (hasUnreadMessages) itemClasses += ' unread';

  return (
    <motion.div
      className={itemClasses}
      onClick={() => onSelect(inquiry)}
      whileHover={{ backgroundColor: isSelected ? "rgba(255, 165, 0, 0.2)" : "rgba(55, 55, 55, 0.7)" }}
      whileTap={{ scale: 0.99 }}
      layout
    >
      <div className="item-row top">
        <span className="item-customer">
          {hasUnreadMessages && <span className="unread-dot"></span>}
          {inquiry.customer_name}
        </span>
        <span className="item-time">
          {formatTime(inquiry.last_activity || inquiry.created_at)}
        </span>
      </div>
      
      <div className="item-row product">
        <FiShoppingCart size={14} />
        <span className="item-product-name">{productData?.product_name}</span>
      </div>

      <div className="item-row bottom">
        <span className="item-inquiry-number">
          {inquiry.inquiry_number}
        </span>
        <StatusBadge status={inquiry.status} />
        {hasUnreadMessages && (
          <span className="admin-unread-badge">
            {inquiry.admin_unread_count}
          </span>
        )}
      </div>
    </motion.div>
  );
});

const InquiryList = ({ inquiries, selectedInquiry, isLoading, onSelectInquiry }) => {
  return (
    <div className="inquiry-list-container">
      {isLoading ? (
        <div className="list-loading-placeholder">
          <FiLoader size={24} className="spin" />
          <div>Loading inquiries...</div>
        </div>
      ) : inquiries.length > 0 ? (
        <AnimatePresence>
          {inquiries.map((inquiry) => (
            <InquiryListItem
              key={inquiry.id}
              inquiry={inquiry}
              isSelected={selectedInquiry?.id === inquiry.id}
              onSelect={onSelectInquiry}
            />
          ))}
        </AnimatePresence>
      ) : (
        <div className="list-empty-placeholder">
          <FiMessageSquare size={48} />
          <h3>No inquiries found</h3>
          <p>Try adjusting your search filters</p>
        </div>
      )}
    </div>
  );
};

const CustomerInfo = ({ inquiry }) => (
  <div className="context-card">
    <h3 className="context-card-title">
      <FiUser /> Customer Information
    </h3>
    <div className="context-card-body">
      <div className="info-item">
        <strong>Name:</strong>
        <div>{inquiry.customer_name}</div>
      </div>
      <div className="info-item">
        <strong>Email:</strong>
        <div>{inquiry.customer_email}</div>
      </div>
      <div className="info-item">
        <strong>Phone:</strong>
        <div>{inquiry.customer_phone}</div>
      </div>
      <div className="info-item">
        <strong>Company:</strong>
        <div>{inquiry.customer_company || 'N/A'}</div>
      </div>
      <div className="info-item">
        <strong>Country:</strong>
        <div>{inquiry.customer_country || 'N/A'}</div>
      </div>
    </div>
  </div>
);

const ProductInfo = ({
  inquiry,
  productDetail,
  priceInputs,
  onPriceInputChange,
  onActivateCheckout,
  isMobile
}) => {
  const productData = inquiry.product_data;
  const priceKey = `${inquiry.id}-${inquiry.product_id}`;
  const currentPrice = priceInputs[priceKey] || '';
  const priceData = inquiry.price_data ? safeJsonParse(inquiry.price_data) : {};

  return (
    <div className="context-card">
      <h3 className="context-card-title">
        <FiShoppingCart /> Product & Pricing
      </h3>
      <div className="context-card-body">
        <div className="product-info-header">
          <div className="product-info-gallery">
            <ProductGallery product={productData} isMobile={isMobile} />
          </div>
          <div className="product-info-summary">
            <div className="product-info-name">
              {productData?.product_name}
            </div>
            <div className="product-info-meta">
              <div>SKU: {productData?.sku || 'N/A'}</div>
              <div>MOQ: {productData?.moq || 'N/A'}</div>
            </div>
          </div>
        </div>

        {productDetail && (
          <div className="product-info-details">
            <div><strong>Material:</strong> {productDetail.material || 'N/A'}</div>
            <br/>
            <div><strong>Care:</strong> {productDetail.care_instructions || 'N/A'}</div>
            {productDetail.features?.length > 0 && (
              <div>
                <br/>
                <strong>Features:</strong> {productDetail.features.slice(0, 2).join(', ')}...
              </div>
            )}
          </div>
        )}

        <div className="product-info-order">
          <div className="info-item">
            <span>Order Quantity:</span>
            <span className="order-quantity-badge">
              {productData?.quantity || '1'}
            </span>
          </div>
          <div className="info-item-meta">
            Size: {productData?.selectedSize || 'Customizable'} <br/><br/>
            Original Price: {formatPriceRange(productData)}
          </div>
        </div>

        {!inquiry.is_checkout_active ? (
          <div className="price-setting-form">
            <label className="price-label">
              Price per unit ($):
            </label>
            <div className="price-input-wrapper">
              <FiDollarSign />
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentPrice}
                onChange={(e) => onPriceInputChange(inquiry.id, inquiry.product_id, e.target.value)}
                placeholder="Enter price"
              />
            </div>
            <motion.button
              onClick={() => onActivateCheckout(inquiry.id)}
              disabled={!currentPrice}
              className="btn-activate-checkout"
              whileHover={currentPrice ? { scale: 1.02 } : {}}
              whileTap={currentPrice ? { scale: 0.98 } : {}}
            >
              Activate Checkout
            </motion.button>
          </div>
        ) : (
          <div className="checkout-active-info">
            <div className="checkout-active-title">
              <FiCheckCircle /> Prices Approved
            </div>
            {Object.entries(priceData).map(([productId, priceInfo]) => (
              <div key={productId} className="checkout-price-item">
                {priceInfo.productName}: ${priceInfo.price} ({priceInfo.type})
                {priceInfo.quantity && ` × ${priceInfo.quantity} units`}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ChatInterface = ({
  inquiry,
  messages,
  isSending,
  onSendMessage
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileAttach = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx,.txt,.zip,.rar,.xls,.xlsx'; 
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        setAttachedFiles(prev => [...prev, ...files]);
      }
    };
    input.click();
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachedFiles.length === 0) || !inquiry) return;
    if (isSending) return;

    const messageToSend = newMessage.trim();
    const filesToSend = [...attachedFiles];
    
    if (!messageToSend && filesToSend.length === 0) return;

    setNewMessage('');
    setAttachedFiles([]);

    await onSendMessage(inquiry.id, messageToSend, filesToSend);
  };

  return (
    <div className="chat-interface">
      <div 
        ref={messagesContainerRef}
        className="message-list"
      >
        {messages.length === 0 ? (
          <div className="chat-empty-placeholder">
            <FiMessageSquare size={32} />
            <div>No messages yet</div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>Start the conversation</div>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id || `${msg.timestamp}-${Math.random()}`}
              className={`message-bubble ${msg.sender_type === 'user' ? 'user' : 'admin'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="message-header">
                <span className="message-sender">{msg.sender_type === 'user' ? 'Customer' : 'Admin'}</span>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              {msg.message && <div className="message-content">{msg.message}</div>}
              {msg.files && msg.files.length > 0 && (
                <FileMessage files={msg.files} />
              )}
            </motion.div>
          ))
        )}
        {isSending && (
          <motion.div
            className="message-bubble admin sending"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="sending-indicator">
              <FiLoader className="spin" />
              <span>Sending...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-area">
        {attachedFiles.length > 0 && (
          <FilePreview files={attachedFiles} onRemove={handleRemoveFile} />
        )}
        <div className="message-input-wrapper">
          <button
            type="button"
            className="chat-action-button"
            onClick={handleFileAttach}
            title="Attach files"
          >
            <FiPaperclip />
          </button>
          <AutoExpandingTextarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onSend={handleSendMessage}
            className="chat-textarea"
          />
          <button
            type="button"
            className="chat-action-button send"
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && attachedFiles.length === 0) || isSending}
          >
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
};

const InquiryDetail = ({
  inquiry,
  messages,
  productDetail,
  priceInputs,
  priceTypes,
  isSending,
  isMobile,
  onStatusUpdate,
  onPriceTypeChange,
  onPriceInputChange,
  onActivateCheckout,
  onSendMessage,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState('chat');

  if (isMobile && !inquiry) return null;

  if (!inquiry) {
    return (
      <div className="inquiry-detail-container placeholder">
        <FiEye size={48} />
        <h3>Select an inquiry to view details</h3>
        <p>Click on an inquiry from the list to view its details and reply</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="inquiry-detail-container mobile">
        <div className="mobile-detail-header">
          <button className="back-to-list-button" onClick={onBack}>
            <FiArrowLeft /> Inquiries
          </button>
          <div className="mobile-detail-tabs">
            <button
              className={activeTab === 'chat' ? 'active' : ''}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button
              className={activeTab === 'info' ? 'active' : ''}
              onClick={() => setActiveTab('info')}
            >
              Info
            </button>
          </div>
        </div>
        <div className="mobile-content-area">
          {activeTab === 'chat' && (
            <ChatInterface
              inquiry={inquiry}
              messages={messages}
              isSending={isSending}
              onSendMessage={onSendMessage}
            />
          )}
          {activeTab === 'info' && (
            <div className="context-sidebar">
              <div className="context-sidebar-scrollable">
                <div className="status-updater-mobile">
                  <h3 className="context-card-title">Update Status</h3>
                  <select
                    value={inquiry.status}
                    onChange={(e) => onStatusUpdate(inquiry.id, e.target.value, true)}
                  >
                    <option value="new">New Inquiry</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <CustomerInfo inquiry={inquiry} />
                <ProductInfo
                  inquiry={inquiry}
                  productDetail={productDetail}
                  priceInputs={priceInputs}
                  priceTypes={priceTypes}
                  onPriceTypeChange={onPriceTypeChange}
                  onPriceInputChange={onPriceInputChange}
                  onActivateCheckout={onActivateCheckout}
                  isMobile={isMobile}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="inquiry-detail-container">
      <div className="chat-area">
        <div className="chat-header">
          <div>
            <h2 className="chat-title">{inquiry.inquiry_number}</h2>
            <p className="chat-subtitle">
              Chat with {inquiry.customer_name}
            </p>
          </div>
          <div className="chat-status-select">
            <select
              value={inquiry.status}
              onChange={(e) => onStatusUpdate(inquiry.id, e.target.value, true)}
            >
              <option value="new">New Inquiry</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <ChatInterface
          inquiry={inquiry}
          messages={messages}
          isSending={isSending}
          onSendMessage={onSendMessage}
        />
      </div>

      <div className="context-sidebar">
        <div className="context-sidebar-scrollable">
          <CustomerInfo inquiry={inquiry} />
          <ProductInfo
            inquiry={inquiry}
            productDetail={productDetail}
            priceInputs={priceInputs}
            priceTypes={priceTypes}
            onPriceTypeChange={onPriceTypeChange}
            onPriceInputChange={onPriceInputChange}
            onActivateCheckout={onActivateCheckout}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
};

// MAIN ADMIN INQUIRY COMPONENT
const AdminInquiry = () => {
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiryId, setSelectedInquiryId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [priceInputs, setPriceInputs] = useState({});

  const [productDetails, setProductDetails] = useState({});
  const [messages, setMessages] = useState({});
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const inquiriesRef = useRef(inquiries);
  const selectedInquiryIdRef = useRef(selectedInquiryId);
  const messagesRef = useRef(messages);

  useEffect(() => {
    inquiriesRef.current = inquiries;
    selectedInquiryIdRef.current = selectedInquiryId;
    messagesRef.current = messages;
  }, [inquiries, selectedInquiryId, messages]);

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // DATABASE-DRIVEN STATUS MANAGEMENT
  const updateInquiryStatus = async (inquiryId, newStatus, suppressToast = false) => {
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (!suppressToast) {
          toast.success(`Status updated to ${getStatusText(newStatus)}`);
        }
        
        return result;
      } else {
        throw new Error('Failed to update status in database');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
      throw error;
    }
  };

  // REAL-TIME INQUIRY FETCHING
  const fetchInquiries = useCallback(async (isManual = false) => {
    try {
      if (!isManual) setIsLoading(true);

      const response = await fetch(`${BACKEND_URL}/api/inquiries`);
      if (!response.ok) throw new Error('Failed to fetch inquiries');

      const data = await response.json();
      
      const processedInquiries = data.map(inquiry => {
        if (inquiry.messages && inquiry.messages.length > 0) {
          const lastMessage = inquiry.messages[inquiry.messages.length - 1];
          return {
            ...inquiry,
            last_activity: lastMessage.timestamp || lastMessage.created_at || inquiry.last_activity,
            created_at: inquiry.messages[0].timestamp || inquiry.messages[0].created_at || inquiry.created_at,
            is_checkout_active: inquiry.is_checkout_active || false,
            price_data: inquiry.price_data || null,
            admin_unread_count: inquiry.admin_unread_count || 0
          };
        }
        return inquiry;
      });

      const sortedData = processedInquiries.sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));
      setInquiries(sortedData);

      sortedData.forEach(inquiry => {
        loadMessages(inquiry.id, inquiry.messages || []);
      });

    } catch (error) {
      console.error('Error fetching inquiries:', error);
      if (isManual) toast.error('Failed to refresh inquiries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (inquiryId, initialMessages = []) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/inquiries/${inquiryId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(prev => ({
            ...prev,
            [inquiryId]: data.inquiry.messages || []
          }));
        }
      } else {
        setMessages(prev => ({
          ...prev,
          [inquiryId]: initialMessages
        }));
      }
    } catch (error) {
      setMessages(prev => ({
        ...prev,
        [inquiryId]: initialMessages
      }));
    }
  }, []);

  useEffect(() => {
    fetchInquiries(false);
  }, [fetchInquiries]);

  const manualRefresh = useCallback(() => {
    setIsManualRefresh(true);
    fetchInquiries(true);
    setTimeout(() => setIsManualRefresh(false), 1000);
    toast.success('Inquiries refreshed!');
  }, [fetchInquiries]);

  // MARK ADMIN MESSAGES AS READ WHEN OPENED
  const markAdminMessagesAsRead = useCallback(async (inquiryId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/inquiries/${inquiryId}/messages/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: 'admin' })
      });
      // Optimistic update regardless; backend will sync via future fetch/socket
      setInquiries(prev => prev.map(inq =>
        inq.id === inquiryId ? { ...inq, admin_unread_count: 0 } : inq
      ));
      return response.ok;
    } catch (e) {
      // Keep silent; not critical for UX
      return false;
    }
  }, []);

  // REAL-TIME SOCKET.IO UPDATES
  useEffect(() => {
    console.log('Setting up Socket.IO listeners for real-time status updates...');

    const handleNewInquiry = (data) => {
      console.log('New inquiry received:', data);
      toast.info(`📨 New inquiry from ${data.customerName}`, {
        position: "top-right",
        autoClose: 3000
      });

      // Refresh inquiries to get the latest data
      fetchInquiries(true);
    };

    const handleInquiryUpdated = (data) => {
      console.log('Inquiry updated via socket:', data);
      
      setInquiries(prev => 
        prev.map(inq => 
          inq.id === data.inquiryId
            ? { ...inq, status: data.status, last_activity: data.last_activity }
            : inq
        ).sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity))
      );

      // Show status change notification
      if (data.status === 'completed') {
        toast.success(`✅ Inquiry ${data.inquiryId} completed`);
      }
    };

    const handleStatusUpdated = (data) => {
      console.log('Status updated via socket:', data);
      
      setInquiries(prev => 
        prev.map(inq => 
          inq.id === data.inquiryId
            ? { ...inq, status: data.status }
            : inq
        )
      );
    };

    const handleNewMessage = (message) => {
      // Ignore echo of admin's own messages to prevent duplicates
      if (message.sender_type !== 'user') {
        return;
      }

      toast.info(`💬 New message from customer`, {
        position: "top-right",
        autoClose: 3000
      });

      // Auto-update status to pending for new user messages
      if (inquiriesRef.current.find(inq => inq.id === message.inquiryId)?.status === 'new') {
        updateInquiryStatus(message.inquiryId, 'pending', true);
      }

      setMessages(prev => {
        const existingMessages = prev[message.inquiryId] || [];
        const messageExists = existingMessages.some(
          msg => msg.id === message.id
        );

        if (messageExists) return prev;

        return {
          ...prev,
          [message.inquiryId]: [...existingMessages, message]
        };
      });
    };

    const handleMessageSent = (data) => {
      if (data.success && data.message && data.temporaryId) {
        setMessages(prev => {
          const existingMessages = prev[data.message.inquiryId] || [];
          const updatedMessages = existingMessages.map(msg => 
            msg.temporaryId === data.temporaryId 
              ? { ...data.message, id: data.message.id }
              : msg
          );

          if (!existingMessages.some(msg => msg.temporaryId === data.temporaryId)) {
            return {
              ...prev,
              [data.message.inquiryId]: [...existingMessages, data.message]
            };
          }

          return {
            ...prev,
            [data.message.inquiryId]: updatedMessages
          };
        });
      }
    };

    const handleCheckoutActivated = (data) => {
      console.log('Checkout activated:', data);
      setInquiries(prev =>
        prev.map(inq =>
          inq.id === data.inquiryId
            ? { 
                ...inq, 
                is_checkout_active: true, 
                price_data: JSON.stringify(data.prices),
                status: data.status || 'completed'
              }
            : inq
        )
      );
      toast.success(`✅ Checkout activated for inquiry`);
    };

    // Socket event listeners
    socket.on('connect', () => {
      console.log('✅ Admin connected to server via Socket.IO');
      inquiriesRef.current.forEach(inquiry => {
        socket.emit('join_inquiry', inquiry.id);
      });
    });

    socket.on('admin_new_inquiry', handleNewInquiry);
    socket.on('admin_inquiry_updated', handleInquiryUpdated);
    socket.on('inquiry_status_updated', handleStatusUpdated);
    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('checkout_activated', handleCheckoutActivated);

    // Auto-refresh inquiries every 30 seconds for real-time updates
    const autoRefreshInterval = setInterval(() => {
      fetchInquiries(true);
    }, 30000);

    return () => {
      socket.off('admin_new_inquiry', handleNewInquiry);
      socket.off('admin_inquiry_updated', handleInquiryUpdated);
      socket.off('inquiry_status_updated', handleStatusUpdated);
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('checkout_activated', handleCheckoutActivated);
      clearInterval(autoRefreshInterval);
    };
  }, [fetchInquiries]);

  useEffect(() => {
    if (selectedInquiryId && socket.connected) {
      socket.emit('join_inquiry', selectedInquiryId);
    }
  }, [selectedInquiryId]);

  const loadProductDetails = useCallback(async (productId) => {
    if (!productId || productDetails[productId]) return;
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProductDetails(prev => ({
          ...prev,
          [productId]: data
        }));
      }
    } catch (error) {
      console.error('Error loading product details:', error);
    }
  }, [productDetails]);

  // ENHANCED STATUS UPDATE HANDLER WITH DATABASE PERSISTENCE
  const handleStatusUpdate = useCallback(async (inquiryId, newStatus, suppressToast = false) => {
    try {
      await updateInquiryStatus(inquiryId, newStatus, suppressToast);
      
      // The real update will come via Socket.IO, but we update locally for immediate feedback
      setInquiries(prev => prev.map(inq =>
        inq.id === inquiryId ? { ...inq, status: newStatus, last_activity: new Date().toISOString() } : inq
      ));
      
    } catch (error) {
      console.error('Status update failed:', error);
    }
  }, []);

  const handleSelectInquiry = useCallback(async (inquiry) => {
    setSelectedInquiryId(inquiry.id);

    // Auto-update status from 'new' to 'pending' when admin opens inquiry
    if (inquiry.status === 'new') {
      await handleStatusUpdate(inquiry.id, 'pending', true);
    }

    if (inquiry.product_id) {
      loadProductDetails(inquiry.product_id);
    }
    
    if (!messagesRef.current[inquiry.id] || messagesRef.current[inquiry.id].length === 0) {
      loadMessages(inquiry.id);
    }

    // Clear admin unread count when opening
    if (inquiry.admin_unread_count > 0) {
      markAdminMessagesAsRead(inquiry.id);
    }
  }, [loadProductDetails, loadMessages, handleStatusUpdate, markAdminMessagesAsRead]);

  const handleBackToList = useCallback(() => {
    setSelectedInquiryId(null);
  }, []);



  const handlePriceInputChange = useCallback((inquiryId, productId, value) => {
    setPriceInputs(prev => ({
      ...prev,
      [`${inquiryId}-${productId}`]: value
    }));
  }, []);

  const handleActivateCheckout = useCallback(async (inquiryId) => {
    const currentInquiry = inquiriesRef.current.find(inq => inq.id === inquiryId);
    if (!currentInquiry) return;

    const priceData = {};
    const key = `${inquiryId}-${currentInquiry.product_id}`;

    if (priceInputs[key]) {
      const productData = currentInquiry.product_data;
      priceData[currentInquiry.product_id] = {
        price: parseFloat(priceInputs[key]),
        type: 'single',
        productName: productData.product_name,
        quantity: productData.quantity || 1
      };
    } else {
      toast.error('Please set a valid price');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/inquiries/${inquiryId}/activate-checkout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prices: priceData,
          status: 'completed'
        }),
      });

      if (response.ok) {
        toast.success(`✅ Checkout activated for Inquiry #${currentInquiry.inquiry_number}!`);
        // Status will be updated via Socket.IO
      } else {
        throw new Error('Failed to activate checkout');
      }
    } catch (error) {
      console.error('Failed to activate checkout:', error);
      toast.error('Failed to activate checkout');
    }
  }, [priceInputs]);

  const sendMessage = useCallback(async (inquiryId, messageText, files = []) => {
    if ((!messageText.trim() && files.length === 0) || !inquiryId) return;

    setIsSendingReply(true);

    const temporaryId = `admin-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      id: temporaryId,
      temporaryId: temporaryId,
      inquiryId: inquiryId,
      message: messageText,
      sender_type: 'admin',
      files: files,
      timestamp: new Date().toISOString(),
      is_read: true
    };

    setMessages(prev => ({
      ...prev,
      [inquiryId]: [...(prev[inquiryId] || []), tempMessage]
    }));

    try {
      let uploadedFiles = [];
      
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        const uploadResponse = await fetch(`${BACKEND_URL}/api/inquiries/${inquiryId}/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          uploadedFiles = (await uploadResponse.json()).files || [];
        } else {
          throw new Error('File upload failed');
        }
      }

      socket.emit('send_message', {
        inquiryId: inquiryId,
        message: messageText,
        senderType: 'admin',
        files: uploadedFiles,
        temporaryId: temporaryId
      });

      // Auto-update status to 'processing' when admin sends first reply
      const currentInquiry = inquiriesRef.current.find(inq => inq.id === inquiryId);
      if (currentInquiry && (currentInquiry.status === 'new' || currentInquiry.status === 'pending')) {
        await handleStatusUpdate(inquiryId, 'processing', true);
      }
        
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => ({
        ...prev,
        [inquiryId]: (prev[inquiryId] || []).filter(msg => msg.temporaryId !== temporaryId)
      }));
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSendingReply(false);
    }
  }, [handleStatusUpdate]);

  const filteredInquiries = React.useMemo(() => {
    const sorted = [...inquiries].sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));
    return sorted.filter(inquiry => {
      const matchesSearch =
        inquiry.inquiry_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inquiry.product_data?.product_name?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = filterStatus === 'all' || inquiry.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [inquiries, searchTerm, filterStatus]);

  const selectedInquiry = React.useMemo(() => {
    return inquiries.find(inq => inq.id === selectedInquiryId) || null;
  }, [inquiries, selectedInquiryId]);

  const showList = !isMobile || (isMobile && !selectedInquiryId);
  const showDetail = !isMobile || (isMobile && selectedInquiryId);
  
  return (
    <div className="inquiry-container">
      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-header">
          <button 
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiClose size={24} /> : <FiMenu size={24} />}
          </button>
          <h1 className="mobile-title">
            <FiMessageSquare />
            Customer Inquiries
          </h1>
        </div>
      )}

      {/* Sidebar with overlay for mobile */}
      <div className={`sidebar-container ${sidebarOpen ? 'open' : ''}`}>
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
        <AdminSidebar
          activeTab="inquiries"
          setActiveTab={() => { }}
          isMobile={isMobile}
          inquiriesUnreadCount={React.useMemo(() => {
            try {
              const uniqueAttention = new Set();
              inquiries.forEach(inq => {
                if ((inq && inq.status === 'new') || (inq && (inq.admin_unread_count || 0) > 0)) {
                  uniqueAttention.add(inq.id);
                }
              });
              return uniqueAttention.size;
            } catch (e) {
              return 0;
            }
          }, [inquiries])}
        />
      </div>

      <main className="inquiry-main-content">
        {!isMobile && (
          <header className="inquiry-header">
            <motion.h1
              className="inquiry-title"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FiMessageSquare />
              Customer Inquiries
              <span style={{ fontSize: '0.5rem', marginLeft: '10px', color: '#FFD700' }}>
                Real-time • Database-driven
              </span>
            </motion.h1>
          </header>
        )}

        <div className="inquiry-filters">
          <input
            type="text"
            placeholder="Search by inquiry #, customer, or product..."
            className="inquiry-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={{display: 'flex', gap:'10px'}}>

          <select
            className="inquiry-status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="new">New Inquiry</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            className="inquiry-refresh-button"
            onClick={manualRefresh}
            disabled={isManualRefresh}
          >
            <FiRefreshCw className={isManualRefresh ? 'spin' : ''} />
          </button>
          </div>

        </div>

        <div className="inquiry-layout">
          <AnimatePresence>
            {showList && (
              <motion.div
                key="list-panel"
                className={`inquiry-list-panel ${isMobile ? 'full' : ''}`}
                initial={isMobile ? { x: 0 } : false}
                animate={isMobile ? { x: 0 } : false}
                exit={isMobile ? { x: '-100%' } : false}
                transition={isMobile ? { duration: 0.3 } : false}
              >
                <InquiryList
                  inquiries={filteredInquiries}
                  selectedInquiry={selectedInquiry}
                  isLoading={isLoading}
                  onSelectInquiry={handleSelectInquiry}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showDetail && (
              <motion.div
                key="detail-panel"
                className={`inquiry-detail-panel ${isMobile ? 'full' : ''}`}
                initial={isMobile ? { x: '100%' } : false}
                animate={isMobile ? { x: 0 } : false}
                exit={isMobile ? { x: '100%' } : false}
                transition={isMobile ? { duration: 0.3 } : false}
              >
                <InquiryDetail
                  inquiry={selectedInquiry}
                  messages={selectedInquiry ? messages[selectedInquiry.id] || [] : []}
                  productDetail={selectedInquiry ? productDetails[selectedInquiry.product_id] : null}
                  priceInputs={priceInputs}
                  isSending={isSendingReply}
                  isMobile={isMobile}
                  onStatusUpdate={handleStatusUpdate}
                  onPriceInputChange={handlePriceInputChange}
                  onActivateCheckout={handleActivateCheckout}
                  onSendMessage={sendMessage}
                  onBack={handleBackToList}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
      />

      {/* Enhanced CSS with full mobile responsiveness */}
      <style>
        {`
          /* --- ALL YOUR EXISTING CSS STYLES REMAIN EXACTLY THE SAME --- */
          /* They are preserved from your original code */
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }

          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }

          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 215, 0, 0.4);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 215, 0, 0.6);
          }
          
          .inquiry-container {
            display: flex;
            min-height: 100vh;
            width: 100vw;
            background-color: #1a1a1a;
            color: #e0e0e0;
            overflow: hidden;
            position: relative;
          }

          /* Mobile Header */
          .mobile-header {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: rgba(30, 30, 30, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 215, 0, 0.2);
            z-index: 1000;
            padding: 0 1rem;
            align-items: center;
            gap: 1rem;
          }

          .mobile-menu-button {
            background: none;
            border: none;
            color: #FFD700;
            cursor: pointer;
            padding: 8px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .mobile-title {
            font-size: 1.1rem;
            font-weight: 600;
            background: linear-gradient(90deg, #FFA500, #FFD700);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0;
          }

          /* Sidebar Container for Mobile */
          .sidebar-container {
            position: relative;
          }

          .sidebar-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
          }
          
          .inquiry-main-content {
            flex: 1;
            margin-left: 230px;
            padding: 2rem;
            background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
          }
          .inquiry-header {
            margin-bottom: 1.5rem;
          }
          .inquiry-title {
            font-size: 1rem;
            font-weight: 600;
            background: linear-gradient(90deg, #FFA500, #FFD700);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0;
          }

          .inquiry-filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
          }
          .inquiry-search-input,
          .inquiry-status-filter,
          .inquiry-refresh-button {
            padding: 0.75rem 1rem;
            border-radius: 8px;
            border: 1px solid rgba(255, 215, 0, 0.3);
            background-color: rgba(30, 30, 30, 0.8);
            color: #e0e0e0;
            font-size: 0.95rem;
            outline: none;
          }
          .inquiry-search-input {
            flex: 1;
            min-width: 250px;
          }
          .inquiry-status-filter {
            cursor: pointer;
            min-width: 150px;
          }
          .inquiry-refresh-button {
            background: rgba(255, 215, 0, 0.1);
            color: #FFD700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            transition: all 0.2s ease;
          }
          .inquiry-refresh-button:hover {
            background: rgba(255, 215, 0, 0.2);
          }
          .inquiry-refresh-button:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          .inquiry-layout {
            display: flex;
            gap: 1.5rem;
            flex: 1;
            height: calc(100vh - 160px);
            overflow: hidden;
          }
          .inquiry-list-panel {
            flex: 0 ;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .inquiry-detail-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          
          .inquiry-list-container {
            background: rgba(40, 40, 40, 0.7);
            border-radius: 12px;
            padding: 0.75rem;
            overflow-y: auto;
            width: 20.5vw;
            flex: 1;
          }
          .list-loading-placeholder,
          .list-empty-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #aaa;
            padding: 2rem;
            text-align: center;
          }
          .list-empty-placeholder h3 {
            margin-bottom: 0.5rem;
            color: #e0e0e0;
          }
          
          .inquiry-list-item {
            padding: 1rem;
            margin-bottom: 0.75rem;
            border-radius: 10px;
            background: rgba(45, 45, 45, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-left: 4px solid rgba(255, 255, 255, 0.08);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            position: relative;
          }
          
          .inquiry-list-item:not(.selected):hover {
             border-color: rgba(255, 215, 0, 0.3);
             background: rgba(50, 50, 50, 0.9);
          }

          .inquiry-list-item.new-status {
            background: rgba(231, 76, 60, 0.1);
            border-color: rgba(231, 76, 60, 0.3);
            border-left: 4px solid #e74c3c;
          }
          
          .unread-dot {
            width: 8px;
            height: 8px;
            background-color: #3498db;
            border-radius: 50%;
            margin-right: 8px;
            display: inline-block;
            flex-shrink: 0;
          }

          .admin-unread-badge {
            background: #e74c3c;
            color: white;
            border-radius: 10px;
            padding: 2px 6px;
            font-size: 0.7rem;
            font-weight: bold;
            min-width: 18px;
            text-align: center;
          }

          .inquiry-list-item.unread .item-customer {
             font-weight: 700;
             color: #fff;
          }

          .inquiry-list-item.selected {
            background: rgba(255, 165, 0, 0.2);
            border-color: rgba(255, 165, 0, 0.5);
            border-left: 4px solid #FFA500;
          }

          .item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          }
          
          .item-customer {
            font-weight: 600;
            color: #eee;
            font-size: 1rem;
            display: flex;
            align-items: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding-right: 10px;
          }
          
          .item-time {
            font-size: 0.8rem;
            color: #aaa;
            flex-shrink: 0;
          }

          .item-row.product {
            font-size: 0.9rem;
            color: #ccc;
            gap: 8px;
          }
          .item-row.product svg {
            color: #FFD700;
            flex-shrink: 0;
          }
          .item-product-name {
              white-space: nowrap;
              overflow: hidden;
              textOverflow: ellipsis;
              color: #bdc3c7;
          }

          .item-row.bottom {
            margin-top: 0.25rem;
            gap: 8px;
          }
          
          .item-inquiry-number {
              font-size: 0.85rem;
              color: #888;
              font-family: monospace;
          }

          .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 600;
            color: #fff;
            line-height: 1;
          }
          
          .inquiry-detail-container {
            flex: 1;
            background: rgba(40, 40, 40, 0.7);
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            height: 100%;
          }
          .inquiry-detail-container.placeholder {
            align-items: center;
            justify-content: center;
            flex-direction: column;
            color: #aaa;
            text-align: center;
          }
          .inquiry-detail-container.placeholder h3 {
             color: #e0e0e0;
          }
          
          .chat-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            overflow: hidden;
          }
          .chat-header {
            padding: 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(30, 30, 30, 0.8);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
          }
          .chat-title {
            margin: 0;
            color: #FFD700;
            font-size: 0.7rem;
          }
          .chat-subtitle {
            margin: 5px 0 0;
            color: #bdc3c7;
            font-size: 0.9rem;
          }
          .chat-status-select select {
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            border: 1px solid rgba(255, 215, 0, 0.3);
            background-color: rgba(30, 30, 30, 0.8);
            color: #e0e0e0;
            cursor: pointer;
            font-size: 0.9rem;
          }
          
          .context-sidebar {
            flex: 0 0 320px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            flex-shrink: 0;
          }
          .context-sidebar-scrollable {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
          }
          .context-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .context-card-title {
            color: #FFA500;
            margin: 0;
            padding: 1rem;
            font-size: 1rem;
            font-weight: 600;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .context-card-body {
            padding: 1rem;
          }
          .info-item {
            margin-bottom: 0.75rem;
            font-size: 0.9rem;
          }
          .info-item strong {
            color: #bdc3c7;
            display: block;
            font-size: 0.8rem;
            margin-bottom: 2px;
          }
          .info-item div {
            color: #fff;
          }
          
          .product-info-header {
            display: flex;
            gap: 12px;
            margin-bottom: 12px;
          }
          .product-info-gallery {
            width: 60px;
            height: 60px;
            flex-shrink: 0;
          }
          .product-info-gallery .product-gallery { height: 60px; }
          .product-info-summary {
            flex: 1;
          }
          .product-info-name {
            font-weight: 600;
            color: #FFD700;
            font-size: 0.7rem;
            margin-bottom: 4px;
          }
          .product-info-meta {
            font-size: 0.8rem;
            color: #bdc3c7;
          }
          .product-info-details {
            background: rgba(255, 255, 255, 0.02);
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 12px;
            font-size: 0.85rem;
            color: #bdc3c7;
          }
          .product-info-order {
            background: rgba(255, 255, 255, 0.02);
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 12px;
          }
          .product-info-order .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.9rem;
            margin-bottom: 4px;
          }
          .order-quantity-badge {
            color: #FFD700;
            font-weight: bold;
            background: rgba(52, 152, 219, 0.1);
            padding: 4px 8px;
            border-radius: 4px;
          }
          .info-item-meta {
            font-size: 0.8rem;
            color: #bdc3c7;
          }

          .price-setting-form {
            margin-top: 1rem;
          }
          .price-label {
            font-size: 0.8rem;
            color: #bdc3c7;
            margin-bottom: 6px;
            display: block;
            font-weight: 600;
          }
          .price-type-toggle {
            display: flex;
            gap: 10px;
            background: rgba(255, 255, 255, 0.03);
            padding: 6px;
            border-radius: 6px;
            margin-bottom: 12px;
          }
          .price-type-toggle label {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            padding: 6px 12px;
            border-radius: 4px;
            border: 1px solid transparent;
            transition: all 0.2s ease;
          }
          .price-type-toggle label.active {
            background: rgba(255, 215, 0, 0.15);
            border-color: rgba(255, 215, 0, 0.3);
            color: #FFD700;
          }
          .price-type-toggle input { display: none; }
          .price-input-wrapper {
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(255, 255, 255, 0.05);
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid rgba(255, 215, 0, 0.2);
          }
          .price-input-wrapper svg { color: #FFD700; }
          .price-input-wrapper input {
            flex: 1;
            padding: 4px 0;
            background: transparent;
            border: none;
            color: #fff;
            font-size: 0.9rem;
            outline: none;
          }
          .btn-activate-checkout {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            border: none;
            border-radius: 8px;
            color: #000;
            font-weight: 700;
            cursor: pointer;
            margin-top: 15px;
            font-size: 0.9rem;
            transition: all 0.2s ease;
          }
          .btn-activate-checkout:hover:not(:disabled) {
            opacity: 0.9;
          }
          .btn-activate-checkout:disabled {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.5);
            cursor: not-allowed;
          }
          .checkout-active-info {
            background: rgba(46, 204, 113, 0.1);
            border: 1px solid rgba(46, 204, 113, 0.3);
            border-radius: 8px;
            padding: 12px;
            margin-top: 15px;
          }
          .checkout-active-title {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            color: #27ae60;
            font-size: 1rem;
            font-weight: 600;
          }
          .checkout-price-item {
            font-size: 0.85rem;
            color: #bdc3c7;
          }
          
          .chat-interface {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            height: 100%;
          }
          .message-list {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .chat-empty-placeholder {
            text-align: center;
            color: #bdc3c7;
            padding: 40px;
            font-size: 14px;
            margin: auto;
            opacity: 0.5;
          }
          .message-bubble {
            padding: 12px 16px;
            border-radius: 18px;
            max-width: 80%;
            word-wrap: break-word;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            white-space: pre-wrap;
          }
          .message-bubble.user {
             background-color: rgba(52, 152, 219, 0.1);
             border: 1px solid rgba(52, 152, 219, 0.3);
             color: #fff;
             align-self: flex-start;
             margin-right: auto;
          }
          .message-bubble.admin {
             background-color: rgba(46, 204, 113, 0.1);
             border: 1px solid rgba(46, 204, 113, 0.3);
             color: #fff;
             align-self: flex-end;
             margin-left: auto;
          }
          .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            gap: 10px;
            font-size: 0.5rem;
            opacity: 0.9;
          }
          .message-sender { font-weight: 600; }
          .message-content { font-size: 0.95rem; }
          .message-bubble.sending {
            background: rgba(46, 204, 113, 0.3);
            padding: 12px 16px;
          }
          .sending-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.8rem;
          }
          
          .message-input-area {
            padding: 1rem 1.5rem;
            border-top: 1px solid rgba(255,255,255,0.1);
            background: rgba(30, 30, 30, 0.8);
            flex-shrink: 0;
          }
          .message-input-wrapper {
            display: flex;
            gap: 10px;
            align-items: flex-end;
          }
          .chat-action-button {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #fff;
            flex-shrink: 0;
            transition: background 0.2s ease;
          }
          .chat-action-button:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          .chat-action-button.send {
            background: linear-gradient(135deg, #3498db, #2980b9);
          }
          .chat-action-button.send:disabled {
            background: rgba(255, 255, 255, 0.1);
            cursor: not-allowed;
          }
          .auto-expanding-textarea.chat-textarea {
            width: 100%;
            padding: 12px 15px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 25px;
            color: #fff;
            font-size: 15px;
            outline: none;
            resize: none;
            min-height: 20px;
            overflow-y: hidden;
            max-height: 120px;
            font-family: inherit;
            line-height: 1.4;
          }
          
          .file-preview-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 10px;
            padding: 0 5px;
          }
          .file-preview-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            font-size: 0.75rem;
          }
          .file-image-preview {
              width: 24px;
              height: 24px;
              object-fit: cover;
              border-radius: 4px;
          }
          .remove-file-button {
            background: none;
            border: none;
            color: #ff6b6b;
            cursor: pointer;
            padding: 2px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            transition: color 0.2s ease;
          }
          .remove-file-button:hover {
             color: #e74c3c;
          }
          
          .file-message-container {
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .file-message-image {
             max-width: 100%;
          }
          .file-message-image img {
             max-width: 100%;
             height: auto;
             max-height: 200px;
             border-radius: 8px;
             display: block;
             cursor: zoom-in;
             transition: opacity 0.2s ease;
          }
          .file-message-image img:hover {
             opacity: 0.9;
          }
          .file-message-image.error {
             width: 150px; 
             height: 100px;
             display: flex;
             align-items: center;
             justify-content: center;
             background-color: #333;
             color: #fff;
             border-radius: 8px;
             font-size: 12px;
             opacity: 0.8;
          }

          .file-message-item {
            padding: 8px 12px;
            background: rgba(255,255,255,0.15);
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .file-message-item:hover {
            background: rgba(255,255,255,0.25);
          }
          .file-info {
            flex: 1;
            min-width: 0;
          }
          .file-name {
            font-size: 0.85rem;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .file-size {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.7);
          }
          .file-open-button {
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            color: #fff;
            cursor: pointer;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
            transition: background 0.2s ease;
          }
          .file-open-button:hover {
             background: rgba(255,255,255,0.3);
          }
          
          .product-gallery {
            position: relative;
            width: 100%;
            height: 100px;
            border-radius: 8px;
            overflow: hidden;
            background-color: #2d2d2d;
          }
          .product-gallery.mobile { height: 80px; }
          .product-gallery.no-image {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            border: 1px dashed rgba(255,255,255,0.2);
          }
          .product-gallery-image-wrapper {
            width: 100%;
            height: 100%;
            position: relative;
          }
          .product-gallery-image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .product-gallery-image-error {
            display: none;
            width: 100%;
            height: 100%;
            align-items: center;
            justify-content: center;
            background-color: #2d2d2d;
            color: #fff;
          }
          .gallery-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.7);
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s ease;
          }
          .gallery-nav:hover {
            background: rgba(0,0,0,0.9);
          }
          .gallery-nav.prev { left: 2px; }
          .gallery-nav.next { right: 2px; }
          .gallery-counter {
            position: absolute;
            bottom: 4px;
            right: 4px;
            background: rgba(0,0,0,0.7);
            color: #fff;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
          }
          
          /* Enhanced Mobile Responsiveness */
          @media (max-width: 900px) {
            .mobile-header {
              display: flex;
            }

            .sidebar-container.open .sidebar-overlay {
              display: block;
            }

            .sidebar-container.open .admin-sidebar {
              transform: translateX(0);
            }

            .admin-sidebar {
              position: fixed;
              top: 0;
              left: 0;
              height: 100vh;
              z-index: 1000;
              transform: translateX(-100%);
              transition: transform 0.3s ease;
            }

            .inquiry-main-content {
              margin-left: 0;
              padding: 1.5rem 1rem 1rem 1rem;
              width: 100vw;
              height: calc(100vh - 60px);
              margin-top: 60px;
            }

            .inquiry-layout {
              flex-direction: column;
              height: calc(100vh - 200px);
              position: relative;
            }
            .inquiry-list-panel, .inquiry-detail-panel {
              flex: 0 0 100%;
              width: 100%;
              position: absolute;
              top: 0;
              left: 0;
              height: 100%;
            }
            .inquiry-list-panel.full {
              display: flex;
            }
            .inquiry-detail-panel.full {
              display: flex;
            }
            .inquiry-detail-container {
                border-right: none;
            }
            .inquiry-detail-container.mobile {
              flex-direction: column;
              height: 100%;
            }
            .mobile-detail-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 1rem;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              background: rgba(30, 30, 30, 0.8);
              flex-shrink: 0;
            }
            .back-to-list-button {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 0.5rem 1rem;
              background: rgba(255, 165, 0, 0.1);
              border: 1px solid rgba(255, 165, 0, 0.3);
              color: #FFA500;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              transition: background 0.2s ease;
            }
            .back-to-list-button:hover {
               background: rgba(255, 165, 0, 0.2);
            }
            .mobile-detail-tabs {
              display: flex;
              gap: 10px;
            }
            .mobile-detail-tabs button {
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 6px;
              color: #fff;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .mobile-detail-tabs button.active {
              background: rgba(255, 215, 0, 0.2);
              border-color: #FFD700;
              color: #FFD700;
            }
            .mobile-content-area {
              flex: 1;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }
            .mobile-content-area .chat-interface {
              height: 100%;
            }
            .mobile-content-area .context-sidebar {
              flex: 1;
              overflow-y: auto;
              width: 100%;
              flex-shrink: 1;
            }
            .mobile-content-area .context-sidebar-scrollable {
              padding: 1rem;
            }
            .status-updater-mobile {
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              padding: 1rem;
              margin-bottom: 1rem;
            }
            .status-updater-mobile h3 {
              color: #FFA500;
              margin: 0 0 10px 0;
              font-size: 1rem;
            }
            .status-updater-mobile select {
              width: 100%;
              padding: 0.75rem;
              border-radius: 8px;
              border: 1px solid rgba(255, 215, 0, 0.3);
              background-color: rgba(30, 30, 30, 0.8);
              color: #e0e0e0;
              cursor: pointer;
            }
            
            .message-bubble {
                max-width: 85%;
            }
            .chat-area {
                border-right: none;
            }

            .inquiry-list-container {
              width: 100%;
              padding: 0.5rem;
            }

            .inquiry-filters {
              flex-direction: column;
              gap: 0.75rem;
            }

            .inquiry-search-input
{
              width: 100%;
              min-width: auto;
            }
            .inquiry-status-filter

            {
              width:50%;
            }
            .inquiry-refresh-button 
            {
            width: fit-content ;
            }
          }
          
          @media (max-width: 480px) {
            .inquiry-main-content {
              padding: 1rem 0.5rem 0.5rem 0.5rem;
            }
            
            .inquiry-title {
              font-size: 1.5rem;
            }
            
            .inquiry-layout {
              height: calc(100vh - 180px);
              gap: 1rem;
            }
            
            .chat-header {
              padding: 1rem;
            }
            
            .chat-title {
              font-size: 1.2rem;
            }
            
            .chat-subtitle {
              font-size: 0.8rem;
            }
            
            .message-input-area {
              padding: 0.75rem;
            }
            
            .message-bubble {
                max-width: 90%;
                padding: 10px 12px;
            }
            
            .context-sidebar-scrollable {
              padding: 0.75rem;
            }
            
            .context-card-title {
              padding: 0.75rem 1rem;
              font-size: 0.9rem;
            }
            
            .context-card-body {
              padding: 0.75rem 1rem;
            }
            
            .product-info-header {
              flex-direction: column;
              gap: 8px;
            }
            
            .product-info-gallery {
              width: 100%;
              height: 120px;
            }
            
            .inquiry-list-item {
              padding: 0.75rem;
            }
            
            .item-customer {
              font-size: 0.9rem;
            }
            
            .item-time {
              font-size: 0.7rem;
            }
          }

          @media (max-width: 360px) {
            .mobile-detail-header {
              flex-direction: column;
              gap: 10px;
              align-items: flex-start;
            }
            
            .mobile-detail-tabs {
              width: 100%;
              justify-content: space-between;
            }
            
            .mobile-detail-tabs button {
              flex: 1;
              text-align: center;
            }
            
            .inquiry-filters {
              gap: 0.5rem;
            }
            
            .message-input-wrapper {
              gap: 5px;
            }
            
            .chat-action-button {
              width: 35px;
              height: 35px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AdminInquiry;