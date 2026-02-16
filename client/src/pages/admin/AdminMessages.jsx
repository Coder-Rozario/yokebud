import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminMessages = () => {
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showMessageList, setShowMessageList] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('https://api.yokebud.com/api/messages');
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        setMessages(data);
        
        const unread = data.filter(msg => !msg.is_read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
    
    const interval = setInterval(fetchMessages, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isMobile && selectedMessage) {
      setShowMessageList(false);
    } else {
      setShowMessageList(true);
    }
  }, [isMobile, selectedMessage]);

  const handleSelectMessage = async (message) => {
    if (!message.is_read) {
      try {
        const response = await fetch(`https://api.yokebud.com/api/messages/${message.id}/read`, {
          method: 'PUT',
        });

        if (response.ok) {
          setMessages(prev => prev.map(msg =>
            msg.id === message.id ? { ...msg, is_read: 1 } : msg
          ));
          setUnreadCount(prev => prev - 1);
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
        toast.error('Failed to mark message as read');
      }
    }
    
    setSelectedMessage(message);
    if (isMobile) {
      setShowMessageList(false);
    }
  };

  const handleBackToList = () => {
    setShowMessageList(true);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!replyText.trim() || !selectedMessage) return;

    setIsSendingReply(true);

    try {
      const response = await fetch('https://api.yokebud.com/api/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          email: selectedMessage.email,
          replyText: replyText
        }),
      });

      if (response.ok) {
        toast.success('Reply sent successfully!');
        setReplyText('');
        
        setMessages(prev => prev.map(msg =>
          msg.id === selectedMessage.id ? { ...msg, is_replied: 1 } : msg
        ));
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
        toast.error('Failed to send reply. Please try again.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
    } finally {
      setIsSendingReply(false);
    }
  };

  const filteredMessages = messages.filter(message => 
    message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      overflowX: 'hidden',
      margin: 0,
      padding: 0,
    },
    mainContent: {
      flex: 1,
      marginLeft: isMobile ? 0 : 230,
      padding: isMobile ? '1rem' : '2rem',
      width: isMobile ? '100%' : 'calc(100% - 230px)',
      minWidth: 0,
      background: 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)',
      boxSizing: 'border-box',
      transition: 'margin-left 0.3s ease, padding 0.3s ease',
    },
    header: {
      marginBottom: isMobile ? '1rem' : '2rem',
      width: '100%',
    },
    title: {
      fontSize: isMobile ? '1.5rem' : '1.8rem',
      textAlign: 'center',
      fontWeight: '600',
      background: 'linear-gradient(90deg, #FFA500, #FFD700)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      marginBottom: isMobile ? '2rem' : '3rem',
      color: 'transparent',
      margin: 0,
    },
    searchInput: {
      width: '100%',
      padding: '0.75rem 1rem',
      marginBottom: '1.5rem',
      borderRadius: '8px',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      backgroundColor: 'rgba(30, 30, 30, 0.8)',
      color: '#e0e0e0',
      fontSize: '0.95rem',
      outline: 'none',
      transition: 'all 0.3s ease',
      '&:focus': {
        borderColor: 'rgba(255, 215, 0, 0.7)',
        boxShadow: '0 0 0 2px rgba(255, 215, 0, 0.2)',
      },
    },
    messagesContainer: {
      display: 'flex',
      gap: isMobile ? 0 : '1.5rem',
      width: '100%',
      flexDirection: isMobile ? 'column' : 'row',
      position: 'relative',
       height: isMobile ? '80vh': '70vh',
       margin:'auto',
    },
    messageList: {
      flex: 1,
      background: 'rgba(40, 40, 40, 0.7)',
      borderRadius: isMobile ? '0' : '12px',
      padding: isMobile ? '0.8rem' : '1rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      border: isMobile ? 'none' : '1px solid rgba(255, 215, 0, 0.1)',
      maxHeight: isMobile ? 'none' : '100vh',
      overflowY: 'auto',
      minWidth: isMobile ? '100%' : '300px',
      display: isMobile && !showMessageList ? 'none' : 'block',
      scrollbarWidth: 'thin',
      scrollbarColor: '#FFA500 rgba(40, 40, 40, 0.7)',
    },
    messageDetail: {
      flex: 2,
      background: 'rgba(40, 40, 40, 0.7)',
      borderRadius: isMobile ? '0' : '12px',
      padding: isMobile ? '1rem' : '1.5rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      border: isMobile ? 'none' : '1px solid rgba(255, 215, 0, 0.1)',
      minWidth: isMobile ? '100%' : '400px',
      display: isMobile && showMessageList ? 'none' : 'block',
    },
    messageItem: (read, isSelected) => ({
      padding: isMobile ? '0.8rem' : '1rem',
      marginBottom: '0.5rem',
      borderRadius: '8px',
      background: isSelected 
        ? 'rgba(255, 165, 0, 0.3)' 
        : read 
          ? 'rgba(60, 60, 60, 0.5)' 
          : 'rgba(255, 165, 0, 0.1)',
      border: isSelected 
        ? '1px solid rgba(255, 165, 0, 0.7)' 
        : read 
          ? '1px solid rgba(255, 255, 255, 0.05)' 
          : '1px solid rgba(255, 165, 0, 0.3)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      transform: isSelected ? 'scale(0.98)' : 'scale(1)',
      boxShadow: isSelected ? '0 4px 10px rgba(255, 165, 0, 0.2)' : 'none',
      ':hover': {
        background: isSelected 
          ? 'rgba(255, 165, 0, 0.35)' 
          : read 
            ? 'rgba(80, 80, 80, 0.5)' 
            : 'rgba(255, 165, 0, 0.2)',
      },
    }),
    messageTitle: (read, isSelected) => ({
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '0.5rem',
      fontWeight: isSelected ? '600' : read ? '400' : '600',
      color: isSelected ? '#FFD700' : read ? '#aaa' : '#FFA500',
      fontSize: isMobile ? '0.9rem' : '1rem',
    }),
    messagePreview: (read, isSelected) => ({
      fontSize: isMobile ? '0.8rem' : '0.9rem',
      color: isSelected ? '#ddd' : read ? '#888' : '#ccc',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),
    detailHeader: {
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      paddingBottom: '1rem',
      marginBottom: '1rem',
    },
    detailTitle: {
      fontSize: isMobile ? '1.1rem' : '1.3rem',
      marginBottom: '0.5rem',
      color: '#FFA500',
    },
    detailMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      color: '#aaa',
      fontSize: isMobile ? '0.8rem' : '0.9rem',
      flexWrap: 'wrap',
      gap: '0.5rem',
    },
    detailContent: {
      lineHeight: '1.6',
      marginBottom: '1.5rem',
      whiteSpace: 'pre-wrap',
      fontSize: isMobile ? '0.9rem' : '1rem',
    },
    replyInput: {
      width: '100%',
      padding: isMobile ? '0.6rem' : '0.75rem',
      borderRadius: '6px',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      background: 'rgba(30, 30, 30, 0.8)',
      color: '#e0e0e0',
      fontSize: isMobile ? '0.9rem' : '0.95rem',
      outline: 'none',
      marginBottom: '1rem',
      minHeight: '120px',
      resize: 'vertical',
      transition: 'all 0.3s ease',
      '&:focus': {
        borderColor: 'rgba(255, 215, 0, 0.7)',
        boxShadow: '0 0 0 2px rgba(255, 215, 0, 0.2)',
      },
    },
    replyButton: {
      padding: isMobile ? '0.4rem 1.2rem' : '0.5rem 1.5rem',
      borderRadius: '6px',
      border: 'none',
      background: 'linear-gradient(90deg, #FFA500, #FFD700)',
      color: '#1a1a1a',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: isMobile ? '0.9rem' : '1rem',
      position: 'relative',
      overflow: 'hidden',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(255, 165, 0, 0.3)',
      },
      ':disabled': {
        opacity: 0.7,
        cursor: 'not-allowed',
        transform: 'none',
        boxShadow: 'none',
      },
    },
    loadingSpinner: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '20px',
      height: '20px',
      border: '3px solid rgba(0, 0, 0, 0.1)',
      borderTop: '3px solid #1a1a1a',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: isMobile ? '100%' : '100%',
      color: '#888',
      textAlign: 'center',
      width: '100%',
      fontSize: isMobile ? '0.9rem' : '1rem',
    },
    backButton: {
      display: isMobile ? 'block' : 'none',
      marginBottom: '1rem',
      padding: '0.5rem 1rem',
      background: 'rgba(255, 165, 0, 0.1)',
      border: '1px solid rgba(255, 165, 0, 0.3)',
      color: '#FFA500',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      ':hover': {
        background: 'rgba(255, 165, 0, 0.2)',
      },
    },
    statusBadge: (isRead) => ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '0.7rem',
      fontWeight: '600',
      background: isRead ? 'rgba(0, 200, 0, 0.2)' : 'rgba(255, 165, 0, 0.2)',
      color: isRead ? '#0f0' : '#FFA500',
      marginLeft: '8px',
    }),
    repliedBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '0.7rem',
      fontWeight: '600',
      background: 'rgba(0, 150, 255, 0.2)',
      color: '#09f',
      marginLeft: '8px',
    },
  };

  return (
    <div style={styles.container}>
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobile={isMobile} 
        messagesUnreadCount={unreadCount}
      />

      <main style={styles.mainContent}>
        <header style={styles.header}>
          <motion.h1 
            style={styles.title}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Customer Messages
          </motion.h1>
        </header>

        <input
          type="text"
          placeholder="Search messages..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div style={styles.messagesContainer}>
          {isLoading ? (
            <div style={styles.emptyState}>Loading messages...</div>
          ) : (
            <>
              <div style={styles.messageList}>
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((message) => (
                    <div 
                      key={message.id}
                      style={styles.messageItem(message.is_read, selectedMessage?.id === message.id)}
                      onClick={() => handleSelectMessage(message)}
                    >
                      <div style={styles.messageTitle(message.is_read, selectedMessage?.id === message.id)}>
                        <span>
                          {message.name}
                          <span style={styles.statusBadge(message.is_read)}>
                            {message.is_read ? 'Read' : 'New'}
                          </span>
                          {message.is_replied && (
                            <span style={styles.repliedBadge}>
                              Replied
                            </span>
                          )}
                        </span>
                        <span>{new Date(message.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={styles.messagePreview(message.is_read, selectedMessage?.id === message.id)}>
                        {message.message.length > 50 
                          ? `${message.message.substring(0, 50)}...` 
                          : message.message}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyState}>
                    {searchTerm ? 'No messages match your search' : 'No messages found'}
                  </div>
                )}
              </div>

              {selectedMessage ? (
                <div style={styles.messageDetail}>
                  <button 
                    style={styles.backButton}
                    onClick={handleBackToList}
                  >
                    Back to Messages
                  </button>
                  
                  <div style={styles.detailHeader}>
                    <h3 style={styles.detailTitle}>
                      {selectedMessage.name}
                      <span style={styles.statusBadge(selectedMessage.is_read)}>
                        {selectedMessage.is_read ? 'Read' : 'New'}
                      </span>
                      {selectedMessage.is_replied && (
                        <span style={styles.repliedBadge}>
                          Replied
                        </span>
                      )}
                    </h3>
                    <div style={styles.detailMeta}>
                      <span>{selectedMessage.email}</span>
                      <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={styles.detailContent}>
                    <p><strong>WhatsApp:</strong> {selectedMessage.whatsapp}</p>
                    <p>{selectedMessage.message}</p>
                  </div>
                  
                  <form onSubmit={handleReplySubmit}>
                    <h4 style={{ color: '#FFA500', marginBottom: '1rem', marginTop: '1rem' }}>Reply</h4>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      style={styles.replyInput}
                      placeholder="Type your reply here..."
                      required
                      disabled={isSendingReply}
                    />
                    <motion.button
                      type="submit"
                      style={styles.replyButton}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSendingReply}
                    >
                      {isSendingReply ? (
                        <div style={styles.loadingSpinner} />
                      ) : (
                        'Send Reply'
                      )}
                    </motion.button>
                  </form>
                </div>
              ) : (
                <div style={{ ...styles.messageDetail, ...styles.emptyState }}>
                  <h3 style={{ color: '#aaa', marginBottom: '1rem' }}>Select a message to view</h3>
                  <p>Click on a message from the list to view its details and reply</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <style>
        {`
          @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }

          /* Modern scrollbar styling */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          ::-webkit-scrollbar-track {
            background: rgba(40, 40, 40, 0.5);
            border-radius: 10px;
          }

          ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #FFA500, #FFD700);
            border-radius: 10px;
            border: 1px solid rgba(255, 215, 0, 0.3);
          }

          ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #FFA500, #FF8C00);
          }

          /* Firefox scrollbar */
          * {
            scrollbar-width: thin;
            scrollbar-color: #FFA500 rgba(40, 40, 40, 0.5);
          }
        `}
      </style>
    </div>
  );
};

export default AdminMessages;