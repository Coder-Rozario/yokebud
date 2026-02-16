import { useState, useEffect, useRef } from 'react';
import { FaHome, FaList, FaSearch, FaPhone, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';
import { FaXmark, FaBars } from 'react-icons/fa6';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../pages/context/CartContext';
import '../pages/styles/MobileNav.scss';

const MobileNav = ({ onCategoryClick, onCloseSidebar }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getTotalItems = () => 0, totalProductsCount } = useCart?.() || {};
  const cartCount = typeof totalProductsCount === 'number' ? totalProductsCount : getTotalItems();
  const categoryBtnRef = useRef(null);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    
    if (newState && onCategoryClick) {
      onCategoryClick();
    }
    if (!newState && onCloseSidebar) {
      onCloseSidebar();
    }
  };

  // যে কোনো নেভিগেশন বা ক্লিকের সময় সাইডবার বন্ধ করুন
  const closeSidebarOnAction = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
      if (onCloseSidebar) {
        onCloseSidebar();
      }
    }
  };

  // Ensure icon resets to hamburger after any navigation (e.g., user clicked a category)
  useEffect(() => {
    if (sidebarOpen) {
      setSidebarOpen(false);
      if (onCloseSidebar) onCloseSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Reset icon if user clicks anywhere outside the Category button (sidebar likely hidden)
  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (!sidebarOpen) return;
      const btn = categoryBtnRef.current;
      if (btn && btn.contains(event.target)) return;
      setSidebarOpen(false);
      if (onCloseSidebar) onCloseSidebar();
    };
    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [sidebarOpen, onCloseSidebar]);

  // Show back button on About and Contact pages
  const isBackPage = location.pathname === '/about' || location.pathname === '/contact';
  const handleBack = () => {
    closeSidebarOnAction();
    navigate(-1);
  };

  const handleCartClick = () => {
    closeSidebarOnAction();
    navigate('/cart');
  };

  const handleHomeClick = () => {
    closeSidebarOnAction();
  };

  const handleContactClick = () => {
    closeSidebarOnAction();
  };

  return (
    <>
      <div id="mobile_nav">
        <Link to="/" onClick={handleHomeClick}><FaHome /> Home</Link>
        {isBackPage ? (
          <button onClick={handleBack}>
            <FaArrowLeft /> Back
          </button>
        ) : (
          <button onClick={toggleSidebar} ref={categoryBtnRef}>
            {sidebarOpen ? <FaXmark /> : <FaBars />} Category
          </button>
        )}
        <button
          onClick={handleCartClick}
          style={{ position: 'relative', flexDirection: 'column', display: 'flex', alignItems: 'center' }}
        >
          <FaShoppingCart /> Cart
          {cartCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: '#FFD700',
                color: '#111',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                boxShadow: '0 0 5px rgba(255, 215, 0, 0.8)',
                border: '2px solid #1a1a1a'
              }}
            >
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </button>
        <Link to="/contact" onClick={handleContactClick}><FaPhone /> Contact</Link>
      </div>
    </>
  );
};

export default MobileNav;