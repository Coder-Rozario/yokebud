require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Stripe initialization (requires STRIPE_SECRET_KEY in env)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized.');
  } catch (e) {
    console.warn('Stripe could not be initialized:', e.message || e);
  }
} else {
  console.warn('STRIPE_SECRET_KEY not set; Stripe payments disabled.');
}

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Middleware
app.use(cors({
  origin: [
    'https://www.yokebud.com',
    'https://yokebud.com', 
    'http://localhost:3000',
    'http://localhost:5173',
    'https://yokebud.hostinger.com',
    'https://www.yokebud.hostinger.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin'
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  abortOnLimit: true
}));

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  acquireTimeout: 120000,
  timeout: 120000,
  connectTimeout: 60000,
  reconnect: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Ensure required tables exist
(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        subscription_token VARCHAR(64) NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    connection.release();
    console.log('Subscribers table verified.');
  } catch (e) {
    console.warn('Failed to ensure subscribers table:', e.message || e);
  }
})();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'yokebud@gmail.com',
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: false, // Disable debugging for production
  logger: true, // Log information to the console
  maxConnections: 5, // Limit concurrent connections
  pool: true, // Use pooled connections
  maxMessages: 100, // Limit messages per connection
  from: 'newsletter@yokebud.com' // Set default from address
});

// Constants for size validation
const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const NUMBER_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42', '44'];

// Helper function to validate and combine sizes
const processSizes = (sizes) => {
  const validSizes = Array.isArray(sizes) ? sizes : [];
  return [
    ...validSizes.filter(size => LETTER_SIZES.includes(size)),
    ...validSizes.filter(size => NUMBER_SIZES.includes(size)),
    ...validSizes.filter(size => !LETTER_SIZES.includes(size) && !NUMBER_SIZES.includes(size))
  ];
};

