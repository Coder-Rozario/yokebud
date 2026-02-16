import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AOS from 'aos'; // Import AOS library
import 'aos/dist/aos.css'; // Import AOS CSS
import './pages/styles/main.min.css'; // Your main styles
import { CartProvider } from './pages/context/CartContext';
import { HelmetProvider } from 'react-helmet-async';

// Initialize AOS (Animate On Scroll) library
AOS.init({
  duration: 800, // Animation duration
  easing: 'ease-in-out', // Easing type
  once: true, // Whether animation should happen only once
  offset: 100, // Offset (in px) from the original trigger point
});

// Create React root
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </HelmetProvider>
  </React.StrictMode>
);