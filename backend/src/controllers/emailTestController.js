const emailService = require('../services/emailService');
const { User, Product, Order } = require('../models');

/**
 * Test email functionality
 * @route POST /api/email-test/:type
 * @access Private (Admin only)
 */
const testEmail = async (req, res) => {
  try {
    const { type } = req.params;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    let result;
    
    switch (type) {
      case 'welcome':
        const testUser = {
          firstName: 'Test',
          lastName: 'User',
          email: email,
          name: 'Test User'
        };
        result = await emailService.sendWelcomeEmail(testUser);
        break;

      case 'order-confirmation':
        const mockOrder = {
          _id: '507f1f77bcf86cd799439011',
          orderNumber: 'TEST-' + Date.now(),
          items: [
            {
              product: {
                name: 'Test Lipstick',
                brand: 'Test Brand'
              },
              quantity: 2,
              price: 25.99
            },
            {
              product: {
                name: 'Test Foundation',
                brand: 'Test Brand'
              },
              quantity: 1,
              price: 45.99
            }
          ],
          subtotal: 97.97,
          tax: {
            amount: 7.84,
            rate: 0.08
          },
          shipping: {
            cost: 5.99,
            method: 'standard'
          },
          total: 111.80,
          status: 'pending',
          createdAt: new Date(),
          shippingAddress: {
            street: '123 Test Street',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'Test Country'
          }
        };
        
        const mockUser = {
          firstName: 'Test',
          email: email,
          name: 'Test User'
        };
        
        result = await emailService.sendOrderConfirmation(mockOrder, mockUser);
        break;

      case 'product-availability':
        const mockProduct = {
          _id: '507f1f77bcf86cd799439012',
          name: 'Test Premium Serum',
          brand: 'Luxury Brand',
          price: 89.99,
          originalPrice: 120.00,
          shortDescription: 'A revolutionary anti-aging serum that transforms your skin.',
          images: [
            {
              url: 'https://via.placeholder.com/300x300/ceafa6/ffffff?text=Test+Product',
              alt: 'Test Premium Serum',
              isPrimary: true
            }
          ],
          inventory: {
            quantity: 15
          }
        };
        
        const mockUsers = [{
          firstName: 'Test',
          email: email,
          name: 'Test User'
        }];
        
        const results = await emailService.sendProductAvailabilityNotification(mockProduct, mockUsers);
        // Handle Promise.allSettled results
        const firstResult = results[0];
        if (firstResult.status === 'fulfilled') {
          result = firstResult.value;
        } else {
          result = { success: false, error: firstResult.reason?.message || 'Product availability email failed' };
        }
        break;

      case 'order-status':
        const mockOrderStatus = {
          _id: '507f1f77bcf86cd799439013',
          orderNumber: 'TEST-STATUS-' + Date.now(),
          status: 'shipped',
          trackingNumber: 'TEST123456789',
          carrier: 'Test Shipping'
        };
        
        const mockUserStatus = {
          firstName: 'Test',
          email: email,
          name: 'Test User'
        };
        
        result = await emailService.sendOrderStatusUpdate(mockOrderStatus, mockUserStatus, 'shipped');
        break;

      case 'password-reset':
        const mockResetUser = {
          firstName: 'Test',
          email: email,
          name: 'Test User'
        };
        
        const resetToken = 'test-reset-token-' + Date.now();
        result = await emailService.sendPasswordResetEmail(mockResetUser, resetToken);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid email type. Available types: welcome, order-confirmation, product-availability, order-status, password-reset'
        });
    }

    // Check if the email service returned an error
    if (result && !result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error || 'Unknown email error'
      });
    }

    res.json({
      success: true,
      message: `Test ${type} email sent successfully to ${email}`,
      data: { result }
    });

  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};

/**
 * Check email service configuration
 * @route GET /api/email-test/config
 * @access Private (Admin only)
 */
const checkEmailConfig = async (req, res) => {
  try {
    const config = {
      smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      sendpulseConfigured: !!(process.env.SENDPULSE_USER && process.env.SENDPULSE_PASSWORD),
      contactEmail: process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'Not configured',
      appName: process.env.APP_NAME || 'Cosmetic Shop',
      frontendUrl: process.env.FRONTEND_URL || 'Not configured',
      activeProvider: process.env.SENDPULSE_USER ? 'SendPulse' : (process.env.SMTP_USER ? 'SMTP' : 'None'),
      developmentMode: process.env.NODE_ENV === 'development'
    };

    // Add helpful messages
    let message = 'Email configuration status';
    if (!config.smtpConfigured && !config.sendpulseConfigured) {
      message += ' - No email provider configured. Emails will be logged only.';
    } else if (config.sendpulseConfigured) {
      message += ' - SendPulse SMTP configured. If authentication fails, check credentials.';
    }

    res.json({
      success: true,
      message,
      data: { config }
    });

  } catch (error) {
    console.error('Email config check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email configuration'
    });
  }
};

module.exports = {
  testEmail,
  checkEmailConfig
};