// ==================== JWT TOKEN GENERATION FUNCTION ====================
const generateToken = (userId) => {
  return jwt.sign(
    { userId, type: 'user' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );
};

// Generate unique inquiry ID
const generateInquiryId = (userId, productId) => {
  return `inq_${userId}_${productId}_${Date.now()}`;
};

// Generate inquiry number
const generateInquiryNumber = () => {
  return `INQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

};

// ==================== ENHANCED EMAIL NOTIFICATION SYSTEM ====================

// Email template for notification
const sendNotificationEmail = async (to, subject, message, buttonText, buttonUrl) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e1e1e1; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #FFA500, #FFD700); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Yokebud</h1>
      </div>
      
      <div style="padding: 25px;">
        <h2 style="color: #FFA500; margin-top: 0;">${subject}</h2>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #333; line-height: 1.5;">${message}</p>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${buttonUrl}" style="background: linear-gradient(135deg, #FFA500, #FFD700); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
            ${buttonText}
          </a>
        </div>
        
        <p style="color: #777; font-size: 14px; text-align: center;">
          This is an automated notification. Please do not reply to this email.
        </p>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
        <p>© ${new Date().getFullYear()} Yokebud. All rights reserved.</p>
        <p>Pukinmäenaukio 4, 00720 Helsinki, Finland</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Yokebud <noreply@yokebud.com>',
    to: to,
    subject: subject,
    html: html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Notification email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// ==================== AUTOMATED EMAIL NOTIFICATION SYSTEM ====================

const notificationTimers = new Map();
const customerEmailSent = new Map();

// Check and send admin notifications (15 minutes)
const checkAdminNotifications = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Find inquiries with unread user messages for more than 15 minutes
    const [inquiries] = await connection.query(
      `SELECT ic.*, 
              (SELECT MAX(timestamp) FROM JSON_TABLE(ic.messages, '$[*]' COLUMNS (
                timestamp VARCHAR(50) PATH '$.timestamp',
                sender_type VARCHAR(10) PATH '$.sender_type',
                is_read BOOLEAN PATH '$.is_read'
              )) AS msg WHERE msg.sender_type = 'user' AND msg.is_read = FALSE) as last_unread_user_message
       FROM inquiry_conversations ic
       WHERE ic.admin_unread_count > 0 
       AND ic.last_activity < DATE_SUB(NOW(), INTERVAL 60 MINUTE)`
    );

    for (const inquiry of inquiries) {
      const timerKey = `admin_${inquiry.id}`;
      
      if (!notificationTimers.has(timerKey)) {
        const messages = JSON.parse(inquiry.messages || '[]');
        const lastUnreadUserMessage = messages.filter(m => m.sender_type === 'user' && !m.is_read).pop();
        const lastAdminMessage = messages.filter(m => m.sender_type === 'admin').pop();

        if (!lastUnreadUserMessage) {
          continue;
        }
        if (lastAdminMessage && new Date(lastAdminMessage.timestamp) > new Date(lastUnreadUserMessage.timestamp)) {
          continue;
        }
        console.log(`Sending admin notification for inquiry ${inquiry.id}`);
        
        // Send email to admin
        await sendNotificationEmail(
          'yokebud@gmail.com',
          'Unread Customer Message - Action Required',
          `You have an unread message from ${inquiry.customer_name} regarding "${JSON.parse(inquiry.product_data).product_name}". The customer has been waiting for your response.`,
          'Reply Now',
          `${process.env.ADMIN_URL || 'https://www.yokebud.com/admin/inquiries'}`
        );
        
        // Mark timer to prevent duplicate notifications
        notificationTimers.set(timerKey, setTimeout(() => {
          notificationTimers.delete(timerKey);
        }, 60 * 60 * 1000));
      }
    }
    
    connection.release();
  } catch (error) {
    console.error('Admin notification check error:', error);
  }
};

// Check and send customer notifications (30 minutes)
const checkCustomerNotifications = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Find inquiries with unread admin messages for more than 30 minutes
    const [inquiries] = await connection.query(
      `SELECT ic.*, 
              (SELECT message FROM JSON_TABLE(ic.messages, '$[*]' COLUMNS (
                timestamp VARCHAR(50) PATH '$.timestamp',
                sender_type VARCHAR(10) PATH '$.sender_type',
                is_read BOOLEAN PATH '$.is_read',
                message TEXT PATH '$.message'
              )) AS msg WHERE msg.sender_type = 'admin' AND msg.is_read = FALSE ORDER BY timestamp DESC LIMIT 1) as last_admin_message
       FROM inquiry_conversations ic
       WHERE ic.unread_count > 0 
       AND ic.last_activity < DATE_SUB(NOW(), INTERVAL 60 MINUTE)`
    );

    for (const inquiry of inquiries) {
      const flagKey = inquiry.id;
      
      if (!customerEmailSent.has(flagKey)) {
        console.log(`Sending customer notification for inquiry ${inquiry.id}`);
        
        // Get the last admin message preview
        const messages = JSON.parse(inquiry.messages || '[]');
        const lastAdminMessage = messages
          .filter(msg => msg.sender_type === 'admin' && !msg.is_read)
          .pop();
        
        const messagePreview = lastAdminMessage?.message 
          ? (lastAdminMessage.message.length > 100 
              ? lastAdminMessage.message.substring(0, 100) + '...' 
              : lastAdminMessage.message)
          : 'New reply from our support team';

        // Send email to customer
        await sendNotificationEmail(
          inquiry.customer_email,
          'New Reply from Yokebud Admin',
          `You have a new message from Yokebud Admin regarding your inquiry. Message: "${messagePreview}"`,
          'View Message',
          `${process.env.CLIENT_URL || 'https://www.yokebud.com/messages'}`
        );
        
        // Mark timer to prevent duplicate notifications
        customerEmailSent.set(flagKey, true);
      }
    }
    
    connection.release();
  } catch (error) {
    console.error('Customer notification check error:', error);
  }
};

// Run notification checks every 5 minutes
setInterval(() => {
  checkAdminNotifications();
  checkCustomerNotifications();
}, 5 * 60 * 1000);

// Create PaymentIntent endpoint for Stripe Checkout (simple, server-side)
app.post('/api/create-payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ success: false, message: 'Stripe not configured on server' });
  }

  try {
    const { amount, currency = 'usd' } = req.body;

    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Stripe expects amount in cents
    const amountInCents = Math.round(Number(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      automatic_payment_methods: { enabled: true },
    });

    return res.json({ success: true, clientSecret: paymentIntent.client_secret, id: paymentIntent.id });
  } catch (err) {
    console.error('Error creating payment intent:', err);
  return res.status(500).json({ success: false, message: err.message || 'Stripe error' });
  }
});

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ success: false, message: 'Stripe not configured on server' });
  }
  let connection;
  try {
    const {
      customerInfo,
      items,
      mergedProduct,
      customizationData,
      totals,
      estimatedDelivery,
      productionTime,
      paymentMethod = 'stripe'
    } = req.body;
    if (!customerInfo || (!items && !mergedProduct) || !totals) {
      return res.status(400).json({ success: false, message: 'Missing required order data' });
    }
    connection = await pool.getConnection();
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const normalizedItems = Array.isArray(items) && items.length > 0 ? items : (mergedProduct ? [{
      name: mergedProduct.product_name || mergedProduct.name || 'Item',
      price: mergedProduct.discounted_price || mergedProduct.price || 0,
      quantity: customizationData?.quantity || 1,
      product_photos: mergedProduct.product_photos || []
    }] : []);
    const orderData = {
      order_id: orderId,
      user_id: customerInfo.userId || null,
      customer_info: JSON.stringify(customerInfo),
      items: JSON.stringify(normalizedItems),
      totals: JSON.stringify(totals),
      payment_method: paymentMethod,
      payment_id: null,
      status: 'Pending',
      customization_data: JSON.stringify({
        customizationData: customizationData || {}
      }),
      estimated_delivery: estimatedDelivery,
      production_time: productionTime,
      shipping_address: JSON.stringify({
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        zip: customerInfo.zip,
        country: customerInfo.country
      }),
      billing_address: JSON.stringify({
        name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        email: customerInfo.email,
        phone: customerInfo.phone,
        company: customerInfo.company,
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        zip: customerInfo.zip,
        country: customerInfo.country
      }),
      notes: req.body.customizationNotes || ''
    };
    await connection.query(`INSERT INTO orders SET ?`, [orderData]);
    connection.release();
    const toAbsoluteImageUrl = (u) => {
      try {
        if (!u) return null;
        if (typeof u !== 'string') return null;
        if (u.startsWith('http')) return u;
        const base =
          process.env.SERVER_URL ||
          process.env.CLIENT_URL ||
          'https://api.yokebud.com';
        const slash = u.startsWith('/') ? '' : '/';
        return `${base}${slash}${u}`;
      } catch (_) {
        return null;
      }
    };
    const lineItems = normalizedItems.map((it) => {
      const name = it.name || it.product_name || 'Item';
      const price = Number(it.discounted_price || it.price || 0);
      const qty = Number(it.quantity || 1);
      let image = null;
      if (it.image) {
        image = it.image;
      } else if (it.product_photos) {
        try {
          const photos =
            Array.isArray(it.product_photos)
              ? it.product_photos
              : JSON.parse(it.product_photos || '[]');
          image = Array.isArray(photos) && photos.length > 0 ? photos[0] : null;
        } catch (_) {
          image = null;
        }
      }
      const finalImage = toAbsoluteImageUrl(image);
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name,
            images: finalImage ? [finalImage] : []
          },
          unit_amount: Math.round(price * 100)
        },
        quantity: qty
      };
    });
    const successBase = process.env.CLIENT_URL || 'http://localhost:5173';
    const successUrl = `${successBase}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${successBase}/checkout?canceled=true`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerInfo.email,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { order_id: orderId }
    });
    try {
      const conn2 = await pool.getConnection();
      await conn2.query('UPDATE orders SET payment_id = ?, updated_at = NOW() WHERE order_id = ?', [session.id, orderId]);
      conn2.release();
    } catch (_) {}
    return res.json({ success: true, url: session.url, orderId });
  } catch (err) {
    if (connection) connection.release();
    return res.status(500).json({ success: false, message: err.message || 'Stripe error' });
  }
});

app.get('/api/checkout-session/:id', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ success: false, message: 'Stripe not configured on server' });
  }
  let connection;
  try {
    const sessionId = req.params.id;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === 'paid';
    const orderId = session.metadata && session.metadata.order_id ? session.metadata.order_id : null;
    if (paid && orderId) {
      connection = await pool.getConnection();
      await connection.query('UPDATE orders SET status = ?, payment_method = ?, payment_id = ?, updated_at = NOW() WHERE order_id = ?', ['Paid', 'stripe', session.payment_intent || session.id, orderId]);
      connection.release();
    }
    return res.json({ success: true, paid, orderId, session });
  } catch (err) {
    if (connection) connection.release();
    return res.status(500).json({ success: false, message: err.message || 'Verification error' });
  }
});


// Update admin_unread_count endpoint
app.put('/api/inquiries/:inquiryId/admin-unread', async (req, res) => {
  let connection;
  try {
    const { inquiryId } = req.params;
    const { admin_unread_count } = req.body;
    
    connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE inquiry_conversations SET admin_unread_count = ?, updated_at = NOW() WHERE id = ?',
      [admin_unread_count, inquiryId]
    );
    
    connection.release();
    
    res.json({ 
      success: true, 
      message: 'Admin unread count updated successfully' 
    });
  } catch (error) {
    console.error('Error updating admin unread count:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update admin unread count' 
    });
  }
});


// ==================== ENHANCED MESSAGE HANDLING WITH UNREAD COUNTS ====================

// Enhanced Socket.IO for real-time messaging with unread counts
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle new message with optimized unread counts
  socket.on('send_message', async (data) => {
    try {
      const { inquiryId, message, senderType, files = [], temporaryId } = data;
      
      console.log('Received message via socket:', { inquiryId, message, senderType, temporaryId });

      const connection = await pool.getConnection();
      
      // Get current inquiry
      const [inquiries] = await connection.query(
        'SELECT * FROM inquiry_conversations WHERE id = ?',
        [inquiryId]
      );

      if (inquiries.length === 0) {
        connection.release();
        socket.emit('message_error', { error: 'Inquiry not found', temporaryId });
        return;
      }

      const inquiry = inquiries[0];
      const currentMessages = JSON.parse(inquiry.messages || '[]');
      
      // Create new message
      const newMessage = {
        id: uuidv4(),
        sender_type: senderType,
        message: message,
        files: files,
        timestamp: new Date().toISOString(),
        is_read: false
      };

      // Add to messages array
      currentMessages.push(newMessage);

      // Calculate unread counts based on sender
      let newUnreadCount = inquiry.unread_count || 0;
      let newAdminUnreadCount = inquiry.admin_unread_count || 0;
      let hasNewMessage = inquiry.has_new_message || false;

      if (senderType === 'admin') {
        // Admin sent message - increment user's unread count
        newUnreadCount += 1;
        hasNewMessage = true;
      } else {
        // User sent message - increment admin's unread count
        newAdminUnreadCount += 1;
        hasNewMessage = true;
      }

      console.log(`Unread counts - User: ${newUnreadCount}, Admin: ${newAdminUnreadCount}, Sender: ${senderType}`);

      // Update inquiry in database
      await connection.query(
        `UPDATE inquiry_conversations SET 
          messages = ?, 
          last_activity = NOW(),
          updated_at = NOW(),
          unread_count = ?,
          admin_unread_count = ?,
          has_new_message = ?,
          status = CASE 
            WHEN status = 'new' AND ? = 'admin' THEN 'processing'
            WHEN status = 'new' AND ? = 'user' THEN 'pending'
            ELSE status
          END
         WHERE id = ?`,
        [JSON.stringify(currentMessages), newUnreadCount, newAdminUnreadCount, hasNewMessage, senderType, senderType, inquiryId]
      );

      connection.release();

      // Emit message to all clients in the room
      io.to(inquiryId).emit('new_message', {
        ...newMessage,
        inquiryId: inquiryId,
        temporaryId: temporaryId
      });

      // Send confirmation back to sender
      socket.emit('message_sent', {
        success: true,
        message: newMessage,
        temporaryId: temporaryId
      });
      
      // REAL-TIME NOTIFICATION: Only show toast for relevant users
      if (senderType === 'admin') {
        customerEmailSent.delete(inquiryId);
        // Notify user about new admin message
        io.to(`user_${inquiry.user_id}`).emit('new_admin_message', {
          type: 'new_message',
          inquiryId: inquiryId,
          message: message,
          inquiryNumber: inquiry.inquiry_number,
          productName: JSON.parse(inquiry.product_data).product_name,
          unreadCount: newUnreadCount,
          timestamp: new Date().toISOString()
        });

        // Update navbar notification for user
        io.to(`user_${inquiry.user_id}`).emit('unread_count_update', {
          userId: inquiry.user_id,
          totalUnread: newUnreadCount
        });
      } else {
        // Notify admin about new user message
        io.emit('admin_new_message', {
          type: 'new_user_message',
          inquiryId: inquiryId,
          customerName: inquiry.customer_name,
          productName: JSON.parse(inquiry.product_data).product_name,
          message: message,
          adminUnreadCount: newAdminUnreadCount,
          hasNewMessage: hasNewMessage,
          timestamp: new Date().toISOString()
        });
      }

      console.log('Message saved and broadcasted:', newMessage.id);

    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('message_error', { 
        error: 'Failed to send message', 
        temporaryId: data.temporaryId 
      });
    }
  });

  // Mark messages as read with unread count updates
  socket.on('mark_messages_read', async (data) => {
    try {
      const { inquiryId, userId, userType } = data;
      const connection = await pool.getConnection();

      // Get current inquiry
      const [inquiries] = await connection.query(
        'SELECT * FROM inquiry_conversations WHERE id = ?',
        [inquiryId]
      );

      if (inquiries.length > 0) {
        const inquiry = inquiries[0];
        const currentMessages = JSON.parse(inquiry.messages || '[]');
        
        // Mark messages as read based on user type
        const updatedMessages = currentMessages.map(msg => {
          if (userType === 'user' && msg.sender_type === 'admin') {
            return { ...msg, is_read: true };
          } else if (userType === 'admin' && msg.sender_type === 'user') {
            return { ...msg, is_read: true };
          }
          return msg;
        });

        // Calculate new unread counts
        let newUnreadCount = inquiry.unread_count || 0;
        let newAdminUnreadCount = inquiry.admin_unread_count || 0;
        let hasNewMessage = inquiry.has_new_message;

        if (userType === 'user') {
          // User is reading - reset user's unread count
          newUnreadCount = 0;
        } else if (userType === 'admin') {
          // Admin is reading - reset admin's unread count
          newAdminUnreadCount = 0;
        }

        // Check if there are still any unread messages
        hasNewMessage = newUnreadCount > 0 || newAdminUnreadCount > 0;

        console.log(`Marking messages read - User: ${newUnreadCount}, Admin: ${newAdminUnreadCount}, UserType: ${userType}`);

        // Update in database
        await connection.query(
          'UPDATE inquiry_conversations SET messages = ?, unread_count = ?, admin_unread_count = ?, has_new_message = ?, updated_at = NOW() WHERE id = ?',
          [JSON.stringify(updatedMessages), newUnreadCount, newAdminUnreadCount, hasNewMessage, inquiryId]
        );

        connection.release();

      // Notify all clients in the room
      io.to(inquiryId).emit('messages_read', {
          inquiryId: inquiryId,
          userType: userType,
          newUnreadCount: newUnreadCount,
          newAdminUnreadCount: newAdminUnreadCount,
          hasNewMessage: hasNewMessage
        });

      // Update navbar notifications
      if (userType === 'user' && userId) {
          // Get total unread count for user
          const [userInquiries] = await connection.query(
            'SELECT SUM(unread_count) as total_unread FROM inquiry_conversations WHERE user_id = ?',
            [userId]
          );
          const totalUnread = userInquiries[0].total_unread || 0;

          io.to(`user_${userId}`).emit('unread_count_update', {
            userId: userId,
            totalUnread: totalUnread
          });
        } else if (userType === 'admin') {
          // Get total admin unread count
          const [adminInquiries] = await connection.query(
            'SELECT SUM(admin_unread_count) as total_admin_unread FROM inquiry_conversations'
          );
          const totalAdminUnread = adminInquiries[0].total_admin_unread || 0;

          io.emit('admin_unread_count_update', {
            totalAdminUnread: totalAdminUnread
          });
        }

        if (userType === 'user') {
          customerEmailSent.delete(inquiryId);
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Get unread counts
  socket.on('get_unread_counts', async (data) => {
    try {
      const { userId, userType } = data;
      const connection = await pool.getConnection();

      if (userType === 'user') {
        const [result] = await connection.query(
          'SELECT SUM(unread_count) as total_unread FROM inquiry_conversations WHERE user_id = ?',
          [userId]
        );
        const totalUnread = result[0].total_unread || 0;

        socket.emit('unread_count_update', {
          userId: userId,
          totalUnread: totalUnread
        });
      } else if (userType === 'admin') {
        const [result] = await connection.query(
          'SELECT SUM(admin_unread_count) as total_admin_unread FROM inquiry_conversations'
        );
        const totalAdminUnread = result[0].total_admin_unread || 0;

        socket.emit('admin_unread_count_update', {
          totalAdminUnread: totalAdminUnread
        });
      }

      connection.release();
    } catch (error) {
      console.error('Error getting unread counts:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ==================== ENHANCED API ENDPOINTS ====================

// Mark messages as read with user type support
app.put('/api/inquiries/:inquiryId/messages/read', async (req, res) => {
  let connection;
  try {
    const { inquiryId } = req.params;
    const { userId, userType } = req.body;
    
    connection = await pool.getConnection();

    // Get current inquiry
    const [inquiries] = await connection.query(
      'SELECT * FROM inquiry_conversations WHERE id = ?',
      [inquiryId]
    );

    if (inquiries.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        message: 'Inquiry not found' 
      });
    }

    const inquiry = inquiries[0];
    const currentMessages = JSON.parse(inquiry.messages || '[]');
    
    // Mark messages as read based on user type
    const updatedMessages = currentMessages.map(msg => {
      if (userType === 'user' && msg.sender_type === 'admin') {
        return { ...msg, is_read: true };
      } else if (userType === 'admin' && msg.sender_type === 'user') {
        return { ...msg, is_read: true };
      }
      return msg;
    });

    // Calculate new unread counts
    let newUnreadCount = inquiry.unread_count || 0;
    let newAdminUnreadCount = inquiry.admin_unread_count || 0;
    let hasNewMessage = inquiry.has_new_message;

    if (userType === 'user') {
      newUnreadCount = 0;
    } else if (userType === 'admin') {
      newAdminUnreadCount = 0;
    }

    hasNewMessage = newUnreadCount > 0 || newAdminUnreadCount > 0;

    // Update inquiry in database
    await connection.query(
      'UPDATE inquiry_conversations SET messages = ?, unread_count = ?, admin_unread_count = ?, has_new_message = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(updatedMessages), newUnreadCount, newAdminUnreadCount, hasNewMessage, inquiryId]
    );

    connection.release();

    // Emit real-time update
    io.to(inquiryId).emit('messages_read', {
      inquiryId: inquiryId,
      userType: userType,
      newUnreadCount: newUnreadCount,
      newAdminUnreadCount: newAdminUnreadCount,
      hasNewMessage: hasNewMessage
    });

    res.json({ 
      success: true, 
      message: 'Messages marked as read',
      newUnreadCount: newUnreadCount,
      newAdminUnreadCount: newAdminUnreadCount,
      hasNewMessage: hasNewMessage
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark messages as read: ' + error.message 
    });
  }
});

// Removed duplicate '/api/user/unread-count' (kept a single implementation later)
// Removed unused '/api/admin/unread-count'

// ==================== ENHANCED SOCKET.IO WITH PERSISTENT UNREAD COUNT ====================

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their user ID
  socket.on('user_join', (userId) => {
    connectedUsers.set(socket.id, { userId, type: 'user' });
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  // Admin joins inquiry room
  socket.on('join_inquiry', (inquiryId) => {
    socket.join(inquiryId);
    connectedUsers.set(socket.id, { inquiryId, type: 'admin' });
    console.log(`Admin ${socket.id} joined room: ${inquiryId}`);
  });

  // User joins their personal room for notifications
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined personal notification room`);
  });

  // Handle new message with PERSISTENT UNREAD COUNT
  socket.on('send_message', async (data) => {
    try {
      const { inquiryId, message, senderType, files = [], temporaryId } = data;
      
      console.log('Received message via socket:', { inquiryId, message, senderType, temporaryId });

      const connection = await pool.getConnection();
      
      // Get current inquiry with unread_count
      const [inquiries] = await connection.query(
        'SELECT * FROM inquiry_conversations WHERE id = ?',
        [inquiryId]
      );

      if (inquiries.length === 0) {
        connection.release();
        socket.emit('message_error', { error: 'Inquiry not found', temporaryId });
        return;
      }

      const inquiry = inquiries[0];
      const currentMessages = JSON.parse(inquiry.messages || '[]');
      
      // Create new message
      const newMessage = {
        id: uuidv4(),
        sender_type: senderType,
        message: message,
        files: files,
        timestamp: new Date().toISOString(),
        is_read: senderType === 'admin' // Admin messages are auto-read for admin
      };

      // Add to messages array
      currentMessages.push(newMessage);

      // Calculate new unread count - CRITICAL: Only increment for admin messages
      let newUnreadCount = inquiry.unread_count || 0;
      if (senderType === 'admin') {
        newUnreadCount += 1; // Increment unread count for new admin messages
      }

      console.log(`Unread count update - Before: ${inquiry.unread_count}, After: ${newUnreadCount}, Sender: ${senderType}`);

      // Update inquiry in database with new unread count
      await connection.query(
        `UPDATE inquiry_conversations SET 
          messages = ?, 
          last_activity = NOW(),
          updated_at = NOW(),
          unread_count = ?,
          status = CASE 
            WHEN status = 'new' AND ? = 'admin' THEN 'processing'
            WHEN status = 'new' AND ? = 'user' THEN 'pending'
            ELSE status
          END
         WHERE id = ?`,
        [JSON.stringify(currentMessages), newUnreadCount, senderType, senderType, inquiryId]
      );

      connection.release();

      // Emit message to all clients in the room
      io.to(inquiryId).emit('new_message', {
        ...newMessage,
        inquiryId: inquiryId,
        temporaryId: temporaryId
      });

      // Send confirmation back to sender
      socket.emit('message_sent', {
        success: true,
        message: newMessage,
        temporaryId: temporaryId
      });
      
      // REAL-TIME NOTIFICATION: Notify user about new admin message
      if (senderType === 'admin') {
        customerEmailSent.delete(inquiryId);
        // Emit to user's personal room
        io.to(`user_${inquiry.user_id}`).emit('new_admin_message', {
          type: 'new_message',
          inquiryId: inquiryId,
          message: message,
          inquiryNumber: inquiry.inquiry_number,
          productName: JSON.parse(inquiry.product_data).product_name,
          unreadCount: newUnreadCount,
          timestamp: new Date().toISOString()
        });

        // Also emit global notification for navbar with PERSISTENT count
        io.to(`user_${inquiry.user_id}`).emit('unread_count_update', {
          userId: inquiry.user_id,
          totalUnread: newUnreadCount
        });

        console.log(`Notification sent to user ${inquiry.user_id} for new admin message, unread count: ${newUnreadCount}`);
      }

      console.log('Message saved and broadcasted:', newMessage.id);

    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('message_error', { 
        error: 'Failed to send message', 
        temporaryId: data.temporaryId 
      });
    }
  });

  // Handle message read status with PERSISTENT unread count update
  socket.on('mark_messages_read', async (data) => {
    try {
      const { inquiryId, messageIds, userId } = data;
      const connection = await pool.getConnection();

      // Get current inquiry
      const [inquiries] = await connection.query(
        'SELECT messages, user_id, unread_count FROM inquiry_conversations WHERE id = ?',
        [inquiryId]
      );

      if (inquiries.length > 0) {
        const inquiry = inquiries[0];
        const currentMessages = JSON.parse(inquiry.messages || '[]');
        
        // Mark messages as read
        const updatedMessages = currentMessages.map(msg => {
          if (messageIds.includes(msg.id) || (messageIds.length === 0 && msg.sender_type === 'admin')) {
            return { ...msg, is_read: true };
          }
          return msg;
        });

        // Calculate EXACT unread count - only unread admin messages
        const newUnreadCount = updatedMessages.filter(msg => 
          msg.sender_type === 'admin' && !msg.is_read
        ).length;

        console.log(`Marking messages read - Before: ${inquiry.unread_count}, After: ${newUnreadCount}`);

      // Update in database with exact count
      await connection.query(
        'UPDATE inquiry_conversations SET messages = ?, unread_count = ?, updated_at = NOW() WHERE id = ?',
        [JSON.stringify(updatedMessages), newUnreadCount, inquiryId]
      );

      connection.release();

      if (newUnreadCount === 0) {
        customerEmailSent.delete(inquiryId);
      }

        // Notify all clients in the room
        io.to(inquiryId).emit('messages_read', {
          inquiryId: inquiryId,
          messageIds: messageIds.length === 0 ? 
            currentMessages.filter(msg => msg.sender_type === 'admin').map(msg => msg.id) : 
            messageIds,
          newUnreadCount: newUnreadCount
        });

        // Update navbar notification for user with PERSISTENT count
        if (userId) {
          // Get total unread count for user from database
          const [userInquiries] = await connection.query(
            'SELECT SUM(unread_count) as total_unread FROM inquiry_conversations WHERE user_id = ?',
            [userId]
          );

          const totalUnread = userInquiries[0].total_unread || 0;

          io.to(`user_${userId}`).emit('unread_count_update', {
            userId: userId,
            totalUnread: totalUnread
          });

          console.log(`Total unread count for user ${userId}: ${totalUnread}`);
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Mark all messages as read for a user - PERSISTENT VERSION
  socket.on('mark_all_messages_read', async (data) => {
    try {
      const { userId } = data;
      const connection = await pool.getConnection();

      // Get all user inquiries
      const [inquiries] = await connection.query(
        'SELECT * FROM inquiry_conversations WHERE user_id = ?',
        [userId]
      );

      for (const inquiry of inquiries) {
        const currentMessages = JSON.parse(inquiry.messages || '[]');
        const updatedMessages = currentMessages.map(msg => ({
          ...msg,
          is_read: msg.sender_type === 'admin' ? true : msg.is_read
        }));

        // Set unread_count to 0 for this inquiry
        await connection.query(
          'UPDATE inquiry_conversations SET messages = ?, unread_count = 0, updated_at = NOW() WHERE id = ?',
          [JSON.stringify(updatedMessages), inquiry.id]
        );

        // Emit to inquiry room that messages are read
        io.to(inquiry.id).emit('messages_read', {
          inquiryId: inquiry.id,
          messageIds: currentMessages.filter(msg => msg.sender_type === 'admin').map(msg => msg.id),
          newUnreadCount: 0
        });

        customerEmailSent.delete(inquiry.id);
      }

      // Emit notification update for navbar
      io.to(`user_${userId}`).emit('unread_count_update', {
        userId: userId,
        totalUnread: 0
      });

      connection.release();

      console.log(`All messages marked as read for user ${userId}`);
    } catch (error) {
      console.error('Socket error marking all messages read:', error);
    }
  });

  // Get real-time unread count when user connects - FROM DATABASE
  socket.on('get_unread_count', async (data) => {
    try {
      const { userId } = data;
      const connection = await pool.getConnection();

      const [result] = await connection.query(
        'SELECT SUM(unread_count) as total_unread FROM inquiry_conversations WHERE user_id = ?',
        [userId]
      );

      const totalUnread = result[0].total_unread || 0;

      connection.release();

      // Send current unread count from database to user
      socket.emit('unread_count_update', {
        userId: userId,
        totalUnread: totalUnread
      });

      console.log(`Initial unread count for user ${userId}: ${totalUnread}`);

    } catch (error) {
      console.error('Error getting unread count:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      connectedUsers.delete(socket.id);
    }
  });
});
// ==================== ENHANCED TIME FORMATTING ====================
const formatTimeForDisplay = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  try {
    const now = new Date();
    const time = new Date(timestamp);
    
    // Validate the date
    if (isNaN(time.getTime())) {
      return 'Invalid date';
    }
    
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // For older dates, show actual date and time
    return time.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Time error';
  }
};

// ==================== ENHANCED SOCKET.IO WITH PROPER TIMESTAMPS ====================
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle new message with PROPER TIMESTAMP
  socket.on('send_message', async (data) => {
    try {
      const { inquiryId, message, senderType, files = [], temporaryId } = data;
      
      console.log('Received message via socket:', { inquiryId, message, senderType, temporaryId });

      const connection = await pool.getConnection();
      
      // Get current inquiry
      const [inquiries] = await connection.query(
        'SELECT * FROM inquiry_conversations WHERE id = ?',
        [inquiryId]
      );

      if (inquiries.length === 0) {
        connection.release();
        socket.emit('message_error', { error: 'Inquiry not found', temporaryId });
        return;
      }

      const inquiry = inquiries[0];
      const currentMessages = JSON.parse(inquiry.messages || '[]');
      
      // Create new message with PROPER TIMESTAMP
      const newMessage = {
        id: uuidv4(),
        sender_type: senderType,
        message: message,
        files: files,
        timestamp: new Date().toISOString(), // ACTUAL SERVER TIMESTAMP
        is_read: senderType === 'admin'
      };

      // Add to messages array
      currentMessages.push(newMessage);

      // Calculate new unread count
      let newUnreadCount = inquiry.unread_count || 0;
      if (senderType === 'admin') {
        newUnreadCount += 1;
      }

      console.log(`Unread count update - Before: ${inquiry.unread_count}, After: ${newUnreadCount}, Sender: ${senderType}`);

      // Update inquiry in database
      await connection.query(
        `UPDATE inquiry_conversations SET 
          messages = ?, 
          last_activity = NOW(),
          updated_at = NOW(),
          unread_count = ?,
          status = CASE 
            WHEN status = 'new' AND ? = 'admin' THEN 'processing'
            WHEN status = 'new' AND ? = 'user' THEN 'pending'
            ELSE status
          END
         WHERE id = ?`,
        [JSON.stringify(currentMessages), newUnreadCount, senderType, senderType, inquiryId]
      );

      connection.release();

      // Emit message to all clients in the room WITH PROPER TIMESTAMP
      io.to(inquiryId).emit('new_message', {
        ...newMessage,
        inquiryId: inquiryId,
        temporaryId: temporaryId,
        formattedTime: formatTimeForDisplay(newMessage.timestamp) // ADD FORMATTED TIME
      });

      // Send confirmation back to sender
      socket.emit('message_sent', {
        success: true,
        message: newMessage,
        temporaryId: temporaryId
      });
      
      // REAL-TIME NOTIFICATION: Only show toast for admin messages
      if (senderType === 'admin') {
        customerEmailSent.delete(inquiryId);
        // Emit to user's personal room
        io.to(`user_${inquiry.user_id}`).emit('new_admin_message', {
          type: 'new_message',
          inquiryId: inquiryId,
          message: message,
          inquiryNumber: inquiry.inquiry_number,
          productName: JSON.parse(inquiry.product_data).product_name,
          unreadCount: newUnreadCount,
          timestamp: new Date().toISOString(),
          formattedTime: formatTimeForDisplay(new Date().toISOString())
        });

        // Also emit global notification for navbar
        io.to(`user_${inquiry.user_id}`).emit('unread_count_update', {
          userId: inquiry.user_id,
          totalUnread: newUnreadCount
        });

        console.log(`Notification sent to user ${inquiry.user_id} for new admin message`);
      }

      console.log('Message saved and broadcasted:', newMessage.id);

    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('message_error', { 
        error: 'Failed to send message', 
        temporaryId: data.temporaryId 
      });
    }
  });

  // ... rest of your existing socket code
});

// ==================== MARK ALL MESSAGES READ ENDPOINT - PERSISTENT ====================
app.put('/api/inquiries/mark-all-read', async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    connection = await pool.getConnection();

    // Get all user inquiries
    const [inquiries] = await connection.query(
      'SELECT * FROM inquiry_conversations WHERE user_id = ?',
      [userId]
    );

    // Mark all admin messages as read in each inquiry and set unread_count to 0
    for (const inquiry of inquiries) {
      const currentMessages = JSON.parse(inquiry.messages || '[]');
      const updatedMessages = currentMessages.map(msg => ({
        ...msg,
        is_read: msg.sender_type === 'admin' ? true : msg.is_read
      }));

      await connection.query(
        'UPDATE inquiry_conversations SET messages = ?, unread_count = 0, updated_at = NOW() WHERE id = ?',
        [JSON.stringify(updatedMessages), inquiry.id]
      );
    }

    connection.release();

    // Emit socket event for real-time update
    io.to(`user_${userId}`).emit('unread_count_update', {
      userId: userId,
      totalUnread: 0
    });

    res.json({ 
      success: true, 
      message: 'All messages marked as read' 
    });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark messages as read' 
    });
  }
});

