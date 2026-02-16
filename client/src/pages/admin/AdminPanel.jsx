import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import { jsPDF } from 'jspdf';

const UserActivityChart = ({ data, isMobile }) => {
  const width = 600;
  const height = 300;
  const padding = 40;

  const sorted = Array.isArray(data)
    ? [...data]
        .filter(d => d && d.date != null && d.count != null)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  const last = sorted.slice(Math.max(0, sorted.length - 30));

  const counts = last.map(d => Number(d.count) || 0);
  const dates = last.map(d => new Date(d.date));

  const minCount = counts.length ? Math.min(...counts) : 0;
  const maxCount = counts.length ? Math.max(...counts) : 1;
  const yMin = Math.max(0, Math.min(minCount, maxCount - 5));
  const yMax = maxCount === yMin ? yMin + 1 : maxCount;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const xStep = last.length > 1 ? innerW / (last.length - 1) : 0;
  const yScale = v => {
    const t = (v - yMin) / (yMax - yMin);
    return padding + (1 - t) * innerH;
  };

  const points = last.map((d, i) => {
    const x = padding + i * xStep;
    const y = yScale(Number(d.count) || 0);
    return `${x},${y}`;
  }).join(' ');

  const gridY = [0, 0.25, 0.5, 0.75, 1].map(t => padding + t * innerH);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{
      height: '300px',
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '8px',
      color: '#aaa'
    }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        <defs>
          <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FFA500" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="fillGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FFA500" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFA500" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={height} fill="transparent" rx="8" />

        {gridY.map((y, idx) => (
          <line key={idx} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#444" strokeDasharray="4 4" />
        ))}

        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#666" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#666" />

        {last.length > 0 && (
          <>
            <polyline fill="none" stroke="url(#lineGrad)" strokeWidth="3" points={points} />
            {(() => {
              const areaPoints = `${points} ${width - padding},${height - padding} ${padding},${height - padding}`;
              return <polygon points={areaPoints} fill="url(#fillGrad)" />;
            })()}
            {last.map((d, i) => {
              const x = padding + i * xStep;
              const y = yScale(Number(d.count) || 0);
              return <circle key={i} cx={x} cy={y} r={2.5} fill="#FFD700" />;
            })}
          </>
        )}

        <text x={padding - 8} y={padding - 10} fill="#aaa" fontSize={isMobile ? 8 : 10} textAnchor="end">
          {yMax}
        </text>
        <text x={padding - 8} y={height - padding} fill="#aaa" fontSize={isMobile ? 8 : 10} textAnchor="end">
          {yMin}
        </text>

        {last.length > 0 && (
          <>
            <text x={padding} y={height - padding + 16} fill="#aaa" fontSize={isMobile ? 8 : 10} textAnchor="start">
              {dates[0].toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </text>
            <text x={width - padding} y={height - padding + 16} fill="#aaa" fontSize={isMobile ? 8 : 10} textAnchor="end">
              {dates[dates.length - 1].toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </text>
          </>
        )}
      </svg>
    </motion.div>
  );
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
    totalMessages: 0,
    unreadMessages: 0,
    unrepliedMessages: 0
  });
  const [growth, setGrowth] = useState({
    messages: 0,
    products: 0,
    users: 0 // Users growth added
  });
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userActivity, setUserActivity] = useState([]);
  
  // Subscribers state
  const [subscribers, setSubscribers] = useState([]);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  
  // Order management state
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch data in parallel
        const [productsResponse, messagesResponse, dashboardResponse, usersResponse, subscribersResponse] = await Promise.all([
          fetch('https://api.yokebud.com/api/products'),
          fetch('https://api.yokebud.com/api/messages'),
          fetch('https://api.yokebud.com/api/admin/dashboard', { credentials: 'include' }),
          fetch('https://api.yokebud.com/api/user-profiles/count'),
          fetch('https://api.yokebud.com/api/subscribers', { credentials: 'include' })
        ]);

        const productsData = productsResponse.ok ? await productsResponse.json() : [];
        const messagesData = messagesResponse.ok ? await messagesResponse.json() : [];
        const dashboardData = dashboardResponse.ok ? await dashboardResponse.json() : {};
        const usersData = usersResponse.ok ? await usersResponse.json() : {};
        const subscribersData = subscribersResponse.ok ? await subscribersResponse.json() : { subscribers: [] };
        console.log('Subscribers API Response:', subscribersData); // Debug log

        console.log('Users API Response:', usersData); // Debug log

        // Compute counts
        const totalProducts = Array.isArray(productsData) ? productsData.length : 0;
        const totalMessages = Array.isArray(messagesData) ? messagesData.length : 0;
        const unreadMessages = Array.isArray(messagesData) ? messagesData.filter(msg => !msg.is_read).length : 0;
        const unrepliedMessages = Array.isArray(messagesData) ? messagesData.filter(msg => !msg.is_replied).length : 0;

        // Get total users from user_profiles count API
        const totalUsers = usersData.totalUsers || 0;

        // Helper to compute MoM growth (last 30 days vs previous 30 days)
        const computeGrowth = (items, getDate) => {
          const now = new Date();
          const currentStart = new Date(now);
          currentStart.setDate(now.getDate() - 30);
          const prevStart = new Date(currentStart);
          prevStart.setDate(prevStart.getDate() - 30);

          let currentCount = 0;
          let prevCount = 0;

          for (const item of items) {
            const d = new Date(getDate(item));
            if (isNaN(d)) continue;
            if (d >= currentStart && d <= now) currentCount += 1;
            else if (d >= prevStart && d < currentStart) prevCount += 1;
          }

          if (prevCount === 0) return currentCount > 0 ? 100 : 0;
          return ((currentCount - prevCount) / prevCount) * 100;
        };

        // Calculate growth for messages, products and users
        const messagesGrowth = computeGrowth(messagesData, (m) => m.created_at);
        const productsGrowth = computeGrowth(productsData, (p) => p.created_at);
        
        // Calculate users growth from activity data
        let usersGrowth = 0;
        if (usersData.activity && Array.isArray(usersData.activity)) {
          const now = new Date();
          const currentStart = new Date(now);
          currentStart.setDate(now.getDate() - 30);
          const prevStart = new Date(currentStart);
          prevStart.setDate(prevStart.getDate() - 30);

          let currentCount = 0;
          let prevCount = 0;

          usersData.activity.forEach(activity => {
            const d = new Date(activity.date);
            if (isNaN(d)) return;
            if (d >= currentStart && d <= now) currentCount += activity.count;
            else if (d >= prevStart && d < currentStart) prevCount += activity.count;
          });

          if (prevCount === 0) {
            usersGrowth = currentCount > 0 ? 100 : 0;
          } else {
            usersGrowth = ((currentCount - prevCount) / prevCount) * 100;
          }
        }

        setGrowth({
          messages: Number.isFinite(messagesGrowth) ? Number(messagesGrowth.toFixed(1)) : 0,
          products: Number.isFinite(productsGrowth) ? Number(productsGrowth.toFixed(1)) : 0,
          users: Number.isFinite(usersGrowth) ? Number(usersGrowth.toFixed(1)) : 0
        });

        // Normalize dashboard stats structure
        const dashStats = dashboardData && dashboardData.stats ? dashboardData.stats : dashboardData || {};

        setStats({
          totalUsers: totalUsers, // Use data from user_profiles API
          // activeUsers: usersData.activeUsers || 0,
          totalProducts: totalProducts,
          totalOrders: dashStats.totalOrders || dashStats.pendingOrders || 0,
          revenue: dashStats.revenue || 0,
          totalMessages: totalMessages,
          unreadMessages: unreadMessages,
          unrepliedMessages: unrepliedMessages
        });
        setUserActivity(Array.isArray(usersData.activity) ? usersData.activity : []);
        
        // Set subscribers data
        console.log('Subscribers API Response:', subscribersData); // Debug log
        if (subscribersData && Array.isArray(subscribersData.subscribers)) {
          setSubscribers(subscribersData.subscribers);
          setTotalSubscribers(subscribersData.subscribers.length);
        } else if (subscribersData && subscribersData.total) {
          setTotalSubscribers(subscribersData.total);
          setSubscribers(subscribersData.data || []);
        } else if (Array.isArray(subscribersData)) {
          // If the API returns an array directly
          setSubscribers(subscribersData);
          setTotalSubscribers(subscribersData.length);
        } else {
          setSubscribers([]);
          setTotalSubscribers(0);
        }
      } catch (err) {
        setError(err.message);
        console.error('Dashboard error:', err);
        
        // Fallback to mock data if API fails
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalProducts: 0,
          totalOrders: 0,
          revenue: 0,
          totalMessages: 0,
          unreadMessages: 0,
          unrepliedMessages: 0
        });
        setGrowth({ messages: 0, products: 0, users: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch orders with pagination
  const fetchOrders = async (page = 1) => {
    try {
      setLoadingOrders(true);
      const response = await fetch(
        `https://api.yokebud.com/api/orders?page=${page}&limit=${pagination.limit}`, 
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages
        });
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Call fetchOrders in useEffect
  useEffect(() => {
    fetchOrders();
  }, []);

  // View order details
  const viewOrderDetails = async (orderId) => {
    try {
      const response = await fetch(
        `https://api.yokebud.com/api/orders/${orderId}`, 
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data.order);
        setShowOrderModal(true);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `https://api.yokebud.com/api/orders/${orderId}/status`, 
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Update the orders list
        setOrders(orders.map(order => 
          order.order_id === orderId ? data.order : order
        ));
        // Update the selected order if it's the one being viewed
        if (selectedOrder && selectedOrder.order_id === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // Generate PDF for order
  const generateOrderPDF = (order) => {
    const doc = new jsPDF();
    
    // Add logo or header
    doc.setFontSize(22);
    doc.setTextColor(255, 165, 0);
    doc.text("Order Details", 105, 20, null, null, 'center');
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Order #${order.order_id}`, 14, 30);
    doc.text(`Date: ${new Date(order.order_date).toLocaleDateString()}`, 14, 36);
    doc.text(`Status: ${order.status}`, 14, 42);
    
    // Add line
    doc.setDrawColor(255, 165, 0);
    doc.setLineWidth(0.5);
    doc.line(14, 48, 196, 48);
    
    // Customer information
    doc.setFontSize(14);
    doc.text("Customer Information", 14, 58);
    
    doc.setFontSize(12);
    doc.text(order.customer_name, 14, 66);
    doc.text(order.customer_email, 14, 72);
    doc.text(order.customer_phone, 14, 78);
    
    // Shipping address
    doc.setFontSize(14);
    doc.text("Shipping Address", 14, 90);
    
    doc.setFontSize(12);
    doc.text(order.shipping_address, 14, 98);
    doc.text(`${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}`, 14, 104);
    doc.text(order.shipping_country, 14, 110);
    
    // Order details
    doc.setFontSize(14);
    doc.text("Order Details", 14, 122);
    
    doc.setFontSize(12);
    doc.text(`Payment Method: ${order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}`, 14, 130);
    doc.text(`Shipping Method: ${order.shipping_method === 'standard' ? 'Standard Shipping (3-5 days)' : 'Express Shipping (1-2 days)'}`, 14, 136);
    
    // Order items
    doc.setFontSize(14);
    doc.text("Order Items", 14, 148);
    
    doc.setFontSize(12);
    doc.text(`${order.product_name} x ${order.quantity}`, 14, 156);
    doc.text(`$${(order.product_discounted_price || order.product_price * order.quantity).toFixed(2)}`, 160, 156);
    
    // Order summary
    doc.setFontSize(14);
    doc.text("Order Summary", 14, 168);
    
    doc.setFontSize(12);
    doc.text(`Subtotal: $${order.subtotal}`, 14, 176);
    doc.text(`Shipping: $${order.shipping_cost}`, 14, 182);
    doc.text(`Tax: $${order.tax}`, 14, 188);
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: $${order.total}`, 14, 198);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for your business!", 105, 280, null, null, 'center');
    
    // Save the PDF
    doc.save(`order-${order.order_id}.pdf`);
  };

  // Generate delivery PDF
  const generateDeliveryPDF = (order) => {
    const doc = new jsPDF();
    
    // Add logo or header
    doc.setFontSize(22);
    doc.setTextColor(255, 165, 0);
    doc.text("Yokebud Delivery Note", 105, 20, null, null, 'center');
    
    // Company info
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Yokebud", 14, 30);
    doc.text("Pukinmäenaukio 4", 14, 36);
    doc.text("00720 Helsinki, Finland", 14, 42);
    doc.text("Phone: +358 440 328 124", 14, 48);
    doc.text("Email: yokebud@gmail.com", 14, 54);
    
    // Order info
    doc.setFontSize(12);
    doc.text(`Order #: ${order.order_id}`, 140, 30);
    doc.text(`Date: ${new Date(order.order_date).toLocaleDateString()}`, 140, 36);
    doc.text(`Status: ${order.status}`, 140, 42);
    
    // Add line
    doc.setDrawColor(255, 165, 0);
    doc.setLineWidth(0.5);
    doc.line(14, 60, 196, 60);
    
    // Delivery address
    doc.setFontSize(14);
    doc.text("Delivery Address", 14, 70);
    
    doc.setFontSize(12);
    doc.text(order.customer_name, 14, 78);
    doc.text(order.shipping_address, 14, 84);
    doc.text(`${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}`, 14, 90);
    doc.text(order.shipping_country, 14, 96);
    doc.text(`Phone: ${order.customer_phone}`, 14, 102);
    
    // Order items
    doc.setFontSize(14);
    doc.text("Order Items", 14, 114);
    
    doc.setFontSize(12);
    doc.text(`${order.product_name} x ${order.quantity}`, 14, 122);
    doc.text(`$${(order.product_discounted_price || order.product_price * order.quantity).toFixed(2)}`, 160, 122);
    
    // Delivery notes
    doc.setFontSize(14);
    doc.text("Delivery Notes", 14, 136);
    
    doc.setFontSize(12);
    doc.text("Please handle with care.", 14, 144);
    doc.text("Customer must check items before signing.", 14, 150);
    doc.text("For any issues, contact Yokebud customer service.", 14, 156);
    
    // Signature line
    doc.setFontSize(14);
    doc.text("Customer Signature", 14, 180);
    doc.line(14, 182, 80, 182);
    
    doc.text("Delivery Person", 120, 180);
    doc.line(120, 182, 180, 182);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for choosing Yokebud!", 105, 280, null, null, 'center');
    
    // Save the PDF
    doc.save(`delivery-note-${order.order_id}.pdf`);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch('https://api.yokebud.com/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        window.location.href = '/admin/login';
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // CSS for the loading ring animation
  const loadingRingStyle = `
    @keyframes loading-ring {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      overflowX: 'hidden',
      width: '100vw'
    }}>
      {/* Add the loading ring animation style */}
      <style>{loadingRingStyle}</style>
      
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobile={isMobile} unreadCount={stats.unreadMessages} />
      
      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : '230px',
        padding: isMobile ? '1rem' : '1.5rem',
        width: isMobile ? '100%' : 'calc(100% - 230px)',
        minWidth: 0, // Prevent overflow
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)',
        transition: 'margin-left 0.3s ease'
      }}>
        <span style={{ display: 'none' }}>{motion ? '' : ''}</span>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ?'flex-start': 'center',
          marginBottom: '1.5rem',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '1rem' : 0
        }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 style={{
              fontSize: isMobile ? '1.5rem' : '1.8rem',
              fontWeight: '600',
              background: 'linear-gradient(90deg, #FFA500, #FFD700)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              margin: 0
            }}>Admin Dashboard</h1>
            <div style={{
              color: '#aaa',
              fontSize: '0.9rem'
            }}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </motion.div>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #FF5F6D, #FFC371)',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            Logout
          </button>
        </header>

        {error && (
          <motion.div 
            style={{
              color: '#FF5252',
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: 'rgba(255, 82, 82, 0.1)',
              borderRadius: '8px',
              margin: '1rem 0'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'inline-block',
              width: '80px',
              height: '80px'
            }}>
              <div style={{
                content: '""',
                display: 'block',
                width: '64px',
                height: '64px',
                margin: '8px',
                borderRadius: '50%',
                border: '6px solid #FFA500',
                borderColor: '#FFA500 transparent #FFA500 transparent',
                animation: 'loading-ring 1.2s linear infinite'
              }}></div>
            </div>
            <div style={{
              marginTop: '20px',
              color: '#FFA500',
              fontSize: '1.2rem',
              fontWeight: '500'
            }}>Loading Dashboard Data...</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <motion.div 
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {[
                { 
                  title: 'Total Users', 
                  value: stats.totalUsers, 
                  icon: '👥', 
                  change: growth.users, 
                  // subValue: `${stats.activeUsers} active` 
                },
                { 
                  title: 'Messages', 
                  value: stats.totalMessages, 
                  icon: '✉️', 
                  change: growth.messages, 
                  subValue: `${stats.unrepliedMessages} unreplied`, 
                  hasBadge: stats.unreadMessages > 0, 
                  badgeCount: stats.unreadMessages 
                },
                { title: 'Total Products', value: stats.totalProducts, icon: '👕', change: growth.products },
                { title: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: '💰', change: 0 }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  style={{
                    background: 'rgba(40, 40, 40, 0.7)',
                    borderRadius: '12px',
                    padding: '1.2rem',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 215, 0, 0.1)',
                    transition: 'transform 0.3s ease',
                    position: 'relative'
                  }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.8rem'
                  }}>
                    <div style={{
                      fontSize: isMobile ?'0.61rem': '0.85rem',
                      color: '#aaa',
                      fontWeight: '500',
                      textTransform: 'uppercase'
                    }}>{stat.title}</div>
                    <div style={{ position: 'relative' }}>
                      {stat.icon}
                      {stat.hasBadge && (
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          backgroundColor: '#FF5252',
                          color: 'white',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          {stat.badgeCount}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#FFD700',
                    margin: '0.4rem 0'
                  }}>{stat.value}</div>
                  {stat.subValue && <div style={{
                    fontSize: '0.9rem',
                    color: '#aaa',
                    marginTop: '0.4rem'
                  }}>{stat.subValue}</div>}
                  <div style={{
                    fontSize: isMobile?'0.55rem':'0.75rem',
                    color: stat.change > 0 ? '#4CAF50' : '#F44336',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {stat.change > 0 ? '↑' : stat.change < 0 ? '↓' : ''} {Math.abs(stat.change)}% from last 30 days
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Charts */}
            <motion.div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div style={{
                background: 'rgba(40, 40, 40, 0.7)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 215, 0, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#FFA500'
                }}>Sales Overview</h3>
                <div style={{
                  height: '300px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#aaa'
                }}>
                  [Sales Chart Placeholder - Integrate Chart.js here]
                </div>
              </div>
              <div style={{
                background: 'rgba(40, 40, 40, 0.7)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 215, 0, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#FFA500'
                }}>Subscribers ({totalSubscribers})</h3>
                
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                    {subscribers.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #444', color: '#FFA500' }}>Email</th>
                            <th style={{ textAlign: 'center', padding: '0.5rem', borderBottom: '1px solid #444', color: '#FFA500' }}>Status</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid #444', color: '#FFA500' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subscribers.map((subscriber, index) => (
                            <tr key={subscriber.id || index}>
                              <td style={{ padding: '0.5rem', borderBottom: '1px solid #333', color: '#ddd' }}>
                                {subscriber.email}
                              </td>
                              <td style={{ 
                                textAlign: 'center', 
                                padding: '0.5rem', 
                                borderBottom: '1px solid #333',
                                color: subscriber.is_active ? '#4CAF50' : '#F44336'
                              }}>
                                {subscriber.is_active ? 'Active' : 'Inactive'}
                              </td>
                              <td style={{ 
                                textAlign: 'right', 
                                padding: '0.5rem', 
                                borderBottom: '1px solid #333',
                                color: '#aaa',
                                fontSize: '0.9rem'
                              }}>
                                {new Date(subscriber.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1rem', color: '#aaa' }}>
                        No subscribers found
                      </div>
                    )}
                  </div>
                </div>
            </motion.div>

            {/* Recent Orders */}
            <motion.div
              style={{
                background: 'rgba(40, 40, 40, 0.7)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 215, 0, 0.1)',
                marginBottom: '2rem',
                overflowX: 'auto'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#FFA500'
                }}>Recent Orders</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => fetchOrders(pagination.page - 1)} 
                    disabled={pagination.page === 1}
                    style={{
                      padding: '0.5rem',
                      background: pagination.page === 1 ? '#444' : '#FFA500',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '0.5rem', color: '#FFA500' }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button 
                    onClick={() => fetchOrders(pagination.page + 1)} 
                    disabled={pagination.page === pagination.totalPages}
                    style={{
                      padding: '0.5rem',
                      background: pagination.page === pagination.totalPages ? '#444' : '#FFA500',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
              
              {loadingOrders ? (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '200px',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    display: 'inline-block',
                    width: '80px',
                    height: '80px'
                  }}>
                    <div style={{
                      content: '""',
                      display: 'block',
                      width: '64px',
                      height: '64px',
                      margin: '8px',
                      borderRadius: '50%',
                      border: '6px solid #FFA500',
                      borderColor: '#FFA500 transparent #FFA500 transparent',
                      animation: 'loading-ring 1.2s linear infinite'
                    }}></div>
                  </div>
                  <div style={{
                    marginTop: '20px',
                    color: '#FFA500',
                    fontSize: '1.2rem',
                    fontWeight: '500'
                  }}>Loading Orders...</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '800px'
                  }}>
                    <thead>
                      <tr>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#FFA500',
                          fontWeight: '500'
                        }}>Order ID</th>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#FFA500',
                          fontWeight: '500'
                        }}>Customer</th>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#FFA500',
                          fontWeight: '500'
                        }}>Date</th>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#FFA500',
                          fontWeight: '500'
                        }}>Amount</th>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#FFA500',
                          fontWeight: '500'
                        }}>Status</th>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#FFA500',
                          fontWeight: '500'
                        }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, index) => (
                        <tr key={index}>
                          <td style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>{order.order_id}</td>
                          <td style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>{order.customer_name}</td>
                          <td style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>{new Date(order.order_date).toLocaleDateString()}</td>
                          <td style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>${order.total}</td>
                          <td style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background:
                                order.status === 'Delivered' ? 'rgba(76, 175, 80, 0.2)' :
                                order.status === 'Pending' ? 'rgba(255, 193, 7, 0.2)' :
                                order.status === 'Processing' ? 'rgba(33, 150, 243, 0.2)' :
                                order.status === 'Shipped' ? 'rgba(156, 39, 176, 0.2)' :
                                'rgba(244, 67, 54, 0.2)',
                              color:
                                order.status === 'Delivered' ? '#4CAF50' :
                                order.status === 'Pending' ? '#FFC107' :
                                order.status === 'Processing' ? '#2196F3' :
                                order.status === 'Shipped' ? '#9C27B0' :
                                '#F44336'
                            }}>{order.status}</span>
                          </td>
                          <td style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            <button 
                              onClick={() => viewOrderDetails(order.order_id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FFA500',
                                cursor: 'pointer',
                                marginRight: '0.5rem'
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            margin: isMobile ? '1rem' : 0
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #444',
              paddingBottom: '10px'
            }}>
              <h2 style={{ color: '#FFA500', margin: 0 }}>Order #{selectedOrder.order_id}</h2>
              <button 
                onClick={() => setShowOrderModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFA500',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#FFA500', marginBottom: '10px' }}>Customer Information</h3>
              <p style={{ color: '#ddd' }}>{selectedOrder.customer_name}</p>
              <p style={{ color: '#ddd' }}>{selectedOrder.customer_email}</p>
              <p style={{ color: '#ddd' }}>{selectedOrder.customer_phone}</p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#FFA500', marginBottom: '10px' }}>Shipping Address</h3>
              <p style={{ color: '#ddd' }}>{selectedOrder.shipping_address}</p>
              <p style={{ color: '#ddd' }}>{selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_zip}</p>
              <p style={{ color: '#ddd' }}>{selectedOrder.shipping_country}</p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#FFA500', marginBottom: '10px' }}>Order Details</h3>
              <p style={{ color: '#ddd' }}>
                <strong>Payment Method:</strong> {selectedOrder.payment_method === 'cod' ? 'Cash on Delivery' : selectedOrder.payment_method}
              </p>
              <p style={{ color: '#ddd' }}>
                <strong>Shipping Method:</strong> {selectedOrder.shipping_method === 'standard' ? 'Standard (3-5 days)' : 'Express (1-2 days)'}
              </p>
              <p style={{ color: '#ddd' }}>
                <strong>Status:</strong> {selectedOrder.status}
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#FFA500', marginBottom: '10px' }}>Order Items</h3>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '10px',
                backgroundColor: '#333',
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                <div>
                  <p style={{ color: '#ddd', margin: 0 }}>{selectedOrder.product_name}</p>
                  <p style={{ color: '#aaa', margin: '5px 0 0 0', fontSize: '14px' }}>Qty: {selectedOrder.quantity}</p>
                </div>
                <p style={{ color: '#FFA500', margin: 0 }}>
                  ${(selectedOrder.product_discounted_price || selectedOrder.product_price * selectedOrder.quantity).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#FFA500', marginBottom: '10px' }}>Order Summary</h3>
              <div style={{ 
                backgroundColor: '#333',
                padding: '15px',
                borderRadius: '4px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{ color: '#ddd' }}>Subtotal:</span>
                  <span style={{ color: '#ddd' }}>${selectedOrder.subtotal}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{ color: '#ddd' }}>Shipping:</span>
                  <span style={{ color: '#ddd' }}>${selectedOrder.shipping_cost}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{ color: '#ddd' }}>Tax:</span>
                  <span style={{ color: '#ddd' }}>${selectedOrder.tax}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginTop: '15px',
                  paddingTop: '10px',
                  borderTop: '1px solid #444',
                  fontWeight: 'bold'
                }}>
                  <span style={{ color: '#FFA500' }}>Total:</span>
                  <span style={{ color: '#FFA500' }}>${selectedOrder.total}</span>
                </div>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginTop: '20px',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '10px' : 0
            }}>
              <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                <button
                  onClick={() => generateOrderPDF(selectedOrder)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4285F4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  Download Invoice
                </button>
                
                <button
                  onClick={() => generateDeliveryPDF(selectedOrder)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#34A853',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  Delivery Note
                </button>
              </div>
              
              <select
                value={selectedOrder.status}
                onChange={(e) => updateOrderStatus(selectedOrder.order_id, e.target.value)}
                style={{
                  padding: '10px',
                  backgroundColor: '#333',
                  color: '#ddd',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;