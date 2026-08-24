const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Priority 1: Gmail SMTP (more reliable for development)
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const port = parseInt(process.env.SMTP_PORT) || 587;
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: port,
          secure: port === 465, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        this.backupTransporter = null;
        
        // Set up SendPulse as backup if available
        if (process.env.SENDPULSE_USER && process.env.SENDPULSE_PASSWORD) {
          this.backupTransporter = nodemailer.createTransport({
            host: 'smtp-pulse.com',
            port: 587,
            secure: false,
            auth: {
              user: process.env.SENDPULSE_USER,
              pass: process.env.SENDPULSE_PASSWORD,
            },
          });
          console.log('Email service initialized with Gmail SMTP (primary) and SendPulse (backup)');
        } else {
          console.log('Email service initialized with Gmail SMTP');
        }
      } else if (process.env.SENDPULSE_USER && process.env.SENDPULSE_PASSWORD) {
        // Fallback to SendPulse only
        this.transporter = nodemailer.createTransport({
          host: 'smtp-pulse.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.SENDPULSE_USER,
            pass: process.env.SENDPULSE_PASSWORD,
          },
        });
        console.log('Email service initialized with SendPulse SMTP');
      } else {
        console.warn('No email configuration found. Email service will log messages only.');
        // In development, we can still "send" emails by logging them
        if (process.env.NODE_ENV === 'development') {
          console.log('Running in development mode - emails will be logged instead of sent');
        }
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(mailOptions) {
    if (!this.transporter) {
      console.log('Email would be sent:', mailOptions);
      return { success: true, message: 'Email logged (no transporter configured)' };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully via primary SMTP:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Primary SMTP failed:', error.message);
      
      // Try backup transporter if available
      if (this.backupTransporter) {
        try {
          console.log('Trying backup SMTP (SendPulse)...');
          const info = await this.backupTransporter.sendMail(mailOptions);
          console.log('Email sent successfully via backup SMTP:', info.messageId);
          return { success: true, messageId: info.messageId, usedBackup: true };
        } catch (backupError) {
          console.error('Backup SMTP also failed:', backupError.message);
          // Throw so callers (and their try/catch blocks) actually see the failure,
          // instead of silently reporting success while no email was ever delivered.
          const combinedError = new Error(`Both SMTP failed. Primary: ${error.message}, Backup: ${backupError.message}`);
          combinedError.code = 'BOTH_SMTP_FAILED';
          throw combinedError;
        }
      }

      // No backup configured - propagate the primary error
      const sendError = new Error(error.message || 'Unknown email error');
      sendError.code = error.code || 'EMAIL_ERROR';
      throw sendError;
    }
  }

  // Order confirmation email
  async sendOrderConfirmation(order, user) {
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: user.email,
      subject: `Order Confirmation - ${process.env.APP_NAME || 'Cosmetic Shop'}`,
      html: this.generateOrderConfirmationTemplate(order, user)
    };

    return await this.sendEmail(mailOptions);
  }

  // Product availability notification
  async sendProductAvailabilityNotification(product, users) {
    const promises = users.map(user => {
      const mailOptions = {
        from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
        to: user.email,
        subject: `${product.name} is now available! - ${process.env.APP_NAME || 'Cosmetic Shop'}`,
        html: this.generateProductAvailabilityTemplate(product, user)
      };
      return this.sendEmail(mailOptions);
    });

    return await Promise.allSettled(promises);
  }

  // Order status update email
  async sendOrderStatusUpdate(order, user, newStatus) {
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: user.email,
      subject: `Order Update - ${order.orderNumber} - ${process.env.APP_NAME || 'Cosmetic Shop'}`,
      html: this.generateOrderStatusUpdateTemplate(order, user, newStatus)
    };

    return await this.sendEmail(mailOptions);
  }

  // Welcome email for new users
  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: user.email,
      subject: `Welcome to ${process.env.APP_NAME || 'Cosmetic Shop'}!`,
      html: this.generateWelcomeTemplate(user)
    };

    return await this.sendEmail(mailOptions);
  }

  // Password reset email
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: user.email,
      subject: `Password Reset - ${process.env.APP_NAME || 'Cosmetic Shop'}`,
      html: this.generatePasswordResetTemplate(user, resetUrl)
    };

    return await this.sendEmail(mailOptions);
  }

  // Delivery instructions email
  async sendDeliveryInstructions(order, user) {
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: user.email,
      subject: `📦 Delivery Instructions - Order #${order.orderNumber}`,
      html: this.getDeliveryInstructionsTemplate(order, user)
    };

    return this.sendEmail(mailOptions);
  }

  // Payment request email
  async sendPaymentRequestEmail(order) {
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: order.customer.email,
      subject: `💳 Payment Required - Order #${order.orderNumber}`,
      html: this.getPaymentRequestTemplate(order)
    };

    return this.sendEmail(mailOptions);
  }

  // Payment confirmation email
  async sendPaymentConfirmationEmail(order) {
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: order.customer.email,
      subject: `✅ Payment Confirmed - Order #${order.orderNumber}`,
      html: this.getPaymentConfirmationTemplate(order)
    };

    return this.sendEmail(mailOptions);
  }

  // Payment failed email
  async sendPaymentFailedEmail(order) {
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: order.customer.email,
      subject: `❌ Payment Failed - Order #${order.orderNumber}`,
      html: this.getPaymentFailedTemplate(order)
    };

    return this.sendEmail(mailOptions);
  }

  // Newsletter email to a single subscriber
  async sendNewsletterEmail(user, { subject, message }) {
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: user.email,
      subject: `${subject} - ${process.env.APP_NAME || 'Cosmetic Shop'}`,
      html: this.getNewsletterTemplate(subject, message, user)
    };

    return this.sendEmail(mailOptions);
  }

  // Bulk newsletter send - one admin-composed message to every subscribed user.
  // Settles per-recipient so one bad address doesn't stop the rest from sending,
  // and reports back exactly who succeeded/failed (mirrors the delivery-instructions
  // flow, which throws per-send instead of silently swallowing failures).
  async sendNewsletterToUsers(users, { subject, message }) {
    const results = await Promise.all(
      users.map(user =>
        this.sendNewsletterEmail(user, { subject, message }).then(
          (result) => ({ email: user.email, success: true, result }),
          (error) => ({ email: user.email, success: false, error: error.message })
        )
      )
    );

    return results;
  }

  // Email templates
  generateOrderConfirmationTemplate(order, user) {
    const formatPrice = (price) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price);
    };

    const appName = process.env.APP_NAME || 'Cosmetic Shop';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        </style>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #2d2d2d; max-width: 650px; margin: 0 auto; padding: 0; background: #faf9f7;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ceafa6 0%, #d4b8a8 50%, #e2c4b8 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;"></div>
          <div style="position: absolute; bottom: -30px; left: -30px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.2;"></div>
          <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${appName}</h1>
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.95;">✨ Thank you for your beautiful order! ✨</p>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-family: 'Playfair Display', serif; color: #2d2d2d; margin: 0; font-size: 28px; font-weight: 600;">Order Confirmation</h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 25px;">Hi <strong style="color: #ceafa6;">${user.firstName || user.name || 'Beautiful'}</strong>,</p>
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 30px;">We've received your order and our beauty experts are carefully preparing your items. Here are the details:</p>
          
          <!-- Order Info Card -->
          <div style="background: linear-gradient(135deg, #f8f6f4 0%, #faf8f6 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #e8e2dd; position: relative;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); border-radius: 15px 15px 0 0;"></div>
            <h3 style="font-family: 'Playfair Display', serif; margin: 10px 0 15px 0; color: #ceafa6; font-size: 22px; font-weight: 600;">Order #${order.orderNumber}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">ORDER DATE</p>
                <p style="margin: 5px 0; color: #2d2d2d; font-weight: 600;">${new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">STATUS</p>
                <p style="margin: 5px 0; color: #ceafa6; font-weight: 600; text-transform: capitalize;">${order.status}</p>
              </div>
            </div>
          </div>
          
          <!-- Items Section -->
          <h3 style="font-family: 'Playfair Display', serif; color: #2d2d2d; font-size: 22px; font-weight: 600; margin: 35px 0 20px 0;">Your Beauty Selection</h3>
          <div style="background: #fafafa; border-radius: 12px; overflow: hidden; border: 1px solid #e8e2dd;">
            ${order.items.map((item, index) => `
              <div style="padding: 20px; ${index > 0 ? 'border-top: 1px solid #e8e2dd;' : ''} display: flex; align-items: center; justify-content: space-between;">
                <div style="flex: 1;">
                  <h4 style="margin: 0 0 5px 0; color: #2d2d2d; font-weight: 600; font-size: 16px;">${item.product.name}</h4>
                  <p style="margin: 0; color: #ceafa6; font-weight: 500; font-size: 14px;">${item.product.brand}</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Quantity: ${item.quantity}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0; color: #2d2d2d; font-weight: 600; font-size: 16px;">$${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            `).join('')}
          </div>
          
          <!-- Order Summary -->
          <div style="background: linear-gradient(135deg, #f8f6f4 0%, #faf8f6 100%); padding: 25px; border-radius: 15px; margin: 30px 0; border: 1px solid #e8e2dd;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 20px 0; color: #2d2d2d; font-size: 20px; font-weight: 600;">Order Summary</h4>
            <div style="space-y: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px;">
                <span style="color: #666; font-weight: 500;">Subtotal:</span>
                <span style="color: #2d2d2d; font-weight: 600;">$${order.subtotal.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px;">
                <span style="color: #666; font-weight: 500;">Tax:</span>
                <span style="color: #2d2d2d; font-weight: 600;">$${order.tax.amount.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px;">
                <span style="color: #666; font-weight: 500;">Shipping:</span>
                <span style="color: #2d2d2d; font-weight: 600;">${order.shipping.cost > 0 ? '$' + order.shipping.cost.toFixed(2) : 'Free'}</span>
              </div>
              <div style="border-top: 2px solid #ceafa6; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #2d2d2d; font-weight: 700; font-size: 20px;">Total:</span>
                  <span style="color: #ceafa6; font-weight: 700; font-size: 24px;">$${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Shipping Address -->
          <div style="background: white; padding: 25px; border-radius: 15px; margin: 25px 0; border: 2px solid #f0ebe6;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 15px 0; color: #2d2d2d; font-size: 18px; font-weight: 600;">💝 Shipping To:</h4>
            <div style="color: #4a4a4a; line-height: 1.6;">
              <p style="margin: 5px 0; font-weight: 600;">${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
              <p style="margin: 5px 0;">${order.shippingAddress.street}</p>
              <p style="margin: 5px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
              <p style="margin: 5px 0;">${order.shippingAddress.country}</p>
            </div>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${frontendUrl}/orders/${order._id}" style="background: linear-gradient(135deg, #ceafa6 0%, #d4b8a8 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(206, 175, 166, 0.3); transition: all 0.3s ease;">✨ Track Your Order ✨</a>
          </div>
          
          <!-- Support Info -->
          <div style="background: #f8f6f4; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
              Questions about your order? We're here to help!<br>
              Contact us at <a href="mailto:${process.env.CONTACT_EMAIL || 'support@cosmeticshop.com'}" style="color: #ceafa6; text-decoration: none; font-weight: 600;">${process.env.CONTACT_EMAIL || 'support@cosmeticshop.com'}</a>
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #2d2d2d; padding: 30px; text-align: center;">
          <p style="color: #ceafa6; font-size: 18px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif; font-weight: 600;">${appName}</p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} ${appName}. Enhancing natural beauty with premium cosmetics.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  generateProductAvailabilityTemplate(product, user) {
    const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #ceafa6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${process.env.APP_NAME || 'Cosmetic Shop'}</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">Great News! Your Favorite Product is Back!</h2>
          
          <p>Hi ${user.firstName || user.name},</p>
          <p>The product you've been waiting for is now available:</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            ${primaryImage ? `
              <img src="${primaryImage.url}" alt="${product.name}" 
                   style="max-width: 200px; height: auto; border-radius: 8px; margin-bottom: 15px;">
            ` : ''}
            <h3 style="margin: 10px 0; color: #ceafa6;">${product.name}</h3>
            <p style="color: #666; margin: 5px 0;">${product.brand}</p>
            <p style="margin: 10px 0;">${product.shortDescription || product.description?.substring(0, 100) + '...'}</p>
            <h4 style="color: #333; margin: 15px 0;">
              ${product.originalPrice ? `
                <span style="text-decoration: line-through; color: #999;">$${product.originalPrice}</span>
                <span style="color: #e74c3c; margin-left: 10px;">$${product.price}</span>
              ` : `$${product.price}`}
            </h4>
            <p style="color: #27ae60; font-weight: bold;">✓ In Stock - ${product.inventory?.quantity} available</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/products/${product._id}" 
               style="background-color: #ceafa6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
              View Product
            </a>
            <a href="${process.env.FRONTEND_URL}/products/${product._id}?action=add-to-cart" 
               style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Add to Cart
            </a>
          </div>

          <p>Don't wait too long - popular items sell out quickly!</p>
          
          <p>Best regards,<br>The ${process.env.APP_NAME || 'Cosmetic Shop'} Team</p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>You received this email because you requested to be notified when this product becomes available.</p>
          <p><a href="${process.env.FRONTEND_URL}/unsubscribe?email=${user.email}" style="color: #666;">Unsubscribe from product notifications</a></p>
        </div>
      </div>
    `;
  }

  generateOrderStatusUpdateTemplate(order, user, newStatus) {
    const statusMessages = {
      'confirmed': 'Your order has been confirmed and is being prepared.',
      'processing': 'Your order is currently being processed.',
      'shipped': 'Great news! Your order has been shipped.',
      'delivered': 'Your order has been delivered successfully.',
      'cancelled': 'Your order has been cancelled.'
    };

    const statusColors = {
      'confirmed': '#3498db',
      'processing': '#f39c12',
      'shipped': '#9b59b6',
      'delivered': '#27ae60',
      'cancelled': '#e74c3c'
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: ${statusColors[newStatus] || '#ceafa6'}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${process.env.APP_NAME || 'Cosmetic Shop'}</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">Order Status Update</h2>
          
          <p>Hi ${user.firstName || user.name},</p>
          <p>We have an update on your order:</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ceafa6;">Order #${order.orderNumber}</h3>
            <p style="font-size: 18px; color: ${statusColors[newStatus] || '#ceafa6'}; font-weight: bold;">
              Status: ${newStatus.toUpperCase()}
            </p>
            <p>${statusMessages[newStatus] || 'Your order status has been updated.'}</p>
          </div>

          ${newStatus === 'shipped' && order.trackingNumber ? `
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #27ae60;">Tracking Information</h3>
              <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
              <p><strong>Carrier:</strong> ${order.carrier || 'Standard Shipping'}</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}" 
               style="background-color: #ceafa6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Order Details
            </a>
          </div>

          <p>If you have any questions, please contact us at ${process.env.CONTACT_EMAIL || process.env.SMTP_USER}</p>
          
          <p>Best regards,<br>The ${process.env.APP_NAME || 'Cosmetic Shop'} Team</p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `;
  }

  generateWelcomeTemplate(user) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #ceafa6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to ${process.env.APP_NAME || 'Cosmetic Shop'}!</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome aboard, ${user.firstName || user.name}!</h2>
          
          <p>We're thrilled to have you join our beauty community. Get ready to discover amazing cosmetic products that will enhance your natural beauty.</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ceafa6;">What's Next?</h3>
            <ul style="color: #333; line-height: 1.6;">
              <li>Browse our curated collection of premium cosmetics</li>
              <li>Create your wishlist for future purchases</li>
              <li>Get notified when your favorite products are back in stock</li>
              <li>Enjoy exclusive member discounts and early access to new products</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/products" 
               style="background-color: #ceafa6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
              Start Shopping
            </a>
            <a href="${process.env.FRONTEND_URL}/profile" 
               style="background-color: #333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Complete Your Profile
            </a>
          </div>

          <p>If you have any questions, our customer service team is here to help at ${process.env.CONTACT_EMAIL || process.env.SMTP_USER}</p>
          
          <p>Happy shopping!<br>The ${process.env.APP_NAME || 'Cosmetic Shop'} Team</p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Cosmetic Shop'}. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  generatePasswordResetTemplate(user, resetUrl) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #ceafa6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${process.env.APP_NAME || 'Cosmetic Shop'}</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p>Hi ${user.firstName || user.name},</p>
          <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>Security Notice:</strong> This reset link will expire in 1 hour for your security.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #ceafa6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Your Password
            </a>
          </div>

          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>

          <p>If you continue to have problems, please contact us at ${process.env.CONTACT_EMAIL || process.env.SMTP_USER}</p>
          
          <p>Best regards,<br>The ${process.env.APP_NAME || 'Cosmetic Shop'} Team</p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `;
  }

  // Delivery instructions email template
  getDeliveryInstructionsTemplate(order, user) {
    const appName = process.env.APP_NAME || 'Cosmetic Shop';
    const recipientName = (user && (user.name || user.firstName)) || order.customer.name;
    const address = order.shippingAddress || {};
    const hasTracking = !!(order.tracking && order.tracking.trackingNumber);
    const estimatedDelivery = order.shipping && order.shipping.estimatedDelivery
      ? new Date(order.shipping.estimatedDelivery)
      : null;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Delivery Instructions - ${appName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        </style>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #2d2d2d; max-width: 650px; margin: 0 auto; padding: 0; background: #faf9f7;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ceafa6 0%, #d4b8a8 50%, #e2c4b8 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;"></div>
          <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${appName}</h1>
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.95;">📦 Your Order is On Its Way</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-family: 'Playfair Display', serif; color: #2d2d2d; margin: 0; font-size: 28px; font-weight: 600;">Delivery Instructions</h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); margin: 15px auto; border-radius: 2px;"></div>
          </div>

          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 25px;">Hi <strong style="color: #ceafa6;">${recipientName}</strong>,</p>
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 30px;">Great news! Your order is being prepared for delivery. Here's everything you need to know about receiving your package.</p>

          <!-- Order Info Card -->
          <div style="background: linear-gradient(135deg, #f8f6f4 0%, #faf8f6 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #e8e2dd; position: relative;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); border-radius: 15px 15px 0 0;"></div>
            <h3 style="font-family: 'Playfair Display', serif; margin: 10px 0 15px 0; color: #ceafa6; font-size: 22px; font-weight: 600;">Order #${order.orderNumber}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">STATUS</p>
                <p style="margin: 5px 0; color: #2d2d2d; font-weight: 600; text-transform: capitalize;">${order.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">ESTIMATED DELIVERY</p>
                <p style="margin: 5px 0; color: #2d2d2d; font-weight: 600;">${estimatedDelivery ? estimatedDelivery.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'To be confirmed'}</p>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="background: linear-gradient(135deg, #f8f6f4 0%, #faf8f6 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #e8e2dd;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 12px 0; color: #2d2d2d; font-size: 18px; font-weight: 600;">Delivering To</h4>
            <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.7;">
              ${address.street || ''}<br>
              ${address.city || ''}${address.state ? `, ${address.state}` : ''} ${address.zipCode || ''}<br>
              ${address.country || ''}
            </p>
          </div>

          ${hasTracking ? `
          <!-- Tracking -->
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #4a4a4a; font-size: 15px; margin-bottom: 15px;">Carrier: <strong>${order.tracking.carrier || ''}</strong> &nbsp;·&nbsp; Tracking #: <strong>${order.tracking.trackingNumber}</strong></p>
            ${order.tracking.trackingUrl ? `
            <a href="${order.tracking.trackingUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);">Track Your Package</a>
            ` : ''}
          </div>
          ` : ''}

          <!-- Delivery Tips -->
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; color: #856404; font-size: 14px; font-weight: 600;">Before your package arrives:</p>
            <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.8;">
              <li>Please make sure someone is available to receive the package, or provide delivery instructions to the courier if you won't be home.</li>
              <li>Double-check that your shipping address above is correct — contact us right away if it needs to change.</li>
              <li>Inspect your package upon arrival and let us know immediately if anything looks damaged.</li>
            </ul>
          </div>

          <!-- Support Info -->
          <div style="background: #f8f6f4; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
              Questions about your delivery? We're here to help!<br>
              Contact us at <a href="mailto:${process.env.CONTACT_EMAIL || 'support@cosmeticshop.com'}" style="color: #ceafa6; text-decoration: none; font-weight: 600;">${process.env.CONTACT_EMAIL || 'support@cosmeticshop.com'}</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2d2d2d; padding: 30px; text-align: center;">
          <p style="color: #ceafa6; font-size: 18px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif; font-weight: 600;">${appName}</p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${appName}. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getPaymentRequestTemplate(order) {
    const appName = process.env.APP_NAME || 'Cosmetic Shop';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Required - ${appName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        </style>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #2d2d2d; max-width: 650px; margin: 0 auto; padding: 0; background: #faf9f7;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ceafa6 0%, #d4b8a8 50%, #e2c4b8 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;"></div>
          <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${appName}</h1>
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.95;">💳 Complete Your Payment</p>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-family: 'Playfair Display', serif; color: #2d2d2d; margin: 0; font-size: 28px; font-weight: 600;">Payment Required</h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 25px;">Hi <strong style="color: #ceafa6;">${order.customer.name}</strong>,</p>
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 30px;">Your order is ready for payment! Please complete your payment to proceed with processing your beautiful cosmetics order.</p>
          
          <!-- Order Info Card -->
          <div style="background: linear-gradient(135deg, #f8f6f4 0%, #faf8f6 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #e8e2dd; position: relative;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); border-radius: 15px 15px 0 0;"></div>
            <h3 style="font-family: 'Playfair Display', serif; margin: 10px 0 15px 0; color: #ceafa6; font-size: 22px; font-weight: 600;">Order #${order.orderNumber}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">ORDER DATE</p>
                <p style="margin: 5px 0; color: #2d2d2d; font-weight: 600;">${new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">TOTAL AMOUNT</p>
                <p style="margin: 5px 0; color: #ceafa6; font-weight: 700; font-size: 20px;">€${order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <!-- Payment Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${order.payment.paymentUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; font-size: 18px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3); transition: all 0.3s ease;">💳 Pay Now (Sandbox)</a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px; text-align: center;">
              <strong>⚠️ Test Mode:</strong> This is a sandbox payment. Use test card: 4242 4242 4242 4242
            </p>
          </div>
          
          <!-- Order Summary -->
          <div style="background: linear-gradient(135deg, #f8f6f4 0%, #faf8f6 100%); padding: 25px; border-radius: 15px; margin: 30px 0; border: 1px solid #e8e2dd;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 20px 0; color: #2d2d2d; font-size: 20px; font-weight: 600;">Order Summary</h4>
            <div style="space-y: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px;">
                <span style="color: #666; font-weight: 500;">Subtotal:</span>
                <span style="color: #2d2d2d; font-weight: 600;">€${order.subtotal.toFixed(2)}</span>
              </div>
              ${order.tax.amount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px;">
                <span style="color: #666; font-weight: 500;">Tax:</span>
                <span style="color: #2d2d2d; font-weight: 600;">€${order.tax.amount.toFixed(2)}</span>
              </div>
              ` : ''}
              ${order.shipping.cost > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px;">
                <span style="color: #666; font-weight: 500;">Shipping:</span>
                <span style="color: #2d2d2d; font-weight: 600;">€${order.shipping.cost.toFixed(2)}</span>
              </div>
              ` : ''}
              <div style="border-top: 2px solid #ceafa6; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #2d2d2d; font-weight: 700; font-size: 20px;">Total:</span>
                  <span style="color: #ceafa6; font-weight: 700; font-size: 24px;">€${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Support Info -->
          <div style="background: #f8f6f4; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
              Questions about payment? We're here to help!<br>
              Contact us at <a href="mailto:${process.env.CONTACT_EMAIL || 'support@cosmeticshop.com'}" style="color: #ceafa6; text-decoration: none; font-weight: 600;">${process.env.CONTACT_EMAIL || 'support@cosmeticshop.com'}</a>
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #2d2d2d; padding: 30px; text-align: center;">
          <p style="color: #ceafa6; font-size: 18px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif; font-weight: 600;">${appName}</p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${appName}. Secure payments powered by Stripe.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  // Payment confirmation email template
  getPaymentConfirmationTemplate(order) {
    const appName = process.env.APP_NAME || 'Cosmetic Shop';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmed - ${appName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        </style>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #2d2d2d; max-width: 650px; margin: 0 auto; padding: 0; background: #faf9f7;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;"></div>
          <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${appName}</h1>
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.95;">✅ Payment Successful!</p>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
            <h2 style="font-family: 'Playfair Display', serif; color: #2d2d2d; margin: 0; font-size: 28px; font-weight: 600;">Payment Confirmed!</h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #10b981, #059669); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 25px;">Hi <strong style="color: #10b981;">${order.customer.name}</strong>,</p>
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 30px;">Great news! Your payment has been successfully processed. We're now preparing your order for shipment.</p>
          
          <!-- Success Card -->
          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #bbf7d0; position: relative;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #10b981, #059669); border-radius: 15px 15px 0 0;"></div>
            <h3 style="font-family: 'Playfair Display', serif; margin: 10px 0 15px 0; color: #10b981; font-size: 22px; font-weight: 600;">Order #${order.orderNumber}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">PAYMENT DATE</p>
                <p style="margin: 5px 0; color: #2d2d2d; font-weight: 600;">${new Date(order.payment.paidAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">AMOUNT PAID</p>
                <p style="margin: 5px 0; color: #10b981; font-weight: 700; font-size: 20px;">€${order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <!-- Next Steps -->
          <div style="background: #f8f6f4; padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #e8e2dd;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 15px 0; color: #2d2d2d; font-size: 18px; font-weight: 600;">📋 What's Next?</h4>
            <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; line-height: 1.8;">
              <li>Your order is now confirmed and being prepared</li>
              <li>You'll receive a shipping notification with tracking details</li>
              <li>Expected delivery: ${order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString() : '3-7 business days'}</li>
            </ul>
          </div>
          
          <!-- Track Order Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${frontendUrl}/orders/${order._id}" style="background: linear-gradient(135deg, #ceafa6 0%, #d4b8a8 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(206, 175, 166, 0.3); transition: all 0.3s ease;">📱 Track Your Order</a>
          </div>
          
          <!-- Support Info -->
          <div style="background: #f8f6f4; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
              Questions about your order? We're here to help!<br>
              Contact us at <a href="mailto:${process.env.CONTACT_EMAIL || 'support@cosmeticshop.com'}" style="color: #ceafa6; text-decoration: none; font-weight: 600;">${process.env.CONTACT_EMAIL || 'support@cosmeticshop.com'}</a>
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #2d2d2d; padding: 30px; text-align: center;">
          <p style="color: #ceafa6; font-size: 18px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif; font-weight: 600;">${appName}</p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${appName}. Thank you for your purchase!
          </p>
        </div>
      </body>
      </html>
    `;
  }

  // Payment failed email template
  getPaymentFailedTemplate(order) {
    const appName = process.env.APP_NAME || 'Cosmetic Shop';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed - ${appName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        </style>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #2d2d2d; max-width: 650px; margin: 0 auto; padding: 0; background: #faf9f7;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;"></div>
          <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${appName}</h1>
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.95;">❌ Payment Issue</p>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 15px;">😔</div>
            <h2 style="font-family: 'Playfair Display', serif; color: #2d2d2d; margin: 0; font-size: 28px; font-weight: 600;">Payment Failed</h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #ef4444, #dc2626); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 25px;">Hi <strong style="color: #ef4444;">${order.customer.name}</strong>,</p>
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 30px;">Unfortunately, we couldn't process your payment for order #${order.orderNumber}. Don't worry - your order is still reserved and you can try again.</p>
          
          <!-- Error Card -->
          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fef2f2 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #fecaca; position: relative;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #ef4444, #dc2626); border-radius: 15px 15px 0 0;"></div>
            <h3 style="font-family: 'Playfair Display', serif; margin: 10px 0 15px 0; color: #ef4444; font-size: 22px; font-weight: 600;">Order #${order.orderNumber}</h3>
            <p style="margin: 10px 0; color: #666; font-size: 14px;">
              <strong>Common reasons for payment failure:</strong><br>
              • Insufficient funds<br>
              • Incorrect card details<br>
              • Card expired<br>
              • Bank security restrictions
            </p>
          </div>
          
          <!-- Retry Payment Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${frontendUrl}/orders/${order._id}" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3); transition: all 0.3s ease;">🔄 Try Payment Again</a>
          </div>
          
          <!-- Help Section -->
          <div style="background: #f8f6f4; padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #e8e2dd;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 15px 0; color: #2d2d2d; font-size: 18px; font-weight: 600;">💡 Need Help?</h4>
            <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; line-height: 1.8;">
              <li>Check your card details and try again</li>
              <li>Contact your bank if the issue persists</li>
              <li>Try a different payment method</li>
              <li>Contact our support team for assistance</li>
            </ul>
          </div>
          
          <!-- Support Info -->
          <div style="background: #f8f6f4; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
              Need assistance with payment? We're here to help!<br>
              Contact us at <a href="mailto:${process.env.CONTACT_EMAIL || 'support@cosmeticshop.com'}" style="color: #ceafa6; text-decoration: none; font-weight: 600;">${process.env.CONTACT_EMAIL || 'support@cosmeticshop.com'}</a>
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #2d2d2d; padding: 30px; text-align: center;">
          <p style="color: #ceafa6; font-size: 18px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif; font-weight: 600;">${appName}</p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${appName}. Secure payments powered by Stripe.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getNewsletterTemplate(subject, message, user) {
    const appName = process.env.APP_NAME || 'Cosmetic Shop';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const recipientName = (user && (user.name || user.firstName)) || 'there';

    // Message comes from the admin newsletter form as plain text - preserve
    // line breaks but don't attempt to render arbitrary HTML from it.
    const escapeHtml = (str) => String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const messageHtml = escapeHtml(message || '').replace(/\n/g, '<br>');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject} - ${appName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        </style>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #2d2d2d; max-width: 650px; margin: 0 auto; padding: 0; background: #faf9f7;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ceafa6 0%, #d4b8a8 50%, #e2c4b8 100%); padding: 40px 30px; text-align: center;">
          <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${appName}</h1>
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.95;">✨ Newsletter ✨</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-family: 'Playfair Display', serif; color: #2d2d2d; margin: 0; font-size: 26px; font-weight: 600;">${escapeHtml(subject)}</h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); margin: 15px auto; border-radius: 2px;"></div>
          </div>

          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 20px;">Hi <strong style="color: #ceafa6;">${recipientName}</strong>,</p>
          <p style="font-size: 16px; color: #4a4a4a; line-height: 1.8;">${messageHtml}</p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${frontendUrl}/products" style="background: linear-gradient(135deg, #ceafa6 0%, #d4b8a8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(206, 175, 166, 0.3);">Shop Now</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2d2d2d; padding: 30px; text-align: center;">
          <p style="color: #ceafa6; font-size: 18px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif; font-weight: 600;">${appName}</p>
          <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">
            © ${new Date().getFullYear()} ${appName}. Enhancing natural beauty with premium cosmetics.
          </p>
          <p style="margin: 0;"><a href="${frontendUrl}/unsubscribe?email=${encodeURIComponent(user.email)}" style="color: #999; font-size: 12px;">Unsubscribe from the newsletter</a></p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