// ==================== GET USER'S UNREAD COUNT ENDPOINT - FROM DATABASE ====================
app.get('/api/user/unread-count', async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    connection = await pool.getConnection();

    const [result] = await connection.query(
      'SELECT SUM(unread_count) as total_unread FROM inquiry_conversations WHERE user_id = ?',
      [userId]
    );

    connection.release();

    const totalUnread = result[0].total_unread || 0;

    res.json({ 
      success: true, 
      totalUnread: totalUnread 
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get unread count' 
    });
  }
});

// ==================== ENHANCED INQUIRY SYSTEM WITH PERSISTENT UNREAD COUNT ====================

// Create or get inquiry - INITIALIZE unread_count to 0
app.post('/api/inquiries', async (req, res) => {
  let connection;
  try {
    const { userId, product, customerInfo } = req.body;
    
    if (!userId || !product || !customerInfo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    const inquiryId = generateInquiryId(userId, product.id);
    const inquiryNumber = generateInquiryNumber();
    
    connection = await pool.getConnection();

    // Check if inquiry already exists for this user-product combination
    const [existingInquiries] = await connection.query(
      'SELECT * FROM inquiry_conversations WHERE user_id = ? AND product_id = ?',
      [userId, product.id]
    );

    let inquiry;
    
    if (existingInquiries.length > 0) {
      // Existing inquiry found - use the existing one
      inquiry = existingInquiries[0];
      
      // Update inquiry timestamp but keep unread_count
      await connection.query(
        'UPDATE inquiry_conversations SET last_activity = NOW(), updated_at = NOW() WHERE id = ?',
        [inquiry.id]
      );

      console.log('Existing inquiry found:', inquiry.id, 'unread_count:', inquiry.unread_count);
    } else {
      // Create new inquiry with unread_count = 0
      await connection.query(
        `INSERT INTO inquiry_conversations (
          id, user_id, product_id, inquiry_number, 
          customer_name, customer_email, customer_phone, customer_company, customer_country,
          product_data, messages, status, created_at, updated_at, last_activity, unread_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW(), ?)`,
        [
          inquiryId,
          userId,
          product.id,
          inquiryNumber,
          customerInfo.name,
          customerInfo.email,
          customerInfo.phone,
          customerInfo.company,
          customerInfo.country,
          JSON.stringify({
            ...product,
            selectedSize: product.selectedSize || 'Customizable',
            quantity: product.quantity || 1
          }),
          JSON.stringify([]), // Empty messages array
          'new',
          0 // Initial unread_count = 0
        ]
      );

      const [newInquiries] = await connection.query(
        'SELECT * FROM inquiry_conversations WHERE id = ?',
        [inquiryId]
      );
      
      inquiry = newInquiries[0];
      console.log('New inquiry created:', inquiryId, 'unread_count: 0');

      // Notify admin about new inquiry via Socket.IO
      io.emit('admin_notification', {
        type: 'new_inquiry',
        inquiryId: inquiryId,
        message: 'New inquiry received',
        customerName: customerInfo.name,
        productName: product.name
      });
    }

    // Parse the messages
    const messages = JSON.parse(inquiry.messages || '[]');

    connection.release();

    res.json({ 
      success: true, 
      inquiry: {
        ...inquiry,
        product_data: JSON.parse(inquiry.product_data),
        messages: messages,
        price_data: inquiry.price_data ? JSON.parse(inquiry.price_data) : null
      },
      isNewInquiry: existingInquiries.length === 0
    });
  } catch (error) {
    console.error('Error managing inquiry:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to manage inquiry: ' + error.message 
    });
  }
});

// Get user's inquiries - RETURN PERSISTENT unread_count
app.get('/api/inquiries/user/:userId', async (req, res) => {
  let connection;
  try {
    const { userId } = req.params;
    
    connection = await pool.getConnection();
    
    const [inquiries] = await connection.query(
      'SELECT * FROM inquiry_conversations WHERE user_id = ? ORDER BY last_activity DESC',
      [userId]
    );

    const parsedInquiries = inquiries.map(inquiry => ({
      ...inquiry,
      product_data: JSON.parse(inquiry.product_data),
      messages: JSON.parse(inquiry.messages || '[]'),
      price_data: inquiry.price_data ? JSON.parse(inquiry.price_data) : null
    }));

    connection.release();

    res.json({ 
      success: true, 
      inquiries: parsedInquiries 
    });
  } catch (error) {
    console.error('Error fetching user inquiries:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user inquiries: ' + error.message 
    });
  }
});

// Get specific inquiry with real-time support
app.get('/api/inquiries/:inquiryId', async (req, res) => {
  let connection;
  try {
    const { inquiryId } = req.params;
    
    connection = await pool.getConnection();
    
    const [inquiries] = await connection.query(
      'SELECT * FROM inquiry_conversations WHERE id = ?',
      [inquiryId]
    );

    if (inquiries.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        message: 'Inquiry not found' 
      });
    }

    const inquiry = inquiries[0];
    const parsedInquiry = {
      ...inquiry,
      product_data: JSON.parse(inquiry.product_data),
      messages: JSON.parse(inquiry.messages || '[]'),
      price_data: inquiry.price_data ? JSON.parse(inquiry.price_data) : null
    };

    connection.release();

    res.json({ 
      success: true, 
      inquiry: parsedInquiry 
    });
  } catch (error) {
    console.error('Error fetching inquiry details:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch inquiry details: ' + error.message 
    });
  }
});

// Get all inquiries for admin - IMPROVED WITH REAL-TIME SUPPORT
app.get('/api/inquiries', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [inquiries] = await connection.query(
      'SELECT * FROM inquiry_conversations ORDER BY last_activity DESC'
    );

    const parsedInquiries = inquiries.map(inquiry => {
      const messages = JSON.parse(inquiry.messages || '[]');
      return {
        ...inquiry,
        product_data: JSON.parse(inquiry.product_data),
        messages: messages,
        price_data: inquiry.price_data ? JSON.parse(inquiry.price_data) : null
      };
    });

    connection.release();

    res.json(parsedInquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch inquiries: ' + error.message 
    });
  }
});

// Send message to inquiry - WITH PERSISTENT UNREAD COUNT
app.post('/api/inquiries/:inquiryId/messages', async (req, res) => {
  let connection;
  try {
    const { inquiryId } = req.params;
    const { message, senderType, files = [] } = req.body;
    
    if ((!message || !message.trim()) && files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message or files are required' 
      });
    }

    connection = await pool.getConnection();

    // Get current inquiry with unread_count
    const [inquiries] = await connection.query(
      'SELECT * FROM inquiry_conversations WHERE id = ?',
      [inquiryId]
    );

    if (inquiries.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        message: 'Inquiry not found' 
      });
    }

    const inquiry = inquiries[0];
    const currentMessages = JSON.parse(inquiry.messages || '[]');
    
    // Create new message
    const newMessage = {
      id: uuidv4(),
      sender_type: senderType,
      message: (message || '').trim(),
      files: files,
      timestamp: new Date().toISOString(),
      is_read: senderType === 'admin'
    };

    // Add to messages array
    currentMessages.push(newMessage);

    // Calculate new unread count - ONLY increment for admin messages
    let newUnreadCount = inquiry.unread_count || 0;
    if (senderType === 'admin') {
      newUnreadCount += 1;
    }

    console.log(`API Message - Before: ${inquiry.unread_count}, After: ${newUnreadCount}, Sender: ${senderType}`);

    // Determine new status
    let newStatus = inquiry.status;
    if (senderType === 'admin' && inquiry.status === 'new') {
      newStatus = 'processing';
    } else if (senderType === 'user' && inquiry.status === 'new') {
      newStatus = 'pending';
    }

    // Update inquiry in database with PERSISTENT unread_count
    await connection.query(
      `UPDATE inquiry_conversations SET 
        messages = ?, 
        status = ?,
        last_activity = NOW(),
        updated_at = NOW(),
        unread_count = ?
       WHERE id = ?`,
      [JSON.stringify(currentMessages), newStatus, newUnreadCount, inquiryId]
    );

    connection.release();

    // Emit real-time message to all connected clients
    io.to(inquiryId).emit('new_message', {
      ...newMessage,
      inquiryId: inquiryId
    });

    // REAL-TIME NOTIFICATION: Notify user about new admin message
    if (senderType === 'admin') {
      customerEmailSent.delete(inquiryId);
      // Emit to user's personal room
      io.to(`user_${inquiry.user_id}`).emit('new_admin_message', {
        type: 'new_message',
        inquiryId: inquiryId,
        message: message,
        inquiryNumber: inquiry.inquiry_number,
        productName: JSON.parse(inquiry.product_data).product_name,
        unreadCount: newUnreadCount,
        timestamp: new Date().toISOString()
      });

      // Also emit global notification for navbar with PERSISTENT count
      io.to(`user_${inquiry.user_id}`).emit('unread_count_update', {
        userId: inquiry.user_id,
        totalUnread: newUnreadCount
      });
    }

    // Notify admin about new user message
    if (senderType === 'user') {
      io.emit('admin_notification', {
        type: 'new_message',
        inquiryId: inquiryId,
        message: 'New message from customer',
        customerName: inquiry.customer_name
      });
    }

    res.json({ 
      success: true, 
      message: 'Message sent successfully',
      messageData: newMessage,
      status: newStatus,
      unreadCount: newUnreadCount
    });
  } catch (error) {
    console.error('Error sending message:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message: ' + error.message 
    });
  }
});

// Mark messages as read - WITH PERSISTENT UNREAD COUNT
app.put('/api/inquiries/:inquiryId/messages/read', async (req, res) => {
  let connection;
  try {
    const { inquiryId } = req.params;
    const { messageIds, userId } = req.body;
    
    connection = await pool.getConnection();

    // Get current inquiry
    const [inquiries] = await connection.query(
      'SELECT * FROM inquiry_conversations WHERE id = ?',
      [inquiryId]
    );

    if (inquiries.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        message: 'Inquiry not found' 
      });
    }

    const inquiry = inquiries[0];
    const currentMessages = JSON.parse(inquiry.messages || '[]');
    
    // Mark messages as read
    const updatedMessages = currentMessages.map(msg => {
      if (messageIds && messageIds.includes(msg.id)) {
        return { ...msg, is_read: true };
      } else if (!messageIds && msg.sender_type === 'admin') {
        return { ...msg, is_read: true };
      }
      return msg;
    });

    // Calculate EXACT new unread count - only unread admin messages
    const newUnreadCount = updatedMessages.filter(msg => 
      msg.sender_type === 'admin' && !msg.is_read
    ).length;

    console.log(`API Mark Read - Before: ${inquiry.unread_count}, After: ${newUnreadCount}`);

    // Update inquiry in database with exact count
    await connection.query(
      'UPDATE inquiry_conversations SET messages = ?, unread_count = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(updatedMessages), newUnreadCount, inquiryId]
    );

    connection.release();

    // Emit real-time update
    io.to(inquiryId).emit('messages_read', {
      inquiryId: inquiryId,
      messageIds: messageIds || currentMessages.filter(msg => msg.sender_type === 'admin').map(msg => msg.id),
      newUnreadCount: newUnreadCount
    });

    // Update navbar notification for user if userId provided
    if (userId) {
      // Get total unread count for user from database
      const [userInquiries] = await connection.query(
        'SELECT SUM(unread_count) as total_unread FROM inquiry_conversations WHERE user_id = ?',
        [userId]
      );

      const totalUnread = userInquiries[0].total_unread || 0;

      io.to(`user_${userId}`).emit('unread_count_update', {
        userId: userId,
        totalUnread: totalUnread
      });
    }

    res.json({ 
      success: true, 
      message: 'Messages marked as read',
      newUnreadCount: newUnreadCount
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark messages as read: ' + error.message 
    });
  }
});

// Update inquiry status
app.put('/api/inquiries/:inquiryId/status', async (req, res) => {
  let connection;
  try {
    const { inquiryId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }

    connection = await pool.getConnection();

    const [result] = await connection.query(
      'UPDATE inquiry_conversations SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, inquiryId]
    );

    // Emit status update via Socket.IO
    io.to(inquiryId).emit('inquiry_status_updated', {
      inquiryId: inquiryId,
      status: status,
      updated_at: new Date().toISOString()
    });

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inquiry not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Status updated successfully' 
    });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update status: ' + error.message 
    });
  }
});

// Activate checkout for inquiry
app.put('/api/inquiries/:inquiryId/activate-checkout', async (req, res) => {
  let connection;
  try {
    const { inquiryId } = req.params;
    const { prices, status = 'completed' } = req.body;
    
    if (!prices || Object.keys(prices).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Price data is required' 
      });
    }

    connection = await pool.getConnection();

    const [result] = await connection.query(
      'UPDATE inquiry_conversations SET price_data = ?, status = ?, is_checkout_active = TRUE, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(prices), status, inquiryId]
    );

    // Emit checkout activation via Socket.IO
    io.to(inquiryId).emit('checkout_activated', {
      inquiryId: inquiryId,
      prices: prices,
      status: status
    });

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inquiry not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Checkout activated successfully',
      status: status
    });
  } catch (error) {
    console.error('Error activating checkout:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to activate checkout: ' + error.message 
    });
  }
});

// File upload for inquiry attachments
app.post('/api/inquiries/:inquiryId/upload', async (req, res) => {
  let connection;
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files were uploaded.' 
      });
    }

    const { inquiryId } = req.params;
    const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
    const uploadResults = [];

    // Validate inquiry exists
    connection = await pool.getConnection();
    const [inquiries] = await connection.query(
      'SELECT id FROM inquiry_conversations WHERE id = ?',
      [inquiryId]
    );

    if (inquiries.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        message: 'Inquiry not found' 
      });
    }

    // Upload each file to Cloudinary
    for (const file of files) {
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
      
      if (!allowedTypes.includes(file.mimetype)) {
        connection.release();
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid file type. Only images, PDF, documents, and archives are allowed.' 
        });
      }

      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `yokebud/inquiries/${inquiryId}`,
              public_id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              resource_type: 'auto'
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          uploadStream.end(file.data);
        });

        uploadResults.push({
          url: result.secure_url,
          public_id: result.public_id,
          name: file.name,
          type: file.mimetype,
          size: file.size
        });
      } catch (uploadError) {
        console.error('File upload failed:', uploadError);
        continue;
      }
    }

    connection.release();

    res.json({ 
      success: true, 
      message: `${uploadResults.length} file(s) uploaded successfully`,
      files: uploadResults 
    });
  } catch (error) {
    console.error('Upload endpoint error:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload files',
      error: error.message 
    });
  }
});

// ==================== HEALTH CHECK ENDPOINT ====================
app.get('/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// ==================== ENHANCED USER AUTHENTICATION & PROFILE ====================

// Generate OTP with 1 minute expiry
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email for enhanced authentication
const sendEnhancedOTPEmail = async (email, otp, type = 'registration') => {
  const subject = type === 'registration' 
    ? 'Verify Your Email - Yokebud' 
    : 'Login OTP - Yokebud';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e1e1e1; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #FFA500, #FFD700); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Yokebud</h1>
      </div>
      
      <div style="padding: 25px;">
        <h2 style="color: #FFA500; margin-top: 0;">
          ${type === 'registration' ? 'Verify Your Email Address' : 'Login Verification'}
        </h2>
        
        <p>
          ${type === 'registration' ? 'Thank you for signing up with Yokebud!' : 'Use this OTP to login to your Yokebud account.'}
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: linear-gradient(135deg, #FFA500, #FFD700); color: white; padding: 15px 30px; border-radius: 8px; display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${otp}
          </div>
        </div>
        
        <p style="color: #ff4444; font-weight: bold;">This OTP will expire in 1 minute. Please do not share this code with anyone.</p>
        
        <p>If you didn't request this code, please ignore this email.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1;">
          <p style="margin-bottom: 5px;"><strong>Best Regards,</strong></p>
          <p style="margin-top: 0; color: #FFA500;">The Yokebud Team</p>
        </div>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
        <p>© ${new Date().getFullYear()} Yokebud. All rights reserved.</p>
        <p>Pukinmäenaukio 4, 00720 Helsinki, Finland</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Yokebud <yokebud@gmail.com>',
    to: email,
    subject: subject,
    html: html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send OTP email');
  }
};

// User Registration - Send OTP
app.post('/api/user/register/send-otp', async (req, res) => {
  let connection;
  try {
    const { email } = req.body;
    
    console.log('Registration OTP request for email:', email);
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    connection = await pool.getConnection();

    // Check if email already exists
    const [existingUsers] = await connection.query(
      'SELECT user_id FROM user_credentials WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Generate and save OTP with 1 minute expiry
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute

    console.log('Generated registration OTP:', otp, 'Expires at:', expiresAt);

    // Delete any existing OTPs for this email
    await connection.query(
      'DELETE FROM user_otps WHERE email = ? AND otp_type = ?',
      [email, 'registration']
    );

    // Insert new OTP
    await connection.query(
      'INSERT INTO user_otps (email, otp_code, otp_type, expires_at, attempt_count) VALUES (?, ?, ?, ?, ?)',
      [email, otp, 'registration', expiresAt, 0]
    );

    connection.release();

    // Send OTP email
    await sendEnhancedOTPEmail(email, otp, 'registration');

    console.log('Registration OTP sent successfully to:', email);
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully' 
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP: ' + error.message 
    });
  }
});

