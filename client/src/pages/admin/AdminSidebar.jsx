import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';

const AdminSidebar = ({ activeTab, setActiveTab, messagesUnreadCount, inquiriesUnreadCount, unreadCount }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localUnread, setLocalUnread] = useState({ messages: 0, inquiries: 0 });
  const [newOrderCount, setNewOrderCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Auto-set activeTab based on current path
  useEffect(() => {
    const currentItem = navItems.find((item) => location.pathname === item.path);
    if (currentItem && currentItem.key !== activeTab) {
      setActiveTab(currentItem.key);
    }
  }, [location.pathname]);

  // ✅ Always-visible unread badges: fetch counts locally so they don't depend on active tab
  useEffect(() => {
    let isCancelled = false;

    const fetchUnread = async () => {
      try {
        // Messages unread
        const messagesRes = await fetch('https://api.yokebud.com/api/messages', { credentials: 'include' });
        const messagesData = messagesRes.ok ? await messagesRes.json() : [];
        const messagesUnread = Array.isArray(messagesData)
          ? messagesData.filter((m) => !m.is_read).length
          : 0;

        // Inquiries unread: count inquiries with admin_unread_count > 0 or status === 'new'
        let inquiriesUnread = 0;
        try {
          const inquiriesRes = await fetch('https://api.yokebud.com/api/inquiries', { credentials: 'include' });
          const inquiriesData = inquiriesRes.ok ? await inquiriesRes.json() : [];
          if (Array.isArray(inquiriesData)) {
            const attentionIds = new Set();
            inquiriesData.forEach((inq) => {
              const hasUnread = (inq && (inq.admin_unread_count || 0) > 0);
              const isNew = (inq && (inq.status === 'new'));
              if (hasUnread || isNew) attentionIds.add(inq.id);
            });
            inquiriesUnread = attentionIds.size;
          }
        } catch {
          // Fall back to prop if available
          inquiriesUnread = typeof inquiriesUnreadCount === 'number' ? inquiriesUnreadCount : 0;
        }

        if (!isCancelled) {
          setLocalUnread({ messages: messagesUnread, inquiries: inquiriesUnread });
        }
      } catch {
        if (!isCancelled) {
          setLocalUnread((prev) => ({ ...prev }));
        }
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [inquiriesUnreadCount]);

  // Orders badge: read from localStorage and keep in sync
  useEffect(() => {
    const readCount = () => {
      try {
        const raw = localStorage.getItem('new_order_count');
        const parsed = raw ? parseInt(raw, 10) : 0;
        setNewOrderCount(Number.isNaN(parsed) ? 0 : parsed);
      } catch {
        setNewOrderCount(0);
      }
    };
    readCount();
    const interval = setInterval(readCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    window.location.href = '/admin/login';
  };

  const sidebarStyle = {
    background: 'rgba(26, 26, 26, 0.95)',
    backdropFilter: 'blur(10px)',
    height: '100vh',
    width: isMobile ? (sidebarOpen ? '100%' : '0') : '250px',
    padding: isMobile ? (sidebarOpen ? '1.5rem 1rem' : '0') : '1.5rem 1rem',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 1000,
    borderRight: '1px solid rgba(255, 215, 0, 0.1)',
    boxShadow: '0 4px 30px rgba(255, 165, 0, 0.15)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  // ✅ Nav Items - AdminInquiry tab added
  const navItems = [
    { label: 'Dashboard', icon: '📊', path: '/admin/dashboard', key: 'dashboard' },
    { label: 'Orders', icon: '🛒', path: '/admin/orders', key: 'orders' },
    { label: 'Products', icon: '👕', path: '/admin/products', key: 'products' },
    { label: 'Upload', icon: '⤴️', path: '/admin/upload', key: 'upload' },
    { label: 'Messages', icon: '📬', path: '/admin/messages', key: 'messages' },
    { label: 'Inquiries', icon: '💬', path: '/admin/AdminInquiry', key: 'inquiries' }, // New tab added
    {
      label: 'Analytics',
      icon: '📈',
      path: 'https://analytics.google.com/analytics/web/?utm_source=marketingplatform.google.com&utm_medium=et&utm_campaign=marketingplatform.google.com%2Fabout%2Fanalytics%2F#/p489818346/reports/intelligenthome?params=_u..nav%3Dmaui',
      key: 'analytics',
      external: true
    },
    { label: 'Change Password', icon: '🔑', path: '/admin/change_password', key: 'change_password' },
  ];

  const titleStyle = {
    background: 'linear-gradient(90deg, #FFA500, #FFD700)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    marginBottom: '2rem',
    display: sidebarOpen || !isMobile ? 'block' : 'none',
  };

  const linkStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    marginBottom: '0.5rem',
    borderRadius: '8px',
    textDecoration: 'none',
    color: isActive ? '#FFD700' : 'rgba(255, 255, 255, 0.8)',
    backgroundColor: isActive ? 'rgba(255, 165, 0, 0.15)' : 'transparent',
    border: isActive ? '1px solid rgba(255, 165, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    opacity: sidebarOpen || !isMobile ? 1 : 0,
    transform: sidebarOpen || !isMobile ? 'translateX(0)' : 'translateX(-100%)',
  });

  const iconStyle = {
    fontSize: '1.25rem',
    marginRight: '0.75rem',
    minWidth: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const textStyle = {
    whiteSpace: 'nowrap',
    fontSize: '0.95rem',
  };

  const badgeStyle = {
    marginLeft: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '18px',
    height: '18px',
    padding: '0 6px',
    borderRadius: '10px',
    background: 'rgba(255, 69, 58, 0.2)',
    border: '1px solid rgba(255, 69, 58, 0.4)',
    color: '#ff6b6b',
    fontSize: '0.7rem',
    fontWeight: 700,
  };

  const resolvedMessagesUnread =
    typeof messagesUnreadCount === 'number'
      ? messagesUnreadCount
      : typeof unreadCount === 'number'
      ? unreadCount
      : localUnread.messages;
  const resolvedInquiriesUnread =
    typeof inquiriesUnreadCount === 'number' ? inquiriesUnreadCount : localUnread.inquiries;

  const logoutButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    background: 'rgba(255, 0, 0, 0.1)',
    border: '1px solid rgba(255, 0, 0, 0.3)',
    color: 'rgba(255, 100, 100, 0.9)',
    cursor: 'pointer',
    width: '100%',
    marginTop: 'auto',
    transition: 'all 0.3s ease',
    opacity: sidebarOpen || !isMobile ? 1 : 0,
    transform: sidebarOpen || !isMobile ? 'translateX(0)' : 'translateX(-100%)',
  };

  const menuToggleStyle = {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    zIndex: 1100,
    background: 'rgba(255, 165, 0, 0.2)',
    border: '1px solid rgba(255, 165, 0, 0.5)',
    borderRadius: '4px',
    padding: '0.5rem',
    display: isMobile ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFD700',
    cursor: 'pointer',
  };

  return (
    <>
      {isMobile && (
        <div style={menuToggleStyle} onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </div>
      )}

      <div style={sidebarStyle}>
        <h2 style={titleStyle}>Admin Panel</h2>

        <nav style={{ flex: 1, overflow: 'auto' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map(item => (
              <li key={item.key}>
                {item.external ? (
                  <a
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle(activeTab === item.key)}
                    onClick={() => {
                      setActiveTab(item.key);
                      if (isMobile) setSidebarOpen(false);
                    }}
                  >
                    <span style={iconStyle}>{item.icon}</span>
                    <span style={textStyle}>{item.label}</span>
                    {item.key === 'orders' && newOrderCount > 0 && (
                      <span style={badgeStyle}>{newOrderCount}</span>
                    )}
                    {item.key === 'messages' && resolvedMessagesUnread > 0 && (
                      <span style={badgeStyle}>{resolvedMessagesUnread}</span>
                    )}
                    {item.key === 'inquiries' && resolvedInquiriesUnread > 0 && (
                      <span style={badgeStyle}>{resolvedInquiriesUnread}</span>
                    )}
                  </a>
                ) : (
                  <Link
                    to={item.path}
                    style={linkStyle(activeTab === item.key)}
                    onClick={() => {
                      setActiveTab(item.key);
                      if (isMobile) setSidebarOpen(false);
                    }}
                  >
                    <span style={iconStyle}>{item.icon}</span>
                    <span style={textStyle}>{item.label}</span>
                    {item.key === 'orders' && newOrderCount > 0 && (
                      <span style={badgeStyle}>{newOrderCount}</span>
                    )}
                    {item.key === 'messages' && resolvedMessagesUnread > 0 && (
                      <span style={badgeStyle}>{resolvedMessagesUnread}</span>
                    )}
                    {item.key === 'inquiries' && resolvedInquiriesUnread > 0 && (
                      <span style={badgeStyle}>{resolvedInquiriesUnread}</span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <button
          style={logoutButtonStyle}
          onClick={handleLogout}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.2)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.1)')}
        >
          <span style={iconStyle}>🚪</span>
          <span style={textStyle}>Logout</span>
        </button>
      </div>
    </>
  );
};

export default AdminSidebar;