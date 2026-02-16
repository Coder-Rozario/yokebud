// src/pages/CartPage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../pages/context/CartContext';
import CartItem from '../components/CartItem';

const MotionLink = motion.create(Link);

const CartPage = () => {
  const { 
    cartItems, 
    clearCart, 
    getTotalItems, 
    getTotalPrice 
  } = useCart();
  const navigate = useNavigate();

  // Calculate price range for cart items (B2B style)
  const calculatePriceRange = (items) => {
    if (items.length === 0) return { min: 0, max: 0 };
    
    const totalMin = items.reduce((sum, item) => {
      const itemMinPrice = item.product?.min_price || item.price;
      return sum + (itemMinPrice * item.quantity);
    }, 0);
    
    const totalMax = items.reduce((sum, item) => {
      const itemMaxPrice = item.product?.max_price || item.price;
      return sum + (itemMaxPrice * item.quantity);
    }, 0);
    
    return {
      min: totalMin.toFixed(2),
      max: totalMax.toFixed(2)
    };
  };

  const priceRange = calculatePriceRange(cartItems);
  const hasPriceRange = priceRange.min !== priceRange.max;

  // Calculate total unique products in cart
  const getTotalUniqueProducts = () => {
    return cartItems.length;
  };

  // Empty Cart State
  if (cartItems.length === 0) {
    return (
      <motion.div
        className="cart-page empty-cart"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          display: 'flex',
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '90vh',
          textAlign: 'center',
          padding: '2rem'
        }}
      >
        <div className="empty-cart-message">
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              marginBottom: '1rem',
              color: '#FFD700'
            }}
          >
            Your Cart is Empty
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              fontSize: 'clamp(1rem, 3vw, 1.2rem)',
              marginBottom: '2rem',
              color: '#ccc'
            }}
          >
            Looks like you haven't added anything to your cart yet
          </motion.p>
          <motion.button
            whileHover={{ 
              scale: 1.05,
              backgroundColor: 'rgba(255, 215, 0, 0.2)'
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            style={{
              padding: 'clamp(10px, 3vw, 15px)',
              background: 'transparent',
              border: '2px solid #FFD700',
              color: '#FFD700',
              borderRadius: '8px',
              fontSize: 'clamp(0.9rem, 3vw, 1rem)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Continue Shopping
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="cart-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(1rem, 3vw, 2rem)',
        minHeight: '90vh'
      }}
    >
      <div className="cart-container">
        {/* Cart Header */}
        <div className="cart-header" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          borderBottom: '1px solid #333',
          paddingBottom: '1rem'
        }}>
          <motion.h2
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
              color: '#FFD700',
              margin: 0
            }}
          >
            Your Cart ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'})
          </motion.h2>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <motion.button
              whileHover={{ 
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderColor: '#ff0000'
              }}
              whileTap={{ scale: 0.95 }}
              onClick={clearCart}
              style={{
                padding: 'clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px)',
                background: 'transparent',
                border: '1px solid #ff0000',
                color: '#ff0000',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: 'clamp(0.8rem, 3vw, 1rem)',
                fontWeight: '500'
              }}
            >
              Clear Cart
            </motion.button>
            
            {/* Total Products Count - MOQ এর পরিবর্তে */}
            <div style={{
              fontSize: 'clamp(0.9rem, 3vw, 1rem)',
              color: '#ccc',
              background: 'rgba(255, 215, 0, 0.1)',
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}>
              Products: {getTotalUniqueProducts()}
            </div>
          </div>
        </div>
        
        {/* Cart Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Cart Items */}
          <motion.div 
            className="cart-items"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}
          >
            {cartItems.map((item, index) => (
              <CartItem 
                key={`${item.id}-${index}-${item.selectedSize || ''}`} 
                item={item} 
                index={index}
              />
            ))}
          </motion.div>
          

        </div>
      </div>
    </motion.div>
  );
};

export default CartPage;