// Verify OTP for Registration and create user
app.post('/api/user/register/verify-otp', async (req, res) => {
  let connection;
  try {
    const { email, otp, userData } = req.body;
    
    console.log('Registration OTP verification request:', { email, otp, userData });
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    connection = await pool.getConnection();

    // Verify OTP with attempt count check
    const [otps] = await connection.query(
      `SELECT * FROM user_otps 
       WHERE email = ? 
       AND otp_code = ? 
       AND otp_type = ? 
       AND is_used = 0 
       AND expires_at > NOW()
       AND attempt_count < 5`,
      [email, otp, 'registration']
    );

    console.log('Found registration OTPs:', otps);

    if (otps.length === 0) {
      // Check why OTP is invalid
      const [expiredOtps] = await connection.query(
        `SELECT * FROM user_otps 
         WHERE email = ? AND otp_code = ? AND otp_type = ?`,
        [email, otp, 'registration']
      );
      
      if (expiredOtps.length > 0) {
        if (expiredOtps[0].is_used) {
          console.log('Registration OTP already used');
          connection.release();
          return res.status(400).json({ 
            success: false, 
            message: 'OTP has already been used' 
          });
        } else if (expiredOtps[0].attempt_count >= 5) {
          console.log('Registration OTP exceeded max attempts');
          connection.release();
          return res.status(400).json({ 
            success: false, 
            message: 'OTP has been blocked due to too many failed attempts. Please request a new OTP.' 
          });
        } else {
          console.log('Registration OTP expired at:', expiredOtps[0].expires_at);
          connection.release();
          return res.status(400).json({ 
            success: false, 
            message: 'OTP has expired' 
          });
        }
      } else {
        // Increment attempt count for invalid OTP
        const [invalidOtps] = await connection.query(
          `SELECT * FROM user_otps 
           WHERE email = ? 
           AND otp_type = ? 
           AND is_used = 0 
           AND expires_at > NOW()`,
          [email, 'registration']
        );

        if (invalidOtps.length > 0) {
          await connection.query(
            'UPDATE user_otps SET attempt_count = attempt_count + 1 WHERE id = ?',
            [invalidOtps[0].id]
          );
        }

        console.log('No valid registration OTP found for this email and code');
        connection.release();
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid OTP code' 
        });
      }
    }

    const otpData = otps[0];

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Start transaction
    await connection.beginTransaction();

    try {
      // Check if user already exists (double check)
      const [existingUsers] = await connection.query(
        'SELECT user_id FROM user_credentials WHERE email = ? AND is_active = TRUE',
        [email]
      );

      if (existingUsers.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ 
          success: false, 
          message: 'Email already registered' 
        });
      }

      // Create user credentials without password
      await connection.query(
        'INSERT INTO user_credentials (user_id, email, is_verified, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [userId, email, true]
      );

      // Create user profile with provided data
      await connection.query(
        `INSERT INTO user_profiles (
          user_id, first_name, last_name, phone, company, 
          address, city, state, zip_code, country, date_of_birth, gender,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          userData?.firstName || userData?.first_name || '',
          userData?.lastName || userData?.last_name || '',
          userData?.phone || '',
          userData?.company || '',
          userData?.address || '',
          userData?.city || '',
          userData?.state || '',
          userData?.zipCode || userData?.zip_code || '',
          userData?.country || '',
          userData?.dateOfBirth || userData?.date_of_birth || null,
          userData?.gender || ''
        ]
      );

      // Mark OTP as used
      await connection.query(
        'UPDATE user_otps SET is_used = 1 WHERE id = ?',
        [otpData.id]
      );

      await connection.commit();

      // Get complete user data
      const [userDataResult] = await connection.query(
        `SELECT uc.user_id, uc.email, uc.firebase_uid, 
                up.first_name, up.last_name, up.phone, up.company, 
                up.address, up.city, up.state, up.zip_code, up.country,
                up.date_of_birth, up.gender
         FROM user_credentials uc
         LEFT JOIN user_profiles up ON uc.user_id = up.user_id
         WHERE uc.user_id = ? AND uc.is_active = TRUE`,
        [userId]
      );

      connection.release();

      if (userDataResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found after creation'
        });
      }

      const user = userDataResult[0];
      
      // Check if profile needs completion
      const needsProfileCompletion = !user.first_name || !user.last_name || !user.phone;

      console.log('New user profile completion status:', {
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        needsCompletion: needsProfileCompletion
      });

      // Generate JWT token using the function
      const token = generateToken(userId);

      console.log('Registration completed successfully for user:', email, 'User ID:', userId);
      
      res.json({ 
        success: true, 
        message: 'Registration successful',
        token,
        user: user,
        isNewUser: true,
        needsProfileCompletion
      });

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('Registration OTP verification error:', error);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed: ' + error.message 
    });
  }
});

// Send Login OTP
app.post('/api/user/login/send-otp', async (req, res) => {
  let connection;
  try {
    const { email } = req.body;
    
    console.log('Login OTP request for email:', email);
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    connection = await pool.getConnection();

    // Check if user exists
    const [users] = await connection.query(
      'SELECT user_id FROM user_credentials WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        message: 'Email not registered' 
      });
    }

    // Generate and save OTP with 1 minute expiry
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute

    console.log('Generated login OTP:', otp, 'Expires at:', expiresAt);

    // Delete any existing OTPs for this email
    await connection.query(
      'DELETE FROM user_otps WHERE email = ? AND otp_type = ?',
      [email, 'email_verification']
    );

    // Insert new OTP
    await connection.query(
      'INSERT INTO user_otps (email, otp_code, otp_type, expires_at, attempt_count) VALUES (?, ?, ?, ?, ?)',
      [email, otp, 'email_verification', expiresAt, 0]
    );

    connection.release();

    // Send OTP email
    await sendEnhancedOTPEmail(email, otp, 'email_verification');

    console.log('Login OTP sent successfully to:', email);
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Login OTP error:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP: ' + error.message 
    });
  }
});

// Verify Login OTP
app.post('/api/user/login/verify-otp', async (req, res) => {
  let connection;
  try {
    const { email, otp } = req.body;
    
    console.log('Login OTP verification request:', { email, otp });
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    connection = await pool.getConnection();

    // Verify OTP with attempt count check
    const [otps] = await connection.query(
      `SELECT * FROM user_otps 
       WHERE email = ? 
       AND otp_code = ? 
       AND otp_type = ? 
       AND is_used = 0 
       AND expires_at > NOW()
       AND attempt_count < 5`,
      [email, otp, 'email_verification']
    );

    console.log('Found login OTPs:', otps);

    if (otps.length === 0) {
      // Check why OTP is invalid
      const [expiredOtps] = await connection.query(
        `SELECT * FROM user_otps 
         WHERE email = ? AND otp_code = ? AND otp_type = ?`,
        [email, otp, 'email_verification']
      );
      
      if (expiredOtps.length > 0) {
        if (expiredOtps[0].is_used) {
          console.log('Login OTP already used');
          connection.release();
          return res.status(400).json({ 
            success: false, 
            message: 'OTP has already been used' 
          });
        } else if (expiredOtps[0].attempt_count >= 5) {
          console.log('Login OTP exceeded max attempts');
          connection.release();
          return res.status(400).json({ 
            success: false, 
            message: 'OTP has been blocked due to too many failed attempts. Please request a new OTP.' 
          });
        } else {
          console.log('Login OTP expired at:', expiredOtps[0].expires_at);
          connection.release();
          return res.status(400).json({ 
            success: false, 
            message: 'OTP has expired' 
          });
        }
      } else {
        // Increment attempt count for invalid OTP
        const [invalidOtps] = await connection.query(
          `SELECT * FROM user_otps 
           WHERE email = ? 
           AND otp_type = ? 
           AND is_used = 0 
           AND expires_at > NOW()`,
          [email, 'email_verification']
        );

        if (invalidOtps.length > 0) {
          await connection.query(
            'UPDATE user_otps SET attempt_count = attempt_count + 1 WHERE id = ?',
            [invalidOtps[0].id]
          );
        }

        console.log('No valid login OTP found for this email and code');
        connection.release();
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid OTP code' 
        });
      }
    }

    // Get user data
    const [users] = await connection.query(
      `SELECT uc.user_id, uc.email, uc.firebase_uid, 
              up.first_name, up.last_name, up.phone, up.company, 
              up.address, up.city, up.state, up.zip_code, up.country,
              up.date_of_birth, up.gender
       FROM user_credentials uc
       LEFT JOIN user_profiles up ON uc.user_id = up.user_id
       WHERE uc.email = ? AND uc.is_active = TRUE`,
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = users[0];
    
    // Check if profile needs completion
    const needsProfileCompletion = !user.first_name || !user.last_name || !user.phone;

    console.log('Login user profile completion status:', {
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      needsCompletion: needsProfileCompletion
    });

    // Mark OTP as used
    await connection.query(
      'UPDATE user_otps SET is_used = 1 WHERE id = ?',
      [otps[0].id]
    );

    connection.release();

    // Generate JWT token using the function
    const token = generateToken(user.user_id);

    console.log('Login OTP verification successful for user:', user.email);
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      token,
      user: user,
      isNewUser: false,
      needsProfileCompletion
    });
  } catch (error) {
    console.error('Login verify error:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Login failed: ' + error.message 
    });
  }
});

// ==================== FIREBASE GOOGLE AUTHENTICATION ====================

app.post('/api/user/auth/firebase-google', async (req, res) => {
  let connection;
  try {
    const { user: firebaseUser } = req.body;
    
    console.log('Firebase Google auth request:', { email: firebaseUser?.email });
    
    if (!firebaseUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Firebase user data is required' 
      });
    }

    const { uid: firebaseUid, email, displayName, photoURL, emailVerified } = firebaseUser;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required from Firebase'
      });
    }

    // Extract first and last name from displayName
    let firstName = '';
    let lastName = '';
    if (displayName) {
      const nameParts = displayName.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    connection = await pool.getConnection();

    // Check if user exists with this Firebase UID or email
    const [users] = await connection.query(
      `SELECT uc.user_id, uc.email, uc.firebase_uid, 
              up.first_name, up.last_name, up.phone, up.company, 
              up.address, up.city, up.state, up.zip_code, up.country,
              up.date_of_birth, up.gender
       FROM user_credentials uc 
       LEFT JOIN user_profiles up ON uc.user_id = up.user_id 
       WHERE uc.firebase_uid = ? OR uc.email = ?`,
      [firebaseUid, email]
    );

    let userId;
    let isNewUser = false;
    let needsProfileCompletion = false;

    if (users.length > 0) {
      // User exists
      const existingUser = users[0];
      userId = existingUser.user_id;
      
      // Check if profile needs completion
      needsProfileCompletion = !existingUser.first_name || !existingUser.last_name || !existingUser.phone;
      
      console.log('Existing user profile completion status:', {
        first_name: existingUser.first_name,
        last_name: existingUser.last_name,
        phone: existingUser.phone,
        needsCompletion: needsProfileCompletion
      });
      
      // Update Firebase UID if not set or different
      if (!existingUser.firebase_uid || existingUser.firebase_uid !== firebaseUid) {
        await connection.query(
          'UPDATE user_credentials SET firebase_uid = ?, is_verified = TRUE WHERE user_id = ?',
          [firebaseUid, userId]
        );
      }

      // Update names if they are empty but available from Firebase
      if ((!existingUser.first_name || !existingUser.last_name) && displayName) {
        await connection.query(
          'UPDATE user_profiles SET first_name = ?, last_name = ? WHERE user_id = ?',
          [firstName, lastName, userId]
        );
        // Update the needsProfileCompletion after potential update
        needsProfileCompletion = !firstName || !lastName || !existingUser.phone;
      }
    } else {
      // Create new user
      isNewUser = true;
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      needsProfileCompletion = true; // New users always need profile completion

      // Start transaction
      await connection.beginTransaction();

      try {
        // Create credentials
        await connection.query(
          'INSERT INTO user_credentials (user_id, email, firebase_uid, is_verified, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [userId, email, firebaseUid, emailVerified || true]
        );

        // Create profile with Firebase data
        await connection.query(
          `INSERT INTO user_profiles (
            user_id, first_name, last_name, created_at, updated_at
          ) VALUES (?, ?, ?, NOW(), NOW())`,
          [userId, firstName, lastName]
        );

        await connection.commit();
      } catch (transactionError) {
        await connection.rollback();
        throw transactionError;
      }
    }

    // Get complete user data
    const [userData] = await connection.query(
      `SELECT uc.user_id, uc.email, uc.firebase_uid, 
              up.first_name, up.last_name, up.phone, up.company, 
              up.address, up.city, up.state, up.zip_code, up.country,
              up.date_of_birth, up.gender
       FROM user_credentials uc
       LEFT JOIN user_profiles up ON uc.user_id = up.user_id
       WHERE uc.user_id = ? AND uc.is_active = TRUE`,
      [userId]
    );

    connection.release();

    if (userData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userData[0];
    
    // Double check needsProfileCompletion status
    const finalNeedsProfileCompletion = !user.first_name || !user.last_name || !user.phone;

    // Generate JWT token using the function
    const token = generateToken(userId);

    console.log('Firebase Google auth successful for user:', email, 'isNewUser:', isNewUser, 'needsProfileCompletion:', finalNeedsProfileCompletion);
    
    res.json({ 
      success: true, 
      message: isNewUser ? 'Registration successful' : 'Login successful',
      token,
      user: user,
      isNewUser,
      needsProfileCompletion: finalNeedsProfileCompletion
    });
  } catch (error) {
    console.error('Firebase Google auth error:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Firebase authentication failed: ' + error.message 
    });
  }
});

// Get User Profile
app.get('/api/user/profile', async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    connection = await pool.getConnection();
    const [users] = await connection.query(
      `SELECT uc.user_id, uc.email, uc.firebase_uid, 
              up.first_name, up.last_name, up.phone, up.company, 
              up.address, up.city, up.state, up.zip_code, up.country,
              up.date_of_birth, up.gender
       FROM user_credentials uc
       LEFT JOIN user_profiles up ON uc.user_id = up.user_id
       WHERE uc.user_id = ? AND uc.is_active = TRUE`,
      [userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    connection.release();

    res.json({ 
      success: true, 
      user: users[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get profile: ' + error.message 
    });
  }
});

// Update User Profile
app.put('/api/user/profile', async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const userData = req.body;

    console.log('Profile update request for user:', userId, 'data:', userData);

    connection = await pool.getConnection();

    // Upsert user profile (insert if not exists, update if exists)
    // Assumes user_profiles.user_id is PRIMARY KEY or UNIQUE
    await connection.query(
      `INSERT INTO user_profiles (
          user_id, first_name, last_name, phone, company,
          address, city, state, zip_code, country, date_of_birth, gender, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
          first_name = VALUES(first_name),
          last_name = VALUES(last_name),
          phone = VALUES(phone),
          company = VALUES(company),
          address = VALUES(address),
          city = VALUES(city),
          state = VALUES(state),
          zip_code = VALUES(zip_code),
          country = VALUES(country),
          date_of_birth = VALUES(date_of_birth),
          gender = VALUES(gender),
          updated_at = NOW()`,
      [
        userId,
        userData.first_name || '',
        userData.last_name || '',
        userData.phone || '',
        userData.company || '',
        userData.address || '',
        userData.city || '',
        userData.state || '',
        userData.zip_code || '',
        userData.country || '',
        userData.date_of_birth || null,
        userData.gender || ''
      ]
    );

    // Get updated profile
    const [users] = await connection.query(
      `SELECT uc.user_id, uc.email, uc.firebase_uid, 
              up.first_name, up.last_name, up.phone, up.company, 
              up.address, up.city, up.state, up.zip_code, up.country,
              up.date_of_birth, up.gender
       FROM user_credentials uc
       LEFT JOIN user_profiles up ON uc.user_id = up.user_id
       WHERE uc.user_id = ? AND uc.is_active = TRUE`,
      [userId]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('Profile updated successfully for user:', userId);
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile: ' + error.message 
    });
  }
});

    // Get countries list (try DB, fallback to static list)
    app.get('/api/countries', async (req, res) => {
      let connection;
      try {
        connection = await pool.getConnection();

        // Try to query a countries table if it exists
        try {
          const [rows] = await connection.query('SELECT code, name FROM countries ORDER BY name');
          connection.release();
          if (rows && rows.length > 0) {
            return res.json({ success: true, countries: rows });
          }
        } catch (dbErr) {
          // If table doesn't exist or query fails, fall back to static list
          connection.release();
        }

        // Fallback static list (code, name)
        const staticCountries = [
          { code: 'AF', name: 'Afghanistan' },{ code: 'AL', name: 'Albania' },{ code: 'DZ', name: 'Algeria' },{ code: 'AD', name: 'Andorra' },{ code: 'AO', name: 'Angola' },{ code: 'AR', name: 'Argentina' },{ code: 'AM', name: 'Armenia' },{ code: 'AU', name: 'Australia' },{ code: 'AT', name: 'Austria' },{ code: 'AZ', name: 'Azerbaijan' },{ code: 'BD', name: 'Bangladesh' },{ code: 'BB', name: 'Barbados' },{ code: 'BY', name: 'Belarus' },{ code: 'BE', name: 'Belgium' },{ code: 'BJ', name: 'Benin' },{ code: 'BT', name: 'Bhutan' },{ code: 'BO', name: 'Bolivia' },{ code: 'BA', name: 'Bosnia and Herzegovina' },{ code: 'BW', name: 'Botswana' },{ code: 'BR', name: 'Brazil' },{ code: 'BN', name: 'Brunei' },{ code: 'BG', name: 'Bulgaria' },{ code: 'BF', name: 'Burkina Faso' },{ code: 'BI', name: 'Burundi' },{ code: 'KH', name: 'Cambodia' },{ code: 'CM', name: 'Cameroon' },{ code: 'CA', name: 'Canada' },{ code: 'CV', name: 'Cabo Verde' },{ code: 'CL', name: 'Chile' },{ code: 'CN', name: 'China' },{ code: 'CO', name: 'Colombia' },{ code: 'CR', name: 'Costa Rica' },{ code: 'HR', name: 'Croatia' },{ code: 'CU', name: 'Cuba' },{ code: 'CY', name: 'Cyprus' },{ code: 'CZ', name: 'Czech Republic' },{ code: 'DK', name: 'Denmark' },{ code: 'DO', name: 'Dominican Republic' },{ code: 'EC', name: 'Ecuador' },{ code: 'EG', name: 'Egypt' },{ code: 'SV', name: 'El Salvador' },{ code: 'EE', name: 'Estonia' },{ code: 'ET', name: 'Ethiopia' },{ code: 'FI', name: 'Finland' },{ code: 'FR', name: 'France' },{ code: 'DE', name: 'Germany' },{ code: 'GH', name: 'Ghana' },{ code: 'GR', name: 'Greece' },{ code: 'GT', name: 'Guatemala' },{ code: 'GN', name: 'Guinea' },{ code: 'GY', name: 'Guyana' },{ code: 'HT', name: 'Haiti' },{ code: 'HN', name: 'Honduras' },{ code: 'HU', name: 'Hungary' },{ code: 'IS', name: 'Iceland' },{ code: 'IN', name: 'India' },{ code: 'ID', name: 'Indonesia' },{ code: 'IR', name: 'Iran' },{ code: 'IQ', name: 'Iraq' },{ code: 'IE', name: 'Ireland' },{ code: 'IL', name: 'Israel' },{ code: 'IT', name: 'Italy' },{ code: 'JP', name: 'Japan' },{ code: 'JO', name: 'Jordan' },{ code: 'KZ', name: 'Kazakhstan' },{ code: 'KE', name: 'Kenya' },{ code: 'KR', name: 'South Korea' },{ code: 'KW', name: 'Kuwait' },{ code: 'KG', name: 'Kyrgyzstan' },{ code: 'LV', name: 'Latvia' },{ code: 'LB', name: 'Lebanon' },{ code: 'LT', name: 'Lithuania' },{ code: 'LU', name: 'Luxembourg' },{ code: 'MK', name: 'North Macedonia' },{ code: 'MG', name: 'Madagascar' },{ code: 'MW', name: 'Malawi' },{ code: 'MY', name: 'Malaysia' },{ code: 'MV', name: 'Maldives' },{ code: 'ML', name: 'Mali' },{ code: 'MT', name: 'Malta' },{ code: 'MH', name: 'Marshall Islands' },{ code: 'MR', name: 'Mauritania' },{ code: 'MU', name: 'Mauritius' },{ code: 'MX', name: 'Mexico' },{ code: 'MD', name: 'Moldova' },{ code: 'MC', name: 'Monaco' },{ code: 'MN', name: 'Mongolia' },{ code: 'ME', name: 'Montenegro' },{ code: 'MA', name: 'Morocco' },{ code: 'MZ', name: 'Mozambique' },{ code: 'MM', name: 'Myanmar' },{ code: 'NA', name: 'Namibia' },{ code: 'NP', name: 'Nepal' },{ code: 'NL', name: 'Netherlands' },{ code: 'NZ', name: 'New Zealand' },{ code: 'NI', name: 'Nicaragua' },{ code: 'NG', name: 'Nigeria' },{ code: 'NO', name: 'Norway' },{ code: 'OM', name: 'Oman' },{ code: 'PK', name: 'Pakistan' },{ code: 'PW', name: 'Palau' },{ code: 'PA', name: 'Panama' },{ code: 'PG', name: 'Papua New Guinea' },{ code: 'PY', name: 'Paraguay' },{ code: 'PE', name: 'Peru' },{ code: 'PH', name: 'Philippines' },{ code: 'PL', name: 'Poland' },{ code: 'PT', name: 'Portugal' },{ code: 'QA', name: 'Qatar' },{ code: 'RO', name: 'Romania' },{ code: 'RU', name: 'Russia' },{ code: 'SA', name: 'Saudi Arabia' },{ code: 'SN', name: 'Senegal' },{ code: 'RS', name: 'Serbia' },{ code: 'SC', name: 'Seychelles' },{ code: 'SL', name: 'Sierra Leone' },{ code: 'SG', name: 'Singapore' },{ code: 'SK', name: 'Slovakia' },{ code: 'SI', name: 'Slovenia' },{ code: 'SB', name: 'Solomon Islands' },{ code: 'SO', name: 'Somalia' },{ code: 'ZA', name: 'South Africa' },{ code: 'ES', name: 'Spain' },{ code: 'LK', name: 'Sri Lanka' },{ code: 'SD', name: 'Sudan' },{ code: 'SR', name: 'Suriname' },{ code: 'SE', name: 'Sweden' },{ code: 'CH', name: 'Switzerland' },{ code: 'SY', name: 'Syria' },{ code: 'TW', name: 'Taiwan' },{ code: 'TJ', name: 'Tajikistan' },{ code: 'TZ', name: 'Tanzania' },{ code: 'TH', name: 'Thailand' },{ code: 'TL', name: 'Timor-Leste' },{ code: 'TG', name: 'Togo' },{ code: 'TO', name: 'Tonga' },{ code: 'TT', name: 'Trinidad and Tobago' },{ code: 'TN', name: 'Tunisia' },{ code: 'TR', name: 'Turkey' },{ code: 'TM', name: 'Turkmenistan' },{ code: 'TV', name: 'Tuvalu' },{ code: 'UG', name: 'Uganda' },{ code: 'UA', name: 'Ukraine' },{ code: 'AE', name: 'United Arab Emirates' },{ code: 'GB', name: 'United Kingdom' },{ code: 'US', name: 'United States' },{ code: 'UY', name: 'Uruguay' },{ code: 'UZ', name: 'Uzbekistan' },{ code: 'VU', name: 'Vanuatu' },{ code: 'VA', name: 'Vatican City' },{ code: 'VE', name: 'Venezuela' },{ code: 'VN', name: 'Vietnam' },{ code: 'YE', name: 'Yemen' },{ code: 'ZM', name: 'Zambia' },{ code: 'ZW', name: 'Zimbabwe' }
        ];

        return res.json({ success: true, countries: staticCountries });
      } catch (error) {
        console.error('Countries endpoint error:', error);
        if (connection) connection.release();
        res.status(500).json({ success: false, message: 'Failed to get countries' });
      }
    });

// Get User Orders
app.get('/api/user/orders', async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    connection = await pool.getConnection();
    const [orders] = await connection.query(
      `SELECT order_id, product_details, order_date, status, 
              total_amount, shipping_address, payment_method, 
              tracking_number, notes
       FROM user_orders 
       WHERE user_id = ? 
       ORDER BY order_date DESC`,
      [userId]
    );

    connection.release();

    // Parse JSON fields safely
    const parsedOrders = orders.map(order => {
      try {
        return {
          ...order,
          product_details: typeof order.product_details === 'string' 
            ? JSON.parse(order.product_details) 
            : order.product_details,
          shipping_address: typeof order.shipping_address === 'string'
            ? JSON.parse(order.shipping_address)
            : order.shipping_address
        };
      } catch (parseError) {
        console.error('Error parsing order data:', parseError);
        return order;
      }
    });

    console.log('Retrieved', parsedOrders.length, 'orders for user:', userId);
    
    res.json({ 
      success: true, 
      orders: parsedOrders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get orders: ' + error.message 
    });
  }
});

// Delete User Account
app.delete('/api/user/account', async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    console.log('Account deletion request for user:', userId);

    connection = await pool.getConnection();

    // Soft delete user (set is_active to false)
    await connection.query(
      'UPDATE user_credentials SET is_active = FALSE, updated_at = NOW() WHERE user_id = ?',
      [userId]
    );

    connection.release();

    console.log('Account deleted successfully for user:', userId);
    
    res.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });
  } catch (error) {
    console.error('Delete account error:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete account: ' + error.message 
    });
  }
});

// Logout
app.post('/api/user/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // In a real app, you might want to blacklist the token
      // For now, we'll just return success
      console.log('User logout with token');
    }

    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed: ' + error.message 
    });
  }
});


// ==================== ORDER MANAGEMENT API ====================

// Save order from checkout
app.post('/api/checkout', async (req, res) => {
  let connection;
  try {
    const {
      customerInfo,
      paymentMethod,
      paymentId,
      items,
      customizationNotes,
      customizationFile,
      totals,
      estimatedDelivery,
      productionTime
    } = req.body;

    console.log('Received order data:', {
      customerInfo,
      paymentMethod,
      itemsCount: items?.length,
      totals
    });

    // Validate required fields
    if (!customerInfo || !items || !totals) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order data'
      });
    }

    connection = await pool.getConnection();

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Prepare order data for database
    const orderData = {
      order_id: orderId,
      user_id: customerInfo.userId || null,
      customer_info: JSON.stringify(customerInfo),
      items: JSON.stringify(items),
      totals: JSON.stringify(totals),
      payment_method: paymentMethod,
      payment_id: paymentId || null,
      status: 'Pending',
      customization_data: JSON.stringify({
        notes: customizationNotes,
        file: customizationFile,
        customizationData: req.body.customizationData || {}
      }),
      estimated_delivery: estimatedDelivery,
      production_time: productionTime,
      shipping_address: JSON.stringify({
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        zip: customerInfo.zip,
        country: customerInfo.country
      }),
      billing_address: JSON.stringify({
        name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        email: customerInfo.email,
        phone: customerInfo.phone,
        company: customerInfo.company,
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        zip: customerInfo.zip,
        country: customerInfo.country
      }),
      notes: customizationNotes
    };

    // Insert order into database
    const [result] = await connection.query(
      `INSERT INTO orders SET ?`,
      [orderData]
    );

    connection.release();

    console.log('Order saved successfully:', orderId);

    res.json({
      success: true,
      message: 'Order placed successfully',
      orderId: orderId
    });

  } catch (error) {
    console.error('Order save error:', error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: 'Failed to save order: ' + error.message
    });
  }
});

// Upload design files during checkout (no inquiry/order id required)
// Returns Cloudinary URLs so admin can preview and download later
app.post('/api/checkout/upload-files', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded.'
      });
    }

    const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
    const uploadResults = [];

    for (const file of files) {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/vnd.rar'
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only images, PDF, documents, and archives are allowed.'
        });
      }

      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'yokebud/checkout-attachments',
              public_id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              resource_type: 'auto'
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          uploadStream.end(file.data);
        });

        uploadResults.push({
          url: result.secure_url,
          public_id: result.public_id,
          name: file.name,
          type: file.mimetype,
          size: file.size
        });
      } catch (uploadError) {
        console.error('File upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload files',
          error: uploadError.message
        });
      }
    }

    res.json({
      success: true,
      message: `${uploadResults.length} file(s) uploaded successfully`,
      files: uploadResults
    });
  } catch (error) {
    console.error('Checkout upload endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error.message
    });
  }
});

// Get all orders for admin
app.get('/api/orders', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [orders] = await connection.query(`
      SELECT 
        o.*,
        up.first_name,
        up.last_name,
        up.phone,
        p.product_name,
        p.product_photos,
        p.sku
      FROM orders o
      LEFT JOIN user_profiles up ON o.user_id = up.user_id
      LEFT JOIN products p ON JSON_EXTRACT(o.items, '$[0].id') = p.id
      ORDER BY o.created_at DESC
    `);

    // Parse JSON fields
    const parsedOrders = orders.map(order => {
      try {
        return {
          ...order,
          customer_info: typeof order.customer_info === 'string' ? 
            JSON.parse(order.customer_info) : order.customer_info,
          items: typeof order.items === 'string' ? 
            JSON.parse(order.items) : order.items,
          totals: typeof order.totals === 'string' ? 
            JSON.parse(order.totals) : order.totals,
          customization_data: typeof order.customization_data === 'string' ? 
            JSON.parse(order.customization_data) : order.customization_data,
          shipping_address: typeof order.shipping_address === 'string' ? 
            JSON.parse(order.shipping_address) : order.shipping_address,
          billing_address: typeof order.billing_address === 'string' ? 
            JSON.parse(order.billing_address) : order.billing_address,
          customer_name: order.first_name && order.last_name ? 
            `${order.first_name} ${order.last_name}` : 
            (order.customer_info?.firstName && order.customer_info?.lastName ?
              `${order.customer_info.firstName} ${order.customer_info.lastName}` : 'N/A'),
          customer_email: order.email || order.customer_info?.email || 'N/A',
          customer_phone: order.phone || order.customer_info?.phone || 'N/A',
          product_name: order.product_name || 
            (order.items && order.items[0]?.product_name) || 'N/A',
          product_photos: order.product_photos ? 
            (typeof order.product_photos === 'string' ? 
              JSON.parse(order.product_photos) : order.product_photos) : []
        };
      } catch (parseError) {
        console.error('Error parsing order data:', parseError);
        return order;
      }
    });

    connection.release();

    res.json({
      success: true,
      orders: parsedOrders
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders: ' + error.message
    });
  }
});

// Get single order details
app.get('/api/orders/:orderId', async (req, res) => {
  let connection;
  try {
    const { orderId } = req.params;
    
    connection = await pool.getConnection();

    const [orders] = await connection.query(`
      SELECT 
        o.*,
        up.first_name,
        up.last_name,
        up.phone,
        up.company,
        up.address as profile_address,
        up.city as profile_city,
        up.state as profile_state,
        up.zip_code as profile_zip,
        up.country as profile_country
      FROM orders o
      LEFT JOIN user_profiles up ON o.user_id = up.user_id
      WHERE o.order_id = ?
    `, [orderId]);

    if (orders.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];
    
    // Parse all JSON fields
    const parsedOrder = {
      ...order,
      customer_info: typeof order.customer_info === 'string' ? 
        JSON.parse(order.customer_info) : order.customer_info,
      items: typeof order.items === 'string' ? 
        JSON.parse(order.items) : order.items,
      totals: typeof order.totals === 'string' ? 
        JSON.parse(order.totals) : order.totals,
      customization_data: typeof order.customization_data === 'string' ? 
        JSON.parse(order.customization_data) : order.customization_data,
      shipping_address: typeof order.shipping_address === 'string' ? 
        JSON.parse(order.shipping_address) : order.shipping_address,
      billing_address: typeof order.billing_address === 'string' ? 
        JSON.parse(order.billing_address) : order.billing_address
    };

    connection.release();

    res.json({
      success: true,
      order: parsedOrder
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order: ' + error.message
    });
  }
});

// Update order status
app.put('/api/orders/:orderId/status', async (req, res) => {
  let connection;
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    connection = await pool.getConnection();

    const [result] = await connection.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
      [status, orderId]
    );

    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get updated order
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE order_id = ?',
      [orderId]
    );

    const order = orders[0];
    
    // Parse JSON fields
    const parsedOrder = {
      ...order,
      customer_info: typeof order.customer_info === 'string' ? 
        JSON.parse(order.customer_info) : order.customer_info,
      items: typeof order.items === 'string' ? 
        JSON.parse(order.items) : order.items,
      totals: typeof order.totals === 'string' ? 
        JSON.parse(order.totals) : order.totals
    };

    connection.release();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: parsedOrder
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: 'Failed to update order status: ' + error.message
    });
  }
});



// ==================== SUBCATEGORIES API ENDPOINTS ====================

// Get all subcategories organized by main categories
app.get('/api/subcategories', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get all products with their categories and subcategories
    const [products] = await connection.query(
      'SELECT category, subcategory FROM products WHERE subcategory IS NOT NULL AND subcategory != ""'
    );

    connection.release();

    // Organize subcategories by main categories
    const subcategories = {
      'Men': [],
      'Women': [], 
      'Kids': [],
      'Accessories': []
    };

    products.forEach(product => {
      try {
        // Parse category if it's JSON string
        let categories = [];
        if (typeof product.category === 'string') {
          try {
            categories = JSON.parse(product.category);
          } catch (e) {
            categories = [product.category];
          }
        } else if (Array.isArray(product.category)) {
          categories = product.category;
        } else {
          categories = [product.category];
        }

        // Add subcategory to each main category it belongs to
        categories.forEach(cat => {
          if (subcategories[cat] && 
              product.subcategory && 
              !subcategories[cat].includes(product.subcategory)) {
            subcategories[cat].push(product.subcategory);
          }
        });

        // Also handle Accessories specifically
        if (product.category === 'Accessories' && 
            product.subcategory && 
            !subcategories['Accessories'].includes(product.subcategory)) {
          subcategories['Accessories'].push(product.subcategory);
        }

      } catch (error) {
        console.error('Error processing product categories:', error);
      }
    });

    // Remove duplicates and sort
    Object.keys(subcategories).forEach(category => {
      subcategories[category] = [...new Set(subcategories[category])].sort();
    });

    res.json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subcategories: ' + error.message 
    });
  }
});

// Removed unused '/api/subcategories/:category' endpoint

// ==================== PRODUCT MANAGEMENT ====================

// Create product endpoint
app.post('/api/products', async (req, res) => {
  try {
    const {
      name,
      description,
      price, // This will be max_price
      min_price, // This can be discounted_price or custom min price
      discounted_price, // For backward compatibility
      categories,
      subcategory,
      stock,
      moq,
      material,
      care,
      sku,
      shipping,
      warranty,
      bulk_discount,
      sizes,
      colors,
      tags,
      features,
      imageUrls
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !categories || categories.length === 0 || !subcategory || 
        !stock || !material || !care || !sku || !imageUrls || imageUrls.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields'
      });
    }

    // Process prices according to your requirements
    // max_price = price column value
    // min_price = discounted_price if available, otherwise price
    const finalMaxPrice = parseFloat(price);
    const finalMinPrice = discounted_price ? parseFloat(discounted_price) : finalMaxPrice;

    // Process sizes
    const processedSizes = processSizes(sizes);
    
    const connection = await pool.getConnection();
    
    // Check for duplicate SKU
    const [existingProducts] = await connection.query(
      'SELECT id FROM products WHERE sku = ?',
      [sku]
    );
    
    if (existingProducts.length > 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'SKU already exists' });
    }

    // Insert product into database
    const [result] = await connection.query(
      `INSERT INTO products (
        product_name, 
        product_details, 
        price, 
        min_price,
        max_price,
        discounted_price, 
        category,
        subcategory, 
        stock, 
        moq, 
        material, 
        care_instructions, 
        sku, 
        shipping_info, 
        warranty, 
        bulk_discount, 
        sizes, 
        colors, 
        product_photos, 
        tags, 
        features
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        finalMaxPrice, // price column = max_price
        finalMinPrice, // min_price = discounted_price or max_price
        finalMaxPrice, // max_price = price
        discounted_price ? parseFloat(discounted_price) : null, // Keep for backward compatibility
        JSON.stringify(categories),
        subcategory,
        parseInt(stock),
        parseInt(moq),
        material,
        care,
        sku,
        shipping,
        warranty,
        bulk_discount,
        JSON.stringify(processedSizes),
        JSON.stringify(colors),
        JSON.stringify(imageUrls),
        JSON.stringify(tags),
        JSON.stringify(features)
      ]
    );
    
    connection.release();

    res.json({ 
      success: true, 
      message: 'Product created successfully',
      productId: result.insertId 
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create product',
      error: error.message 
    });
  }
});

