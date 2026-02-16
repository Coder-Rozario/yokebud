import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [inquiryProduct, setInquiryProduct] = useState(null);

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
        // Calculate total items count and products count
        const totalItems = parsedCart.reduce((sum, item) => sum + item.quantity, 0);
        const totalProducts = parsedCart.length;
        setTotalItemsCount(totalItems);
        setTotalProductsCount(totalProducts);
      }
      
      // Load inquiry product if exists
      const savedInquiryProduct = localStorage.getItem('inquiryCheckoutData');
      if (savedInquiryProduct) {
        setInquiryProduct(JSON.parse(savedInquiryProduct));
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      // If there's an error, initialize with empty cart
      localStorage.removeItem('cart');
      localStorage.removeItem('inquiryCheckoutData');
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes (but only after initial load)
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('cart', JSON.stringify(cartItems));
        // Update counts whenever cartItems changes
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalProducts = cartItems.length;
        setTotalItemsCount(totalItems);
        setTotalProductsCount(totalProducts);
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
      }
    }
  }, [cartItems, isInitialized]);

  const addToCart = (product, quantity = 1) => {
    const finalQuantity = Math.max(quantity, product.moq || 1);
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.id === product.id && 
        (!product.selectedSize || item.selectedSize === product.selectedSize)
      );
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id && 
          (!product.selectedSize || item.selectedSize === product.selectedSize)
            ? { ...item, quantity: item.quantity + finalQuantity }
            : item
        );
      }
      
      return [...prevItems, { 
        id: product.id,
        name: product.product_name,
        price: product.discounted_price || product.price,
        min_price: product.min_price || product.discounted_price || product.price,
        max_price: product.max_price || product.price,
        discounted_price: product.discounted_price,
        image: product.firstImage || (product.product_photos && product.product_photos[0]),
        product_photos: product.product_photos || [],
        quantity: finalQuantity,
        selectedSize: product.selectedSize,
        moq: product.moq || 1,
        sku: product.sku || '',
        material: product.material || '',
        care_instructions: product.care_instructions || '',
        shipping_info: product.shipping_info || '',
        warranty: product.warranty || '',
        bulk_discount: product.bulk_discount || '',
        tags: product.tags || [],
        features: product.features || [],
        product_details: product.product_details || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        product // Store the complete product object
      }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const setInquiryCheckoutProduct = (product, priceData, inquiryNumber, inquiryId) => {
    // Store the inquiry product data for checkout using a products array
    const inquiryProductData = {
      products: [product],
      priceData,
      inquiryNumber,
      inquiryId,
    };
    setInquiryProduct(inquiryProductData);

    // Also store in localStorage for persistence
    try {
      localStorage.setItem('inquiryCheckoutData', JSON.stringify(inquiryProductData));
    } catch (error) {
      console.error('Failed to persist inquiry checkout data:', error);
    }
  };

  const clearInquiryProduct = () => {
    setInquiryProduct(null);
    localStorage.removeItem('inquiryCheckoutData');
  };

  const updateQuantity = (productId, newQuantity) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === productId) {
          const minQuantity = item.moq || 1;
          return { 
            ...item, 
            quantity: Math.max(newQuantity, minQuantity) 
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalProducts = () => {
    return cartItems.length;
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItemsCount, // Total quantity of all items
        totalProductsCount, // Total number of unique products
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalProducts,
        getTotalPrice,
        inquiryProduct,
        setInquiryCheckoutProduct,
        clearInquiryProduct
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
