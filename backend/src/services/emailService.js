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
          return { 
            success: false, 
            error: `Both SMTP failed. Primary: ${error.message}, Backup: ${backupError.message}`,
            code: 'BOTH_SMTP_FAILED'
          };
        }
      }
      
      // Return primary error if no backup
      return { 
        success: false, 
        error: error.message || 'Unknown email error',
        code: error.code || 'EMAIL_ERROR'
      };
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
      subject: `Delivery Instructions - Order #${order.orderNumber} - ${process.env.APP_NAME || 'Cosmetic Shop'}`,
      html: this.generateDeliveryInstructionsTemplate(order, user)
    };

    return await this.sendEmail(mailOptions);
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

  generateDeliveryInstructionsTemplate(order, user) {
    const appName = process.env.APP_NAME || 'Cosmetic Shop';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Delivery Instructions</title>
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
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.95;">🚚 Your order is being prepared for delivery! 🚚</p>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-family: 'Playfair Display', serif; color: #2d2d2d; margin: 0; font-size: 28px; font-weight: 600;">Delivery Instructions</h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 25px;">Hi <strong style="color: #ceafa6;">${user.firstName || user.name || 'Beautiful'}</strong>,</p>
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 30px;">Great news! Your order has been confirmed and our team is carefully preparing your beauty products for delivery. Here's what you need to know:</p>
          
          <!-- Order Info Card -->
          <div style="background: linear-gradient(135deg, #f8f6f4 0%, #faf8f6 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #e8e2dd; position: relative;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); border-radius: 15px 15px 0 0;"></div>
            <h3 style="font-family: 'Playfair Display', serif; margin: 10px 0 15px 0; color: #ceafa6; font-size: 22px; font-weight: 600;">Order #${order.orderNumber}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">CURRENT STATUS</p>
                <p style="margin: 5px 0; color: #ceafa6; font-weight: 600; text-transform: capitalize;">${order.status}</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">ESTIMATED DELIVERY</p>
                <p style="margin: 5px 0; color: #2d2d2d; font-weight: 600;">3-5 Business Days</p>
              </div>
            </div>
          </div>
          
          <!-- Delivery Instructions -->
          <div style="background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #b3d9ff;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 20px 0; color: #2d2d2d; font-size: 20px; font-weight: 600;">📦 Delivery Information</h4>
            <div style="space-y: 15px;">
              <div style="margin-bottom: 15px;">
                <h5 style="margin: 0 0 8px 0; color: #2d2d2d; font-weight: 600; font-size: 16px;">🏠 Delivery Address:</h5>
                <div style="color: #4a4a4a; line-height: 1.6; margin-left: 20px;">
                  <p style="margin: 3px 0;">${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
                  <p style="margin: 3px 0;">${order.shippingAddress.street}</p>
                  <p style="margin: 3px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                  <p style="margin: 3px 0;">${order.shippingAddress.country}</p>
                </div>
              </div>
              
              <div style="margin-bottom: 15px;">
                <h5 style="margin: 0 0 8px 0; color: #2d2d2d; font-weight: 600; font-size: 16px;">⏰ Delivery Window:</h5>
                <p style="margin: 0 0 0 20px; color: #4a4a4a;">Monday - Friday, 9:00 AM - 6:00 PM</p>
              </div>
              
              <div style="margin-bottom: 15px;">
                <h5 style="margin: 0 0 8px 0; color: #2d2d2d; font-weight: 600; font-size: 16px;">📱 Tracking Updates:</h5>
                <p style="margin: 0 0 0 20px; color: #4a4a4a;">You'll receive SMS and email notifications when your package is out for delivery</p>
              </div>
            </div>
          </div>
          
          <!-- Care Instructions -->
          <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #ffb3b3;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 15px 0; color: #2d2d2d; font-size: 18px; font-weight: 600;">💄 Special Care Instructions</h4>
            <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; line-height: 1.8;">
              <li>Your cosmetics will be packaged with protective materials to prevent damage</li>
              <li>Products are temperature-controlled during shipping to maintain quality</li>
              <li>Please inspect your items upon delivery and contact us within 24 hours if there are any issues</li>
              <li>Store products in a cool, dry place away from direct sunlight</li>
            </ul>
          </div>
          
          <!-- What to Expect -->
          <div style="background: white; padding: 25px; border-radius: 15px; margin: 25px 0; border: 2px solid #f0ebe6;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 15px 0; color: #2d2d2d; font-size: 18px; font-weight: 600;">✨ What to Expect</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 15px;">
              <div style="text-align: center;">
                <div style="font-size: 24px; margin-bottom: 8px;">📋</div>
                <h6 style="margin: 0 0 5px 0; color: #ceafa6; font-weight: 600;">Order Confirmed</h6>
                <p style="margin: 0; color: #666; font-size: 14px;">We're preparing your items</p>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; margin-bottom: 8px;">📦</div>
                <h6 style="margin: 0 0 5px 0; color: #ceafa6; font-weight: 600;">Shipped</h6>
                <p style="margin: 0; color: #666; font-size: 14px;">On its way to you</p>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; margin-bottom: 8px;">🏠</div>
                <h6 style="margin: 0 0 5px 0; color: #ceafa6; font-weight: 600;">Delivered</h6>
                <p style="margin: 0; color: #666; font-size: 14px;">Enjoy your beauty products!</p>
              </div>
            </div>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${frontendUrl}/orders/${order._id}" style="background: linear-gradient(135deg, #ceafa6 0%, #d4b8a8 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(206, 175, 166, 0.3); transition: all 0.3s ease;">📱 Track Your Order</a>
          </div>
          
          <!-- Support Info -->
          <div style="background: #f8f6f4; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
              Questions about your delivery? We're here to help!<br>
              Contact us at <a href="mailto:${process.env.CONTACT_EMAIL || 'support@cosmeticshop.com'}" style="color: #ceafa6; text-decoration: none; font-weight: 600;">${process.env.CONTACT_EMAIL || 'support@cosmeticshop.com'}</a><br>
              Or call us at <strong style="color: #ceafa6;">1-800-BEAUTY-1</strong>
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #2d2d2d; padding: 30px; text-align: center;">
          <p style="color: #ceafa6; font-size: 18px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif; font-weight: 600;">${appName}</p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${appName}. Enhancing natural beauty with premium cosmetics.
          </p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