// Update product endpoint
app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      name,
      description,
      price, // This will be max_price
      min_price, // This can be custom min price
      discounted_price, // For setting min_price
      categories,
      subcategory,
      stock,
      moq,
      material,
      care,
      sku,
      shipping,
      warranty,
      bulk_discount,
      sizes,
      colors,
      tags,
      features,
      imageUrls,
      imagesToDelete = []
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !categories || categories.length === 0 || !subcategory || 
        !stock || !material || !care || !sku || !imageUrls || imageUrls.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields'
      });
    }

    // Process prices according to your requirements
    const finalMaxPrice = parseFloat(price);
    // Use custom min_price if provided, otherwise use discounted_price, otherwise use max_price
    const finalMinPrice = min_price ? parseFloat(min_price) : 
                         (discounted_price ? parseFloat(discounted_price) : finalMaxPrice);

    // Process sizes
    const processedSizes = processSizes(sizes);

    const connection = await pool.getConnection();
    
    // Get current product data
    const [products] = await connection.query(
      'SELECT sku, product_photos FROM products WHERE id = ?',
      [productId]
    );
    
    if (products.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const currentSku = products[0].sku;
    
    // Check if SKU is being changed to one that already exists
    if (sku !== currentSku) {
      const [skuCheck] = await connection.query(
        'SELECT id FROM products WHERE sku = ? AND id != ?',
        [sku, productId]
      );
      
      if (skuCheck.length > 0) {
        connection.release();
        return res.status(400).json({ success: false, message: 'SKU already exists' });
      }
    }

    // Delete images from Cloudinary
    if (imagesToDelete.length > 0) {
      try {
        const deletePromises = imagesToDelete.map(publicId => {
          return cloudinary.uploader.destroy(publicId);
        });
        await Promise.all(deletePromises);
      } catch (err) {
        console.error('Error deleting images from Cloudinary:', err);
      }
    }

    // Update product in database
    const [result] = await connection.query(
      `UPDATE products SET 
        product_name = ?, 
        product_details = ?, 
        price = ?, 
        min_price = ?,
        max_price = ?,
        discounted_price = ?, 
        category = ?, 
        subcategory = ?, 
        stock = ?, 
        moq = ?, 
        material = ?, 
        care_instructions = ?, 
        sku = ?, 
        shipping_info = ?, 
        warranty = ?, 
        bulk_discount = ?, 
        sizes = ?, 
        colors = ?, 
        product_photos = ?, 
        tags = ?, 
        features = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        name,
        description,
        finalMaxPrice, // price column = max_price
        finalMinPrice, // min_price
        finalMaxPrice, // max_price = price
        discounted_price ? parseFloat(discounted_price) : null, // Keep for backward compatibility
        JSON.stringify(categories),
        subcategory,
        parseInt(stock),
        parseInt(moq),
        material,
        care,
        sku,
        shipping,
        warranty,
        bulk_discount,
        JSON.stringify(processedSizes),
        JSON.stringify(colors),
        JSON.stringify(imageUrls),
        JSON.stringify(tags),
        JSON.stringify(features),
        productId
      ]
    );
    
    connection.release();

    res.json({ 
      success: true, 
      message: 'Product updated successfully',
      productId: productId
    });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update product',
      error: error.message 
    });
  }
});

// Get single product endpoint
app.get('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    const connection = await pool.getConnection();
    const [products] = await connection.query(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );
    connection.release();

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    
    // Parse categories
    let categories;
    try {
      categories = JSON.parse(product.category);
      if (!Array.isArray(categories)) {
        categories = [product.category];
      }
    } catch (e) {
      categories = [product.category];
    }

    // Format response with price range
    const parsedProduct = {
      id: product.id,
      product_name: product.product_name,
      product_details: product.product_details,
      price: product.price, // Backward compatibility (this is max_price)
      min_price: product.min_price || product.discounted_price || product.price,
      max_price: product.max_price || product.price,
      discounted_price: product.discounted_price, // Keep for backward compatibility
      categories: categories,
      category: categories[0],
      subcategory: product.subcategory,
      stock: product.stock,
      moq: product.moq,
      material: product.material,
      care_instructions: product.care_instructions,
      sku: product.sku,
      shipping_info: product.shipping_info,
      warranty: product.warranty,
      bulk_discount: product.bulk_discount,
      sizes: JSON.parse(product.sizes || '[]'),
      colors: JSON.parse(product.colors || '[]'),
      product_photos: JSON.parse(product.product_photos || '[]'),
      tags: JSON.parse(product.tags || '[]'),
      features: JSON.parse(product.features || '[]'),
      created_at: product.created_at,
      updated_at: product.updated_at
    };

    res.json(parsedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get all products endpoint
app.get('/api/products', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [products] = await connection.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    connection.release();

    const parsedProducts = products.map(product => {
      // Parse categories
      let categories;
      try {
        categories = JSON.parse(product.category);
        if (!Array.isArray(categories)) {
          categories = [product.category];
        }
      } catch (e) {
        categories = [product.category];
      }
      
      return {
        ...product,
        categories,
        category: categories[0],
        colors: JSON.parse(product.colors || '[]'),
        sizes: JSON.parse(product.sizes || '[]'),
        product_photos: JSON.parse(product.product_photos || '[]'),
        tags: JSON.parse(product.tags || '[]'),
        features: JSON.parse(product.features || '[]'),
        // Price range fields
        min_price: product.min_price || product.discounted_price || product.price,
        max_price: product.max_price || product.price
      };
    });

    res.json(parsedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    const connection = await pool.getConnection();
    
    // Get product details for image cleanup
    const [products] = await connection.query(
      'SELECT product_photos FROM products WHERE id = ?',
      [productId]
    );
    
    if (products.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Product not found' });
    }

    const { product_photos } = products[0];
    const photos = JSON.parse(product_photos || '[]');
    
    // Delete the product from database
    await connection.query(
      'DELETE FROM products WHERE id = ?',
      [productId]
    );
    
    connection.release();

    // Delete product images from Cloudinary
    try {
      const deletePromises = photos.map(imageUrl => {
        const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
        return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises);
    } catch (err) {
      console.error('Error deleting product images from Cloudinary:', err);
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get related products
app.get('/api/products/:id/related', async (req, res) => {
  try {
    const productId = req.params.id;
    const limit = parseInt(req.query.limit) || 4;
    
    const connection = await pool.getConnection();
    
    // First get the product's categories
    const [products] = await connection.query(
      'SELECT category FROM products WHERE id = ?',
      [productId]
    );
    
    if (products.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Product not found' });
    }

    // Parse categories (could be JSON array or single string)
    let categories;
    try {
      categories = JSON.parse(products[0].category);
      if (!Array.isArray(categories)) {
        categories = [products[0].category];
      }
    } catch (e) {
      categories = [products[0].category];
    }

    // Get related products that share any of the categories
    const [relatedProducts] = await connection.query(
      `SELECT id, product_name, price, min_price, max_price, discounted_price, product_photos 
       FROM products 
       WHERE id != ? 
       AND JSON_OVERLAPS(category, ?)
       LIMIT ?`,
      [productId, JSON.stringify(categories), limit]
    );
    
    connection.release();

    const parsedProducts = relatedProducts.map(product => ({
      id: product.id,
      product_name: product.product_name,
      price: product.price, // Backward compatibility
      min_price: product.min_price || product.discounted_price || product.price,
      max_price: product.max_price || product.price,
      discounted_price: product.discounted_price,
      // Parse only the first image for listings
      firstImage: product.product_photos ? 
        (JSON.parse(product.product_photos) || [])[0] : null
    }));

    res.json(parsedProducts);
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ error: 'Failed to fetch related products' });
  }
});

// ==================== IMAGE UPLOAD HANDLING WITH CLOUDINARY ====================
app.post('/api/upload/:productId?', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files were uploaded.' 
      });
    }

    const files = Array.isArray(req.files.images) 
      ? req.files.images 
      : [req.files.images];
    
    const uploadResults = [];
    const productId = req.params.productId;

    for (const file of files) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
        });
      }

      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'yokebud/products',
              public_id: uuidv4(),
              resource_type: 'auto'
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          uploadStream.end(file.data);
        });

        uploadResults.push({
          url: result.secure_url,
          public_id: result.public_id
        });
      } catch (uploadError) {
        console.error('File upload failed:', uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }
    }

    // Update product if productId provided
    if (productId) {
      const connection = await pool.getConnection();
      try {
        const [products] = await connection.query(
          'SELECT product_photos FROM products WHERE id = ?',
          [productId]
        );
        
        if (products.length > 0) {
          const currentPhotos = JSON.parse(products[0].product_photos || '[]');
          const updatedPhotos = [...uploadResults.map(r => r.url), ...currentPhotos];
          
          await connection.query(
            'UPDATE products SET product_photos = ? WHERE id = ?',
            [JSON.stringify(updatedPhotos), productId]
          );
        }
      } finally {
        connection.release();
      }
    }

    res.json({ 
      success: true, 
      message: 'Files uploaded successfully',
      images: uploadResults 
    });
  } catch (error) {
    console.error('Upload endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload files',
      error: error.message 
    });
  }
});

// ==================== ADMIN AUTHENTICATION ====================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT id, username, password_hash FROM admin_login WHERE username = ?',
      [username]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = rows[0];
    
    // In production, use bcrypt.compare() with hashed passwords
    if (password !== admin.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set authentication cookie
    res.cookie('adminAuth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Send OTP to fixed admin email for elevated login after failures
app.post('/api/admin/send-otp', async (req, res) => {
  let connection;
  try {
    const adminEmail = 'yokebud@gmail.com';

    connection = await pool.getConnection();

    // Generate OTP with 1 minute expiry
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute

    // Remove any existing admin_login OTPs
    await connection.query(
      'DELETE FROM user_otps WHERE email = ? AND otp_type = ?',
      [adminEmail, 'admin_login']
    );

    // Insert new OTP
    await connection.query(
      'INSERT INTO user_otps (email, otp_code, otp_type, expires_at, attempt_count, is_used) VALUES (?, ?, ?, ?, ?, ?)',
      [adminEmail, otp, 'admin_login', expiresAt, 0, 0]
    );

    // Send OTP email
    await sendEnhancedOTPEmail(adminEmail, otp, 'email_verification');

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Admin send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  } finally {
    if (connection) connection.release();
  }
});

// Admin: Verify OTP for elevated login
app.post('/api/admin/verify-otp', async (req, res) => {
  let connection;
  try {
    const { email, otp } = req.body;
    const adminEmail = 'yokebud@gmail.com';
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }
    if (email && email !== adminEmail) {
      return res.status(401).json({ success: false, message: 'Unauthorized email' });
    }

    connection = await pool.getConnection();

    // First, try to find a matching code (not used yet)
    const [matchRows] = await connection.query(
      `SELECT * FROM user_otps
       WHERE email = ? AND otp_type = ? AND otp_code = ? AND is_used = 0
       ORDER BY id DESC LIMIT 1`,
      [adminEmail, 'admin_login', String(otp).trim()]
    );

    let otpRow = matchRows[0];
    if (!otpRow) {
      // Fall back to the latest OTP (helps diagnose mismatches)
      const [latestRows] = await connection.query(
        `SELECT * FROM user_otps
         WHERE email = ? AND otp_type = ? AND is_used = 0
         ORDER BY id DESC LIMIT 1`,
        [adminEmail, 'admin_login']
      );
      if (latestRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }
      otpRow = latestRows[0];
    }
    const nowMs = Date.now();
    const expiresMs = new Date(otpRow.expires_at).getTime();
    const notExpired = nowMs < expiresMs;
    const codeMatches = String(otpRow.otp_code).trim() === String(otp).trim();

    if (!notExpired || !codeMatches) {
      // Increment attempt count when wrong/expired
      await connection.query('UPDATE user_otps SET attempt_count = attempt_count + 1 WHERE id = ?', [otpRow.id]);
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Mark OTP as used on success
    await connection.query('UPDATE user_otps SET is_used = 1 WHERE id = ?', [otpRow.id]);

    // Set cookies for authenticated admin session
    res.cookie('adminAuth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Additionally mark OTP verification for short window if needed
    res.cookie('adminOtp', 'verified', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10 * 60 * 1000 // 10 minutes window
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Admin verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  } finally {
    if (connection) connection.release();
  }
});

// Admin dashboard
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    if (!req.cookies.adminAuth || req.cookies.adminAuth !== 'authenticated') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const connection = await pool.getConnection();
    
    const [unreadCount] = await connection.query(
      'SELECT COUNT(*) as count FROM messages WHERE is_read = 0'
    );
    
    const [totalCount] = await connection.query(
      'SELECT COUNT(*) as count FROM messages'
    );
    
    const [productCount] = await connection.query(
      'SELECT COUNT(*) as count FROM products'
    );
    
    const [orderCount] = await connection.query(
      'SELECT COUNT(*) as count FROM checkout_data WHERE status IN ("Pending", "Processing")'
    );
    
    connection.release();

    res.json({ 
      success: true, 
      stats: {
        unreadMessages: unreadCount[0].count,
        totalMessages: totalCount[0].count,
        totalProducts: productCount[0].count,
        pendingOrders: orderCount[0].count
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: users summary (total users and recent activity)
app.get('/api/admin/users/summary', async (req, res) => {
  try {
    if (!req.cookies.adminAuth || req.cookies.adminAuth !== 'authenticated') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const connection = await pool.getConnection();

    const [totalRows] = await connection.query(
      'SELECT COUNT(*) as count FROM user_profiles'
    );

    // Return last 60 days of signup timestamps for frontend growth/activity
    const [recentRows] = await connection.query(
      `SELECT created_at FROM user_profiles 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
       ORDER BY created_at DESC`
    );

    // Aggregate last 30 days by date for quick activity charting
    const [activityRows] = await connection.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM user_profiles
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at)`
    );

    connection.release();

    res.json({
      success: true,
      totalUsers: totalRows[0].count,
      recentSignups: recentRows.map(r => r.created_at),
      activity: activityRows
    });
  } catch (error) {
    console.error('Users summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('adminAuth');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Public: total users count from user_profiles
app.get('/api/user-profiles/count', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM user_profiles'
    );
    connection.release();

    res.json({ success: true, totalUsers: rows[0]?.count || 0 });
  } catch (error) {
    console.error('User profiles count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== MESSAGE HANDLING ====================

// Contact form submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, whatsapp, message } = req.body;
    
    if (!name || !email || !whatsapp || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO messages (name, email, whatsapp, message, is_read, is_replied) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, whatsapp, message, 0, 0]
    );
    connection.release();

    // Send emails (admin and customer)
    const adminMailOptions = {
      from: email,
      to: 'yokebud@gmail.com',
      subject: `New Contact Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #FFA500;">New Contact Message Received</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #FFA500; margin: 15px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>WhatsApp:</strong> ${whatsapp}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          <p>This message was received via the Yokebud contact form.</p>
        </div>
      `
    };

    const customerMailOptions = {
      from: 'yokebud@gmail.com',
      to: email,
      subject: 'Thank you for contacting Yokebud',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #FFA500;">Thank you for contacting Yokebud!</h2>
          <p>We have received your message and will get back to you shortly.</p>
          <div style="background-color: #f9f9f5; padding: 20px; border-left: 4px solid #FFA500; margin: 15px 0;">
            <p><strong>Your Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          <p>Best regards,<br>The Yokebud Team</p>
        </div>
      `
    };

    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(customerMailOptions);

    res.status(200).json({ success: true, message: 'Message saved successfully' });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ success: false, message: 'Failed to save message' });
  }
});

// Get all messages
app.get('/api/messages', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT id, name, email, whatsapp, message, created_at, is_read, is_replied FROM messages ORDER by created_at DESC'
    );
    connection.release();

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark message as read
app.put('/api/messages/:id/read', async (req, res) => {
  try {
    const messageId = req.params.id;
    
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE messages SET is_read = 1 WHERE id = ?',
      [messageId]
    );
    connection.release();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// ==================== NEWSLETTER SUBSCRIPTION SYSTEM ====================

// Generate unique subscription token
const generateSubscriptionToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

// Email template for subscription confirmation (User)
const sendSubscriptionConfirmationEmail = async (email, token) => {
const unsubscribeLink = `${process.env.CLIENT_URL || 'https://yokebud.com'}/UnsubscribePage?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Yokebud Newsletter</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8f9fa;
            }
            
            .container {
                max-width: 650px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #FFA500 0%, #FFD700 50%, #FFA500 100%);
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,0 L100,0 L100,100 Z" fill="rgba(255,255,255,0.1)"/></svg>');
                background-size: cover;
            }
            
            .header-content {
                position: relative;
                z-index: 2;
            }
            
            .logo {
                font-size: 32px;
                font-weight: 800;
                color: white;
                margin-bottom: 15px;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }
            
            .header h1 {
                color: white;
                font-size: 36px;
                font-weight: 700;
                margin-bottom: 10px;
                text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }
            
            .header p {
                color: rgba(255, 255, 255, 0.9);
                font-size: 18px;
                font-weight: 400;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .welcome-section {
                text-align: center;
                margin-bottom: 35px;
            }
            
            .welcome-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #FFA500, #FFD700);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                box-shadow: 0 8px 20px rgba(255, 165, 0, 0.3);
            }
            
            .welcome-icon svg {
                width: 40px;
                height: 40px;
                color: white;
            }
            
            .welcome-section h2 {
                color: #2d3748;
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 15px;
            }
            
            .welcome-section p {
                color: #4a5568;
                font-size: 16px;
                line-height: 1.7;
            }
            
            .benefits-section {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 30px;
                border-radius: 12px;
                margin: 30px 0;
                border-left: 4px solid #FFA500;
            }
            
            .benefits-section h3 {
                color: #2d3748;
                font-size: 22px;
                font-weight: 700;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .benefits-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-top: 25px;
            }
            
            .benefit-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 15px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            
            .benefit-icon {
                width: 24px;
                height: 24px;
                background: #FFA500;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                margin-top: 2px;
            }
            
            .benefit-icon svg {
                width: 14px;
                height: 14px;
                color: white;
            }
            
            .benefit-content h4 {
                color: #2d3748;
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 5px;
            }
            
            .benefit-content p {
                color: #718096;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .features-section {
                margin: 35px 0;
            }
            
            .features-section h3 {
                color: #2d3748;
                font-size: 22px;
                font-weight: 700;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .features-list {
                list-style: none;
            }
            
            .feature-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .feature-item:last-child {
                border-bottom: none;
            }
            
            .feature-check {
                width: 20px;
                height: 20px;
                background: #48bb78;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .feature-check svg {
                width: 12px;
                height: 12px;
                color: white;
            }
            
            .feature-text {
                color: #4a5568;
                font-size: 15px;
                font-weight: 500;
            }
            
            .cta-section {
                text-align: center;
                margin: 35px 0;
            }
            
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #FFA500, #FFD700);
                color: #1a202c;
                text-decoration: none;
                padding: 16px 40px;
                border-radius: 50px;
                font-size: 16px;
                font-weight: 700;
                box-shadow: 0 6px 20px rgba(255, 165, 0, 0.4);
                transition: all 0.3s ease;
                border: none;
                cursor: pointer;
            }
            
            .cta-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 25px rgba(255, 165, 0, 0.5);
            }
            
            .unsubscribe-section {
                text-align: center;
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #e2e8f0;
            }
            
            .unsubscribe-text {
                color: #718096;
                font-size: 14px;
                margin-bottom: 15px;
            }
            
            .unsubscribe-button {
                display: inline-block;
                color: #e53e3e;
                text-decoration: none;
                padding: 10px 24px;
                border: 1px solid #e53e3e;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .unsubscribe-button:hover {
                background: #e53e3e;
                color: white;
            }
            
            .footer {
                background: #2d3748;
                color: #a0aec0;
                padding: 30px;
                text-align: center;
            }
            
            .footer-content {
                max-width: 500px;
                margin: 0 auto;
            }
            
            .footer p {
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            .social-links {
                display: flex;
                justify-content: center;
                gap: 20px;
                color: white;
                margin: 20px 0;
            }
            
            .social-link {
                width: 36px;
                height: 36px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .social-link:hover {
                background: #FFA500;
                transform: translateY(-2px);
            }
            
            .social-link svg {
                width: 16px;
                height: 16px;
                color: white;
            }
            
            @media (max-width: 600px) {
                .header {
                    padding: 30px 20px;
                }
                
                .header h1 {
                    font-size: 28px;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .benefits-grid {
                    grid-template-columns: 1fr;
                }
                
                .cta-button {
                    padding: 14px 30px;
                    font-size: 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header Section -->
            <div class="header">
                <div class="header-content">
                    <div class="logo">YOKEBUD</div>
                    <h1>Welcome to Our Family! 🎉</h1>
                    <p>Your journey to premium wholesale fashion begins here</p>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <!-- Welcome Section -->
                <div class="welcome-section">
                    <div class="welcome-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 6L9 17l-5-5"/>
                        </svg>
                    </div>
                    <h2>Thank You for Subscribing!</h2>
                    <p>We're thrilled to welcome you to the Yokebud community. Get ready to discover the latest in wholesale fashion and exclusive business opportunities.</p>
                </div>
                
                <!-- Benefits Section -->
                <div class="benefits-section">
                    <h3>Your Subscription Benefits</h3>
                    <div class="benefits-grid">
                        <div class="benefit-item">
                            <div class="benefit-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <div class="benefit-content">
                                <h4>Weekly Product Updates</h4>
                                <p>Be the first to see new arrivals and trending designs</p>
                            </div>
                        </div>
                        
                        <div class="benefit-item">
                            <div class="benefit-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                            </div>
                            <div class="benefit-content">
                                <h4>Exclusive Wholesale Prices</h4>
                                <p>Special rates only available to our subscribers</p>
                            </div>
                        </div>
                        
                        <div class="benefit-item">
                            <div class="benefit-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                                </svg>
                            </div>
                            <div class="benefit-content">
                                <h4>Priority Support</h4>
                                <p>Dedicated assistance for your business needs</p>
                            </div>
                        </div>
                        
                        <div class="benefit-item">
                            <div class="benefit-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                    <polyline points="10,9 9,9 8,9"/>
                                </svg>
                            </div>
                            <div class="benefit-content">
                                <h4>Industry Insights</h4>
                                <p>Latest fashion trends and market analysis</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Features Section -->
                <div class="features-section">
                    <h3>What to Expect</h3>
                    <ul class="features-list">
                        <li class="feature-item">
                            <div class="feature-check">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                            </div>
                            <span class="feature-text">Weekly email updates every Monday</span>
                        </li>
                        <li class="feature-item">
                            <div class="feature-check">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                            </div>
                            <span class="feature-text">High-quality product images and details</span>
                        </li>
                        <li class="feature-item">
                            <div class="feature-check">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                            </div>
                            <span class="feature-text">Direct links to product pages</span>
                        </li>
                        <li class="feature-item">
                            <div class="feature-check">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                            </div>
                            <span class="feature-text">Seasonal promotions and discounts</span>
                        </li>
                        <li class="feature-item">
                            <div class="feature-check">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                            </div>
                            <span class="feature-text">B2B wholesale opportunities</span>
                        </li>
                    </ul>
                </div>
                
                <!-- CTA Section -->
                <div class="cta-section">
                    <a href="${process.env.CLIENT_URL || 'https://www.yokebud.com'}" class="cta-button">
                        Explore Our Collection
                    </a>
                </div>
                
                <!-- Unsubscribe Section -->
                <div class="unsubscribe-section">
                    <p class="unsubscribe-text">
                        If you no longer wish to receive these emails, you can unsubscribe at any time:
                    </p>
                    <a href="${unsubscribeLink}" class="unsubscribe-button">
                        Unsubscribe from Newsletter
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="footer-content">
                    <div class="social-links">
                        <a href="https://www.facebook.com/yokebud" class="social-link">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </a>
                        <a href="https://www.instagram.com/yokebud" class="social-link">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                        </a>
                        <a href="https://wa.me/358440328124" class="social-link">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893-.001-3.189-1.262-6.187-3.55-8.444"/>
                            </svg>
                        </a>
                    </div>
                    <p>Yokebud Group Oy</p>
                    <p>Pukinmäenaukio 4, 00720 Helsinki, Finland</p>
                    <p>Bangladesh Office: Nayonpur, Shahebpara, Rajendropur Cantonment Gazipur 1742</p>
                    <p>Email: yokebud@gmail.com | Phone: +358 440 328 124</p>
                    <p>&copy; ${new Date().getFullYear()} Yokebud. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Yokebud Newsletter <newsletter@yokebud.com>',
    to: email,
    subject: '🎉 Welcome to Yokebud Newsletter - Thank You for Subscribing!',
    html: html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Subscription confirmation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Subscription email sending error:', error);
    return false;
  }
};

// Email template for new subscriber notification (Admin)
const sendNewSubscriberNotificationEmail = async (subscriberEmail) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Newsletter Subscriber - Yokebud</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8f9fa;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
                padding: 30px;
                text-align: center;
            }
            
            .header h1 {
                color: white;
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .header p {
                color: rgba(255, 255, 255, 0.8);
                font-size: 16px;
            }
            
            .content {
                padding: 30px;
            }
            
            .notification-section {
                text-align: center;
                margin-bottom: 25px;
            }
            
            .notification-icon {
                width: 70px;
                height: 70px;
                background: linear-gradient(135deg, #48bb78, #38a169);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                box-shadow: 0 6px 15px rgba(72, 187, 120, 0.3);
            }
            
            .notification-icon svg {
                width: 32px;
                height: 32px;
                color: white;
            }
            
            .notification-section h2 {
                color: #2d3748;
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .subscriber-info {
                background: #f7fafc;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #48bb78;
                margin: 20px 0;
            }
            
            .info-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .info-item:last-child {
                border-bottom: none;
            }
            
            .info-label {
                color: #4a5568;
                font-weight: 600;
            }
            
            .info-value {
                color: #2d3748;
                font-weight: 500;
            }
            
            .stats-section {
                background: linear-gradient(135deg, #edf2f7, #e2e8f0);
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
            }
            
            .stats-section h3 {
                color: #2d3748;
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 15px;
                text-align: center;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }
            
            .stat-item {
                text-align: center;
                padding: 15px;
                background: white;
                border-radius: 6px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
            }
            
            .stat-number {
                font-size: 24px;
                font-weight: 700;
                color: #2d3748;
                margin-bottom: 5px;
            }
            
            .stat-label {
                font-size: 12px;
                color: #718096;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .cta-section {
                text-align: center;
                margin-top: 25px;
            }
            
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #FFA500, #FFD700);
                color: #1a202c;
                text-decoration: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 15px rgba(255, 165, 0, 0.4);
            }
            
            .footer {
                background: #2d3748;
                color: #a0aec0;
                padding: 20px;
                text-align: center;
                font-size: 12px;
            }
            
            @media (max-width: 600px) {
                .header {
                    padding: 20px;
                }
                
                .content {
                    padding: 20px;
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>🎯 New Newsletter Subscriber</h1>
                <p>Yokebud Newsletter System</p>
            </div>
            
            <!-- Content -->
            <div class="content">
                <!-- Notification Section -->
                <div class="notification-section">
                    <div class="notification-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                            <circle cx="8.5" cy="7" r="4"/>
                            <path d="M20 8v6M23 11h-6"/>
                        </svg>
                    </div>
                    <h2>New Subscriber Alert!</h2>
                    <p>Someone just subscribed to your newsletter</p>
                </div>
                
                <!-- Subscriber Information -->
                <div class="subscriber-info">
                    <div class="info-item">
                        <span class="info-label">Email Address:</span>
                        <span class="info-value">${subscriberEmail}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Subscription Date:</span>
                        <span class="info-value">${new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="info-value" style="color: #48bb78;">✅ Active</span>
                    </div>
                </div>
                
                
                <!-- CTA Section -->
                <div class="cta-section">
                    <a href="${process.env.ADMIN_URL || 'https://www.yokebud.com/admin'}" class="cta-button">
                        View Subscriber Dashboard
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>This is an automated notification from Yokebud Newsletter System</p>
                <p>&copy; ${new Date().getFullYear()} Yokebud Group Oy. All rights reserved.</p>
            </div>
        </div>
        
        <script>
            // This would be replaced with actual data from your backend
            setTimeout(() => {
                document.getElementById('totalSubscribers').textContent = '+1';
                document.getElementById('activeSubscribers').textContent = '+1';
            }, 1000);
        </script>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Yokebud System <newsletter@yokebud.com>',
    to: 'yokebud@gmail.com', // Admin email
    subject: `🎯 New Newsletter Subscriber: ${subscriberEmail}`,
    html: html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 New subscriber notification sent to admin`);
    return true;
  } catch (error) {
    console.error('❌ New subscriber notification email error:', error);
    return false;
  }
};

// Email template for weekly product updates
const sendWeeklyNewsletter = async (subscriber, products) => {
  const unsubscribeLink = `${process.env.CLIENT_URL || 'https://yokebud.com'}/UnsubscribePage?token=${subscriber.subscription_token}`;
  
  // Create product grid HTML
  const productGrid = products.map(product => {
    const productLink = `${process.env.CLIENT_URL || 'https://www.yokebud.com'}/products/${product.id}`;
    const imageUrl = product.firstImage || product.product_photos?.[0] || bglogoimg;
    const price = product.min_price !== product.max_price 
      ? `$${product.min_price} - $${product.max_price}`
      : `$${product.min_price}`;

    return `
      <div style="border: 1px solid #e1e1e1; border-radius: 12px; overflow: hidden; margin: 10px; background: white; transition: all 0.3s ease;">
        <div style="position: relative; width: 100%; height: 200px; overflow: hidden;">
          <img src="${imageUrl}" 
               alt="${product.product_name}" 
               style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;"
               onerror="this.src='${bglogoimg}'">
        </div>
        <div style="padding: 15px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #333; font-weight: 600; line-height: 1.4;">
            ${product.product_name}
          </h3>
          <p style="margin: 0 0 8px 0; font-size: 18px; color: #FFA500; font-weight: 700;">
            ${price}
          </p>
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #666; line-height: 1.4; height: 40px; overflow: hidden;">
            ${product.product_details ? product.product_details.substring(0, 80) + '...' : 'Premium quality product'}
          </p>
          <a href="${productLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #FFA500, #FFD700); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 600; transition: all 0.3s ease;">
            View Product
          </a>
        </div>
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Yokebud Weekly Update</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            body {
                font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8f9fa;
                margin: 0;
                padding: 0;
            }
            
            .container {
                max-width: 650px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #FFA500 0%, #FFD700 50%, #FFA500 100%);
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,0 L100,0 L100,100 Z" fill="rgba(255,255,255,0.1)"/></svg>');
                background-size: cover;
            }
            
            .header-content {
                position: relative;
                z-index: 2;
            }
            
            .logo {
                font-size: 32px;
                font-weight: 800;
                color: white;
                margin-bottom: 15px;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }
            
            .header h1 {
                color: white;
                font-size: 36px;
                font-weight: 700;
                margin-bottom: 10px;
                text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }
            
            .header p {
                color: rgba(255, 255, 255, 0.9);
                font-size: 18px;
                font-weight: 400;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .intro-section {
                text-align: center;
                margin-bottom: 35px;
            }
            
            .intro-section h2 {
                color: #2d3748;
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 15px;
            }
            
            .intro-section p {
                color: #4a5568;
                font-size: 16px;
                line-height: 1.7;
                max-width: 500px;
                margin: 0 auto;
            }
            
            .products-section {
                margin: 35px 0;
            }
            
            .products-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin: 25px 0;
            }
            
            .unsubscribe-section {
                text-align: center;
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #e2e8f0;
            }
            
            .unsubscribe-text {
                color: #718096;
                font-size: 14px;
                margin-bottom: 15px;
            }
            
            .unsubscribe-button {
                display: inline-block;
                color: #e53e3e;
                text-decoration: none;
                padding: 10px 24px;
                border: 1px solid #e53e3e;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .unsubscribe-button:hover {
                background: #e53e3e;
                color: white;
            }
            
            .footer {
                background: #2d3748;
                color: #a0aec0;
                padding: 30px;
                text-align: center;
            }
            
            .footer-content {
                max-width: 500px;
                margin: 0 auto;
            }
            
            .footer p {
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            @media (max-width: 600px) {
                .header {
                    padding: 30px 20px;
                }
                
                .header h1 {
                    font-size: 28px;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .products-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header Section -->
            <div class="header">
                <div class="header-content">
                    <div class="logo">YOKEBUD</div>
                    <h1>This Week's Featured Products 🚀</h1>
                    <p>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <!-- Intro Section -->
                <div class="intro-section">
                    <h2>New Arrivals Just For You!</h2>
                    <p>Discover our latest wholesale fashion pieces carefully selected for your business. From trendy designs to classic essentials, we've got everything you need.</p>
                </div>
                
                <!-- Products Section -->
                <div class="products-section">
                    <div class="products-grid">
                        ${productGrid}
                    </div>
                </div>
                
                <!-- Unsubscribe Section -->
                <div class="unsubscribe-section">
                    <p class="unsubscribe-text">
                        If you no longer wish to receive these emails, you can unsubscribe below:
                    </p>
                    <a href="${unsubscribeLink}" class="unsubscribe-button">
                        Unsubscribe from Newsletter
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="footer-content">
                    <p>Yokebud Group Oy - Premium Wholesale Clothing</p>
                    <p>Pukinmäenaukio 4, 00720 Helsinki, Finland</p>
                    <p>Email: yokebud@gmail.com | Phone: +358 440 328 124</p>
                    <p>&copy; ${new Date().getFullYear()} Yokebud. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Yokebud Updates <newsletter@yokebud.com>',
    to: subscriber.email,
    subject: `🚀 Yokebud Weekly Update - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    html: html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Weekly newsletter sent to ${subscriber.email}`);
    return true;
  } catch (error) {
    console.error('❌ Weekly newsletter email error:', error);
    return false;
  }
};

// Email template for unsubscribe confirmation
const sendUnsubscribeConfirmationEmail = async (email) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed from Yokebud Newsletter</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            body {
                font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8f9fa;
                margin: 0;
                padding: 0;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
                padding: 40px 30px;
                text-align: center;
            }
            
            .header h1 {
                color: white;
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .header p {
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
            }
            
            .content {
                padding: 40px 30px;
                text-align: center;
            }
            
            .icon-section {
                margin-bottom: 25px;
            }
            
            .unsubscribe-icon {
                width: 80px;
                height: 80px;
                background: #e53e3e;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
            }
            
            .unsubscribe-icon svg {
                width: 40px;
                height: 40px;
                color: white;
            }
            
            .message-section h2 {
                color: #2d3748;
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 15px;
            }
            
            .message-section p {
                color: #4a5568;
                font-size: 16px;
                line-height: 1.7;
                margin-bottom: 25px;
            }
            
            .cta-section {
                margin: 30px 0;
            }
            
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #718096, #4a5568);
                color: white;
                text-decoration: none;
                padding: 14px 35px;
                border-radius: 50px;
                font-size: 16px;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(113, 128, 150, 0.4);
            }
            
            .resubscribe-section {
                margin-top: 25px;
                padding-top: 25px;
                border-top: 1px solid #e2e8f0;
            }
            
            .resubscribe-text {
                color: #718096;
                font-size: 14px;
                margin-bottom: 15px;
            }
            
            .resubscribe-button {
                display: inline-block;
                color: #FFA500;
                text-decoration: none;
                padding: 10px 20px;
                border: 1px solid #FFA500;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .resubscribe-button:hover {
                background: #FFA500;
                color: white;
            }
            
            .footer {
                background: #2d3748;
                color: #a0aec0;
                padding: 30px;
                text-align: center;
            }
            
            .footer p {
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            @media (max-width: 600px) {
                .header {
                    padding: 30px 20px;
                }
                
                .content {
                    padding: 30px 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>We're Sorry to See You Go</h1>
                <p>You've been unsubscribed from Yokebud Newsletter</p>
            </div>
            
            <!-- Content -->
            <div class="content">
                <div class="icon-section">
                    <div class="unsubscribe-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </div>
                </div>
                
                <div class="message-section">
                    <h2>Successfully Unsubscribed</h2>
                    <p>
                        You have been removed from our mailing list and will no longer receive 
                        weekly product updates, exclusive offers, or fashion insights from Yokebud.
                    </p>
                    <p>
                        We hope you enjoyed being part of our community and found value in our updates.
                    </p>
                </div>
                
                <div class="cta-section">
                    <a href="${process.env.CLIENT_URL || 'https://www.yokebud.com'}" class="cta-button">
                        Visit Our Website
                    </a>
                </div>
                
                <div class="resubscribe-section">
                    <p class="resubscribe-text">
                        Changed your mind? You can always resubscribe through our website.
                    </p>
                    <a href="${process.env.CLIENT_URL || 'https://yokebud.com'}" class="resubscribe-button">
Resubscribe Later
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>Yokebud Group Oy - Premium Wholesale Clothing</p>
                <p>Pukinmäenaukio 4, 00720 Helsinki, Finland</p>
                <p>&copy; ${new Date().getFullYear()} Yokebud. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Yokebud <newsletter@yokebud.com>',
    to: email,
    subject: '👋 You have been unsubscribed from Yokebud Newsletter',
    html: html,
    priority: 'high'
  };

  // Set a timeout for the email sending operation
  const sendMailWithTimeout = async (options, timeout = 10000) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Email sending timed out'));
      }, timeout);

      transporter.sendMail(options)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  // Try to send with retries
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`📧 Attempting to send unsubscribe confirmation to ${email} (Attempt ${attempts}/${maxAttempts})`);
      
      await sendMailWithTimeout(mailOptions);
      console.log(`✅ Unsubscribe confirmation successfully sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`❌ Unsubscribe confirmation email error (Attempt ${attempts}/${maxAttempts}):`, error);
      
      if (attempts >= maxAttempts) {
        console.error(`⚠️ Failed to send unsubscribe confirmation after ${maxAttempts} attempts to ${email}`);
        return false;
      }
      
      // Wait before retrying
      console.log(`⏳ Waiting before retry ${attempts+1}...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  return false;
};

// Subscribe to newsletter endpoint
app.post('/api/subscribe', async (req, res) => {
  let connection;
  let emailSaved = false;
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    console.log(`Processing subscription request for email: ${email}`);
    connection = await pool.getConnection();

    // Check if email already exists
    const [existingSubscribers] = await connection.query(
      'SELECT * FROM subscribers WHERE email = ?',
      [email]
    );

    if (existingSubscribers.length > 0) {
      const subscriber = existingSubscribers[0];
      
      if (subscriber.is_active) {
        console.log(`Email ${email} is already subscribed`);
        connection.release();
        return res.json({ 
          success: true, 
          message: 'You are already subscribed to our newsletter!' 
        });
      } else {
        // Reactivate subscription
        const token = generateSubscriptionToken();
        await connection.query(
          'UPDATE subscribers SET is_active = TRUE, subscription_token = ?, updated_at = NOW() WHERE email = ?',
          [token, email]
        );
        connection.release();
        emailSaved = true;

        // Send welcome email
        try {
          await sendSubscriptionConfirmationEmail(email, token);
          await sendNewSubscriberNotificationEmail(email);
        } catch (emailError) {
          console.error(`Error sending emails for reactivation: ${emailError.message}`);
          // We'll still return success since the DB was updated
        }

        return res.json({ 
          success: true, 
          message: 'Successfully resubscribed to our newsletter!' 
        });
      }
    }

    // Create new subscription
    const subscriptionToken = generateSubscriptionToken();
    
    await connection.query(
      'INSERT INTO subscribers (email, subscription_token, is_active) VALUES (?, ?, ?)',
      [email, subscriptionToken, true]
    );

    connection.release();
    emailSaved = true;

    // Send welcome email to subscriber with retry mechanism
    let emailSent = false;
    try {
      console.log(`Sending confirmation email to: ${email}`);
      await sendSubscriptionConfirmationEmail(email, subscriptionToken);
      console.log(`Confirmation email sent successfully to: ${email}`);
      emailSent = true;
    } catch (emailError) {
      console.error(`Failed to send confirmation email to ${email}:`, emailError);
      // Retry once after a short delay
      setTimeout(async () => {
        try {
          await sendSubscriptionConfirmationEmail(email, subscriptionToken);
          console.log(`Retry: Confirmation email sent successfully to: ${email}`);
        } catch (retryError) {
          console.error(`Retry failed for confirmation email to ${email}:`, retryError);
        }
      }, 3000);
    }
    
    // Send notification to admin with retry mechanism
    try {
      console.log(`Sending notification email to admin`);
      await sendNewSubscriberNotificationEmail(email);
      console.log(`Admin notification email sent successfully`);
    } catch (emailError) {
      console.error(`Failed to send admin notification:`, emailError);
      // Retry once after a short delay
      setTimeout(async () => {
        try {
          await sendNewSubscriberNotificationEmail(email);
          console.log(`Retry: Admin notification email sent successfully`);
        } catch (retryError) {
          console.error(`Retry failed for admin notification:`, retryError);
        }
      }, 3000);
    }

    // Always return success if the email was saved to the database
    res.json({ 
      success: true, 
      message: emailSent 
        ? 'Thank you for subscribing to our newsletter! Please check your email for confirmation.' 
        : 'Thank you for subscribing to our newsletter! You have been added to our mailing list.'
    });
  } catch (error) {
    console.error('❌ Subscription error:', error);
    if (connection) connection.release();
    
    // If we already saved the email to the database but encountered other errors
    if (emailSaved) {
      return res.json({ 
        success: true, 
        message: 'Thank you for subscribing to our newsletter! You have been added to our mailing list.'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Subscription failed. Please try again.' 
    });
  }
});

// Unsubscribe from newsletter endpoint
app.post('/api/unsubscribe', async (req, res) => {
  let connection;
  try {
    const { token, email } = req.body;
    
    if (!token && !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Unsubscribe token or email is required' 
      });
    }

    console.log(`🔄 Processing unsubscription request: ${token ? 'Using token' : `For email: ${email}`}`);
    
    // Set a timeout for database operations
    const getConnectionWithTimeout = async (timeout = 15000) => {
      return new Promise(async (resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Database connection timed out'));
        }, timeout);
        
        try {
          const conn = await pool.getConnection();
          clearTimeout(timer);
          resolve(conn);
        } catch (err) {
          clearTimeout(timer);
          reject(err);
        }
      });
    };
    
    // Get connection with timeout
    connection = await getConnectionWithTimeout();
    console.log('✅ Database connection established');

    let subscriber;
    
    if (token) {
      // Unsubscribe by token (from email link)
      console.log(`🔍 Looking up subscriber by token: ${token.substring(0, 8)}...`);
      const [subscribers] = await connection.query(
        'SELECT * FROM subscribers WHERE subscription_token = ? AND is_active = TRUE',
        [token]
      );
      subscriber = subscribers[0];
    } else if (email) {
      // Unsubscribe by email (from unsubscribe page)
      console.log(`🔍 Looking up subscriber by email: ${email}`);
      const [subscribers] = await connection.query(
        'SELECT * FROM subscribers WHERE email = ? AND is_active = TRUE',
        [email]
      );
      subscriber = subscribers[0];
    }

    if (!subscriber) {
      console.log(`⚠️ No active subscription found for ${token ? 'token' : email}`);
      connection.release();
      return res.status(404).json({ 
        success: false, 
        message: 'Subscription not found or already unsubscribed' 
      });
    }

    console.log(`✅ Found active subscription for: ${subscriber.email}`);

    // Deactivate subscription with transaction
    try {
      await connection.beginTransaction();
      
      console.log(`🔄 Deactivating subscription for: ${subscriber.email}`);
      await connection.query(
        'UPDATE subscribers SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
        [subscriber.id]
      );
      
      await connection.commit();
      console.log(`✅ Successfully deactivated subscription for: ${subscriber.email}`);
    } catch (transactionError) {
      console.error('❌ Transaction error:', transactionError);
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }

    // Send unsubscribe confirmation email
    console.log(`📧 Sending unsubscribe confirmation email to: ${subscriber.email}`);
    sendUnsubscribeConfirmationEmail(subscriber.email)
      .then(success => {
        if (success) {
          console.log(`✅ Unsubscribe confirmation email sent to: ${subscriber.email}`);
        } else {
          console.error(`❌ Failed to send unsubscribe confirmation to: ${subscriber.email}`);
        }
      })
      .catch(emailError => {
        console.error(`❌ Error sending unsubscribe confirmation to ${subscriber.email}:`, emailError);
      });

    res.json({ 
      success: true, 
      message: 'You have been successfully unsubscribed from our newsletter.' 
    });
  } catch (error) {
    console.error('❌ Unsubscribe error:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Unsubscribe failed. Please try again later.' 
    });
  }
});

// Get subscription status endpoint
app.get('/api/subscription-status', async (req, res) => {
  let connection;
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    connection = await pool.getConnection();

    const [subscribers] = await connection.query(
      'SELECT is_active FROM subscribers WHERE email = ?',
      [email]
    );

    connection.release();

    const isSubscribed = subscribers.length > 0 && subscribers[0].is_active;

    res.json({ 
      success: true, 
      isSubscribed 
    });
  } catch (error) {
    console.error('❌ Subscription status error:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check subscription status' 
    });
  }
});

// Get subscriber count endpoint
// Get all subscribers
app.get('/api/subscribers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subscribers');
    console.log('Subscribers data:', rows);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

app.get('/api/subscribers/count', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [totalResult] = await connection.query(
      'SELECT COUNT(*) as total FROM subscribers WHERE is_active = TRUE'
    );

    const [todayResult] = await connection.query(
      'SELECT COUNT(*) as today FROM subscribers WHERE DATE(created_at) = CURDATE() AND is_active = TRUE'
    );

    connection.release();

    res.json({ 
      success: true, 
      total: totalResult[0].total,
      today: todayResult[0].today
    });
  } catch (error) {
    console.error('❌ Subscriber count error:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get subscriber count' 
    });
  }
});

