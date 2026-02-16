// src/components/CartItem.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiTrash2 } from 'react-icons/fi';
import { useCart } from '../pages/context/CartContext';
import { useNavigate } from 'react-router-dom';

const CartItem = ({ item, index }) => {
  const { removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleRemove = () => {
    removeFromCart(item.id);
  };

  const handleInquiry = () => {
    // Navigate to inquiry page with product data
    navigate('/inquiry', { 
      state: { 
        product: {
          ...item,
          selectedSize: item.selectedSize || 'Customizable',
          quantity: item.quantity || 1,
          // Ensure all necessary fields are included
          name: item.name,
          product_name: item.name,
          price: item.price,
          min_price: item.price,
          max_price: item.price
        }
      } 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      style={{
        display: 'flex',
        background: 'rgba(30, 30, 30, 0.8)',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid rgba(255, 215, 0, 0.1)',
        boxShadow: '0 5px 20px rgba(0, 0, 0, 0.2)',
        gap: '1.5rem',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Product Image */}
      <div style={{
        width: '100px',
        height: '100px',
        borderRadius: '8px',
        overflow: 'hidden',
        flexShrink: 0,
        background: '#000'
      }}>
        <img 
          src={item.image} 
          alt={item.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          onError={(e) => {
            e.target.style.backgroundColor = '#2a2a2a';
            e.target.style.display = 'flex';
            e.target.style.alignItems = 'center';
            e.target.style.justifyContent = 'center';
            e.target.style.color = '#FFA500';
            e.target.innerHTML = '🛒';
          }}
        />
      </div>

      {/* Product Details */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: '1.2rem',
          fontWeight: '600',
          margin: 0,
          lineHeight: '1.3'
        }}>
          {item.name}
        </h3>

        {item.selectedSize && (
          <div style={{
            display: 'inline-block',
            background: 'rgba(255, 215, 0, 0.1)',
            color: '#FFD700',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}>
            Size: {item.selectedSize}
          </div>
        )}

        {/* Price Range Display - Min and Max Price */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {item.priceRange ? (
            <span style={{
              fontSize: '1.3rem',
              fontWeight: '700',
              background: 'linear-gradient(90deg, #FFD700, #FFA500)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
              {item.priceRange}
            </span>
          ) : (item.min_price && item.max_price) ? (
            <span style={{
              fontSize: '1.3rem',
              fontWeight: '700',
              background: 'linear-gradient(90deg, #FFD700, #FFA500)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
              ${item.min_price} - ${item.max_price}
            </span>
          ) : item.price ? (
            <span style={{
              fontSize: '1rem',
              fontWeight: '700',
              background: 'linear-gradient(90deg, #FFD700, #FFA500)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
              ${item.price}
            </span>
          ) : (
            <span style={{
              fontSize: '1.3rem',
              fontWeight: '700',
              background: 'linear-gradient(90deg, #FFD700, #FFA500)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
              Price on inquiry
            </span>
          )}
        </div>

        {/* Product Specifications */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          fontSize: '0.9rem',
          color: '#ccc'
        }}>
          {item.moq && (
            <span>MOQ: {item.moq} pieces</span>
          )}
          {item.quantity && (
            <span>Quantity: {item.quantity} pieces</span>
          )}
          {item.specifications && (
            <span>Specs: {item.specifications}</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        alignItems: 'center'
      }}>
        {/* Inquiry Button */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 215, 0, 0.2)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleInquiry}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(255, 215, 0, 0.1)',
            color: '#FFD700',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            minWidth: '140px',
            justifyContent: 'center'
          }}
        >
          <FiMessageCircle style={{ fontSize: '1.1rem' }} />
          Inquire Now
        </motion.button>

        {/* Remove Button */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRemove}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'transparent',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            minWidth: '140px',
            justifyContent: 'center'
          }}
        >
          <FiTrash2 style={{ fontSize: '1.1rem' }} />
          Remove
        </motion.button>
      </div>

      {/* Inquiry Badge */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        color: '#fff',
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: '700',
        zIndex: 1,
        letterSpacing: '0.5px'
      }}>
        INQUIRY ITEM
      </div>
    </motion.div>
  );
};

export default CartItem;