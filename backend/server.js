const dotenv = require('dotenv');
dotenv.config(); // This must be the first line

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { handleWebhook } = require('./src/controllers/paymentController');

const app = express();
const PORT = process.env.PORT || 5000;

// --- App Configuration & Middleware ---

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    if (origin.includes('.vercel.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Use raw body parser for the Stripe webhook BEFORE the json parser — Stripe
// needs the raw, unparsed body to verify the webhook signature.
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Routes ---

app.get('/', (req, res) => {
  res.json({
    message: 'Cosmetic Shop API Server is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/contact', require('./src/routes/contact'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/email-test', require('./src/routes/emailTest'));
app.use('/api/newsletter', require('./src/routes/newsletter'));
app.use('/api/admin', require('./src/routes/admin'));
// Handles /api/payment/create-payment-intent (authenticated).
// The webhook route above is intentionally mounted separately, before this.
app.use('/api/payment', require('./src/routes/payment'));

// --- DB Connection & Server Start ---

const connectDB = async () => {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB connected successfully');
    } else {
      console.log('MONGO_URI not provided - running without database connection');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