// ==================== WEEKLY NEWSLETTER CRON JOB ====================

const sendWeeklyNewsletters = async () => {
  let connection;
  try {
    console.log('🚀 Starting weekly newsletter distribution...');
    
    connection = await pool.getConnection();

    // Get all active subscribers
    const [subscribers] = await connection.query(
      'SELECT email, subscription_token FROM subscribers WHERE is_active = TRUE'
    );

    if (subscribers.length === 0) {
      console.log('ℹ️ No active subscribers found for weekly newsletter');
      connection.release();
      return;
    }

    // Get latest products (limit to 6 for newsletter)
    const [products] = await connection.query(`
      SELECT p.*, 
             JSON_UNQUOTE(JSON_EXTRACT(p.product_photos, '$[0]')) as firstImage
      FROM products p 
      WHERE p.stock > 0 
      ORDER BY p.created_at DESC 
      LIMIT 6
    `);

    if (products.length === 0) {
      console.log('ℹ️ No products found for weekly newsletter');
      connection.release();
      return;
    }

    // Process product data for email
    const processedProducts = products.map(product => {
      const photos = typeof product.product_photos === 'string' 
        ? JSON.parse(product.product_photos) 
        : product.product_photos || [];
      
      return {
        ...product,
        firstImage: photos.length > 0 ? photos[0] : null,
        min_price: product.min_price || product.price,
        max_price: product.max_price || product.price
      };
    });

    let successCount = 0;
    let errorCount = 0;

    // Send newsletter to each subscriber
    for (const subscriber of subscribers) {
      try {
        const success = await sendWeeklyNewsletter(subscriber, processedProducts);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to send newsletter to ${subscriber.email}:`, error);
        errorCount++;
      }
    }

    connection.release();
    
    console.log(`✅ Weekly newsletter distribution completed. Success: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Weekly newsletter distribution error:', error);
    if (connection) connection.release();
  }
};

// Schedule weekly newsletter (every Monday at 10:00 AM)
const scheduleWeeklyNewsletter = () => {
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
  nextMonday.setHours(10, 0, 0, 0);

  const timeUntilNextMonday = nextMonday.getTime() - now.getTime();

  console.log(`📅 Weekly newsletter scheduled for: ${nextMonday}`);

  // Schedule first run
  setTimeout(() => {
    sendWeeklyNewsletters();
    // Set up recurring weekly interval
    setInterval(sendWeeklyNewsletters, 7 * 24 * 60 * 60 * 1000);
  }, timeUntilNextMonday);
};

// Start the scheduler when server starts
scheduleWeeklyNewsletter();

// Manual trigger endpoint for testing (remove in production)
app.post('/api/send-test-newsletter', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Not allowed in production' });
  }
  
  try {
    await sendWeeklyNewsletters();
    res.json({ success: true, message: 'Test newsletter sent' });
  } catch (error) {
    console.error('❌ Test newsletter error:', error);
    res.status(500).json({ success: false, message: 'Test newsletter failed' });
  }
});

// Get all subscribers (admin only)
app.get('/api/admin/subscribers', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [subscribers] = await connection.query(
      'SELECT email, is_active, created_at, updated_at FROM subscribers ORDER BY created_at DESC'
    );

    connection.release();

    res.json({ 
      success: true, 
      subscribers 
    });
  } catch (error) {
    console.error('❌ Get subscribers error:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get subscribers' 
    });
  }
});
// ==================== KEEP-ALIVE MECHANISM ====================
// This will help keep the Render instance awake by pinging itself
const keepAlive = () => {
  const https = require('https');
  
  if (process.env.RENDER_EXTERNAL_URL) {
    console.log('Setting up keep-alive ping for:', process.env.RENDER_EXTERNAL_URL);
    
    setInterval(() => {
      https.get(`${process.env.RENDER_EXTERNAL_URL}/health`, (res) => {
        console.log(`Keep-alive ping successful - Status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.log('Keep-alive ping error:', err.message);
      });
    }, 14 * 60 * 1000); // Ping every 14 minutes (Render sleeps after 15 minutes of inactivity)
  }
};

// ==================== ERROR HANDLING MIDDLEWARE ====================
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// SEO Routes
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Disallow:

Sitemap: https://yokebud.com/sitemap.xml`);
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [products] = await connection.query(
      'SELECT id, name, updated_at FROM products ORDER BY updated_at DESC'
    );
    connection.release();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yokebud.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yokebud.com/about</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://yokebud.com/clothing</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://yokebud.com/other-products</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://yokebud.com/contact</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

    products.forEach(product => {
      const lastmod = product.updated_at ? new Date(product.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      sitemap += `
  <url>
    <loc>https://yokebud.com/products/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    res.type('application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Enhanced Socket.IO server with persistent unread count initialized`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start keep-alive mechanism if running on Render
  if (process.env.RENDER) {
    keepAlive();
  }
});
