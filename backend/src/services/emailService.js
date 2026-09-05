const nodemailer = require('nodemailer');
const { dictionaries } = require('../lib/emailTranslations');

// Same RSD formatting as frontend/src/lib/currency.js, duplicated since the
// backend can't import that ES module. No language param - currency stays RSD either way.
const formatRSD = (amount) =>
  `${new Intl.NumberFormat('sr-Latn-RS', { maximumFractionDigits: 0 }).format(amount || 0)} RSD`;

// Locale used for toLocaleDateString() calls in the templates, per language.
const DATE_LOCALES = { sr: 'sr-Latn-RS', en: 'en-US' };

// Checks each source (e.g. a `user` doc, an order's populated `user`) in
// order for a saved language, falling back to Serbian.
function resolveLanguage(...sources) {
  for (const source of sources) {
    const lang = source?.preferences?.language;
    if (lang === 'en' || lang === 'sr') return lang;
  }
  return 'sr';
}

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
    const language = resolveLanguage(user);
    const T = dictionaries[language];
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: user.email,
      subject: T.subjects.orderConfirmation(process.env.APP_NAME || 'SveVišnja Kozmetika'),
      html: this.generateOrderConfirmationTemplate(order, user, language)
    };

    return await this.sendEmail(mailOptions);
  }

  // Product availability notification
  async sendProductAvailabilityNotification(product, users) {
    const promises = users.map(user => {
      const language = resolveLanguage(user);
      const T = dictionaries[language];
      const mailOptions = {
        from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
        to: user.email,
        subject: T.subjects.productAvailability(product.name, process.env.APP_NAME || 'SveVišnja Kozmetika'),
        html: this.generateProductAvailabilityTemplate(product, user, language)
      };
      return this.sendEmail(mailOptions);
    });

    return await Promise.allSettled(promises);
  }

  // Order status update email
  async sendOrderStatusUpdate(order, user, newStatus) {
    const language = resolveLanguage(user);
    const T = dictionaries[language];
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: user.email,
      subject: T.subjects.orderStatusUpdate(order.orderNumber, process.env.APP_NAME || 'SveVišnja Kozmetika'),
      html: this.generateOrderStatusUpdateTemplate(order, user, newStatus, language)
    };

    return await this.sendEmail(mailOptions);
  }

  // Welcome email for new users
  async sendWelcomeEmail(user) {
    const language = resolveLanguage(user);
    const T = dictionaries[language];
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: user.email,
      subject: T.subjects.welcome(process.env.APP_NAME || 'SveVišnja Kozmetika'),
      html: this.generateWelcomeTemplate(user, language)
    };

    return await this.sendEmail(mailOptions);
  }

  // Password reset email
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const language = resolveLanguage(user);
    const T = dictionaries[language];

    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: user.email,
      subject: T.subjects.passwordReset(process.env.APP_NAME || 'SveVišnja Kozmetika'),
      html: this.generatePasswordResetTemplate(user, resetUrl, language)
    };

    return await this.sendEmail(mailOptions);
  }

  // Delivery instructions email
  async sendDeliveryInstructions(order, user) {
    const language = resolveLanguage(user, order.user);
    const T = dictionaries[language];
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: user.email,
      subject: T.subjects.deliveryInstructions(order.orderNumber),
      html: this.getDeliveryInstructionsTemplate(order, user, language)
    };

    return this.sendEmail(mailOptions);
  }

  // Payment request email
  async sendPaymentRequestEmail(order) {
    const language = resolveLanguage(order.user);
    const T = dictionaries[language];
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: order.customer.email,
      subject: T.subjects.paymentRequest(order.orderNumber),
      html: this.getPaymentRequestTemplate(order, language)
    };

    return this.sendEmail(mailOptions);
  }

  // Payment confirmation email
  async sendPaymentConfirmationEmail(order) {
    const language = resolveLanguage(order.user);
    const T = dictionaries[language];
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: order.customer.email,
      subject: T.subjects.paymentConfirmation(order.orderNumber),
      html: this.getPaymentConfirmationTemplate(order, language)
    };

    return this.sendEmail(mailOptions);
  }

  // Payment failed email
  async sendPaymentFailedEmail(order) {
    const language = resolveLanguage(order.user);
    const T = dictionaries[language];
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: order.customer.email,
      subject: T.subjects.paymentFailed(order.orderNumber),
      html: this.getPaymentFailedTemplate(order, language)
    };

    return this.sendEmail(mailOptions);
  }

  // Newsletter email to a single subscriber
  async sendNewsletterEmail(user, { subject, message }) {
    const language = resolveLanguage(user);
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.SENDPULSE_USER,
      to: user.email,
      subject: `${subject} - ${process.env.APP_NAME || 'SveVišnja Kozmetika'}`,
      html: this.getNewsletterTemplate(subject, message, user, language)
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
  generateOrderConfirmationTemplate(order, user, language = 'sr') {
    const T = dictionaries[language];
    const appName = process.env.APP_NAME || 'SveVišnja Kozmetika';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const greetName = user.firstName || user.name || '';
    const statusLabel = T.orderStatusLabels[order.status] || order.status;

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${T.orderConfirmation.pageTitle}</title>
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
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.95;">${T.orderConfirmation.headerTagline}</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-family: 'Playfair Display', serif; color: #2d2d2d; margin: 0; font-size: 28px; font-weight: 600;">${T.orderConfirmation.heading}</h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); margin: 15px auto; border-radius: 2px;"></div>
          </div>

          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 25px;">${T.common.greeting()}${greetName ? ` <strong style="color: #ceafa6;">${greetName}</strong>` : ''},</p>
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 30px;">${T.orderConfirmation.intro}</p>

          <!-- Order Info Card -->
          <div style="background: linear-gradient(135deg, #f8f6f4 0%, #faf8f6 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #e8e2dd; position: relative;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); border-radius: 15px 15px 0 0;"></div>
            <h3 style="font-family: 'Playfair Display', serif; margin: 10px 0 15px 0; color: #ceafa6; font-size: 22px; font-weight: 600;">${T.common.orderCardTitle(order.orderNumber)}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">${T.orderConfirmation.dateLabel}</p>
                <p style="margin: 5px 0; color: #2d2d2d; font-weight: 600;">${new Date(order.createdAt).toLocaleDateString(DATE_LOCALES[language], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">${T.orderConfirmation.statusLabel}</p>
                <p style="margin: 5px 0; color: #ceafa6; font-weight: 600;">${statusLabel}</p>
              </div>
            </div>
          </div>

          <!-- Items Section -->
          <h3 style="font-family: 'Playfair Display', serif; color: #2d2d2d; font-size: 22px; font-weight: 600; margin: 35px 0 20px 0;">${T.orderConfirmation.itemsHeading}</h3>
          <div style="background: #fafafa; border-radius: 12px; overflow: hidden; border: 1px solid #e8e2dd;">
            ${order.items.map((item, index) => `
              <div style="padding: 20px; ${index > 0 ? 'border-top: 1px solid #e8e2dd;' : ''} display: flex; align-items: center; justify-content: space-between;">
                <div style="flex: 1;">
                  <h4 style="margin: 0 0 5px 0; color: #2d2d2d; font-weight: 600; font-size: 16px;">${item.productSnapshot?.name || T.orderConfirmation.productFallback}</h4>
                  <p style="margin: 0; color: #ceafa6; font-weight: 500; font-size: 14px;">${item.productSnapshot?.brand || ''}</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${T.orderConfirmation.quantityLabel(item.quantity)}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0; color: #2d2d2d; font-weight: 600; font-size: 16px;">${formatRSD(item.price * item.quantity)}</p>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Order Summary -->
          <div style="background: linear-gradient(135deg, #f8f6f4 0%, #faf8f6 100%); padding: 25px; border-radius: 15px; margin: 30px 0; border: 1px solid #e8e2dd;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 20px 0; color: #2d2d2d; font-size: 20px; font-weight: 600;">${T.orderConfirmation.summaryHeading}</h4>
            <div style="space-y: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px;">
                <span style="color: #666; font-weight: 500;">${T.common.subtotalLabel}</span>
                <span style="color: #2d2d2d; font-weight: 600;">${formatRSD(order.subtotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px;">
                <span style="color: #666; font-weight: 500;">${T.common.taxLabel}</span>
                <span style="color: #2d2d2d; font-weight: 600;">${formatRSD(order.tax.amount)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px;">
                <span style="color: #666; font-weight: 500;">${T.common.shippingLabel}</span>
                <span style="color: #2d2d2d; font-weight: 600;">${order.shipping.cost > 0 ? formatRSD(order.shipping.cost) : T.orderConfirmation.freeShipping}</span>
              </div>
              <div style="border-top: 2px solid #ceafa6; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #2d2d2d; font-weight: 700; font-size: 20px;">${T.common.totalLabel}</span>
                  <span style="color: #ceafa6; font-weight: 700; font-size: 24px;">${formatRSD(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="background: white; padding: 25px; border-radius: 15px; margin: 25px 0; border: 2px solid #f0ebe6;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 15px 0; color: #2d2d2d; font-size: 18px; font-weight: 600;">${T.orderConfirmation.shippingAddressHeading}</h4>
            <div style="color: #4a4a4a; line-height: 1.6;">
              <p style="margin: 5px 0; font-weight: 600;">${order.customer?.name || ''}</p>
              <p style="margin: 5px 0;">${order.shippingAddress.street}</p>
              <p style="margin: 5px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
              <p style="margin: 5px 0;">${order.shippingAddress.country}</p>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${frontendUrl}/orders/${order._id}" style="background: linear-gradient(135deg, #ceafa6 0%, #d4b8a8 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(206, 175, 166, 0.3); transition: all 0.3s ease;">${T.orderConfirmation.trackOrderCta}</a>
          </div>

          <!-- Support Info -->
          <div style="background: #f8f6f4; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
              ${T.common.contactIntro('porudžbini')}<br>
              ${T.common.contactPrefix} <a href="mailto:${process.env.CONTACT_EMAIL || 'angelina.kondic997@gmail.com'}" style="color: #ceafa6; text-decoration: none; font-weight: 600;">${process.env.CONTACT_EMAIL || 'angelina.kondic997@gmail.com'}</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2d2d2d; padding: 30px; text-align: center;">
          <p style="color: #ceafa6; font-size: 18px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif; font-weight: 600;">${appName}</p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} ${appName}. ${T.orderConfirmation.footerTagline}
          </p>
        </div>
      </body>
      </html>
    `;
  }

  generateProductAvailabilityTemplate(product, user, language = 'sr') {
    const T = dictionaries[language];
    const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
    const greetName = user.firstName || user.name || '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #ceafa6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${process.env.APP_NAME || 'SveVišnja Kozmetika'}</h1>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">${T.productAvailability.heading}</h2>

          <p>${T.common.greeting()}${greetName ? ` ${greetName}` : ''},</p>
          <p>${T.productAvailability.intro}</p>

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
                <span style="text-decoration: line-through; color: #999;">${formatRSD(product.originalPrice)}</span>
                <span style="color: #e74c3c; margin-left: 10px;">${formatRSD(product.price)}</span>
              ` : formatRSD(product.price)}
            </h4>
            <p style="color: #27ae60; font-weight: bold;">${T.productAvailability.inStock(product.inventory?.quantity)}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/products/${product._id}"
               style="background-color: #ceafa6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
              ${T.productAvailability.viewProductCta}
            </a>
            <a href="${process.env.FRONTEND_URL}/products/${product._id}?action=add-to-cart"
               style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              ${T.productAvailability.addToCartCta}
            </a>
          </div>

          <p>${T.productAvailability.urgency}</p>

          <p>${T.common.signOff(process.env.APP_NAME || 'SveVišnja Kozmetika')}</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>${T.productAvailability.footerNotice}</p>
          <p><a href="${process.env.FRONTEND_URL}/unsubscribe?email=${user.email}" style="color: #666;">${T.productAvailability.unsubscribeCta}</a></p>
        </div>
      </div>
    `;
  }

  generateOrderStatusUpdateTemplate(order, user, newStatus, language = 'sr') {
    const T = dictionaries[language];
    const statusMessages = T.orderStatusUpdate.statusMessages;

    const statusColors = {
      'confirmed': '#3498db',
      'processing': '#f39c12',
      'shipped': '#9b59b6',
      'delivered': '#27ae60',
      'cancelled': '#e74c3c'
    };

    const greetName = user.firstName || user.name || '';
    const statusLabel = T.orderStatusLabels[newStatus] || newStatus;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: ${statusColors[newStatus] || '#ceafa6'}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${process.env.APP_NAME || 'SveVišnja Kozmetika'}</h1>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">${T.orderStatusUpdate.heading}</h2>

          <p>${T.common.greeting()}${greetName ? ` ${greetName}` : ''},</p>
          <p>${T.orderStatusUpdate.intro}</p>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ceafa6;">${T.common.orderCardTitle(order.orderNumber)}</h3>
            <p style="font-size: 18px; color: ${statusColors[newStatus] || '#ceafa6'}; font-weight: bold;">
              ${T.orderStatusUpdate.statusLine(statusLabel)}
            </p>
            <p>${statusMessages[newStatus] || T.orderStatusUpdate.statusMessageFallback}</p>
          </div>

          ${newStatus === 'shipped' && order.trackingNumber ? `
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #27ae60;">${T.orderStatusUpdate.trackingHeading}</h3>
              <p><strong>${T.orderStatusUpdate.trackingNumberLabel}</strong> ${order.trackingNumber}</p>
              <p><strong>${T.orderStatusUpdate.carrierLabel}</strong> ${order.carrier || T.orderStatusUpdate.carrierFallback}</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}"
               style="background-color: #ceafa6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              ${T.orderStatusUpdate.viewOrderCta}
            </a>
          </div>

          <p>${T.orderStatusUpdate.contactLine(process.env.CONTACT_EMAIL || process.env.SMTP_USER)}</p>

          <p>${T.common.signOff(process.env.APP_NAME || 'SveVišnja Kozmetika')}</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>${T.common.automatedNotice}</p>
        </div>
      </div>
    `;
  }

  generateWelcomeTemplate(user, language = 'sr') {
    const T = dictionaries[language];
    const greetName = user.firstName || user.name || '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #ceafa6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${T.welcome.headerHeading(process.env.APP_NAME || 'SveVišnja Kozmetika')}</h1>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">${T.welcome.heading(greetName)}</h2>

          <p>${T.welcome.intro}</p>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ceafa6;">${T.welcome.whatsNextHeading}</h3>
            <ul style="color: #333; line-height: 1.6;">
              ${T.welcome.bullets.map(bullet => `<li>${bullet}</li>`).join('\n              ')}
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/products"
               style="background-color: #ceafa6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
              ${T.welcome.startShoppingCta}
            </a>
            <a href="${process.env.FRONTEND_URL}/profile"
               style="background-color: #333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              ${T.welcome.completeProfileCta}
            </a>
          </div>

          <p>${T.welcome.supportLine(process.env.CONTACT_EMAIL || process.env.SMTP_USER)}</p>

          <p>${T.welcome.signOff(process.env.APP_NAME || 'SveVišnja Kozmetika')}</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'SveVišnja Kozmetika'}. ${T.welcome.footerTagline}</p>
        </div>
      </div>
    `;
  }

  generatePasswordResetTemplate(user, resetUrl, language = 'sr') {
    const T = dictionaries[language];
    const greetName = user.firstName || user.name || '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #ceafa6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${process.env.APP_NAME || 'SveVišnja Kozmetika'}</h1>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">${T.passwordReset.heading}</h2>

          <p>${T.common.greeting()}${greetName ? ` ${greetName}` : ''},</p>
          <p>${T.passwordReset.intro}</p>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>${T.passwordReset.securityNoticeLabel}</strong> ${T.passwordReset.securityNoticeText}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #ceafa6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              ${T.passwordReset.resetCta}
            </a>
          </div>

          <p>${T.passwordReset.fallbackLinkIntro}</p>
          <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>

          <p>${T.passwordReset.contactLine(process.env.CONTACT_EMAIL || process.env.SMTP_USER)}</p>

          <p>${T.common.signOff(process.env.APP_NAME || 'SveVišnja Kozmetika')}</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>${T.common.automatedNotice}</p>
        </div>
      </div>
    `;
  }

  // Delivery instructions email template
  getDeliveryInstructionsTemplate(order, user, language = 'sr') {
    const T = dictionaries[language];
    const appName = process.env.APP_NAME || 'SveVišnja Kozmetika';
    const recipientName = (user && (user.name || user.firstName)) || order.customer.name;
    const address = order.shippingAddress || {};
    const hasTracking = !!(order.tracking && order.tracking.trackingNumber);
    const estimatedDelivery = order.shipping && order.shipping.estimatedDelivery
      ? new Date(order.shipping.estimatedDelivery)
      : null;
    const statusLabel = T.orderStatusLabels[order.status] || order.status.replace('_', ' ');

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${T.deliveryInstructions.pageTitle(appName)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        </style>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #2d2d2d; max-width: 650px; margin: 0 auto; padding: 0; background: #faf9f7;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ceafa6 0%, #d4b8a8 50%, #e2c4b8 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;"></div>
          <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${appName}</h1>
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.95;">${T.deliveryInstructions.headerTagline}</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-family: 'Playfair Display', serif; color: #2d2d2d; margin: 0; font-size: 28px; font-weight: 600;">${T.deliveryInstructions.heading}</h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); margin: 15px auto; border-radius: 2px;"></div>
          </div>

          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 25px;">${T.common.greeting()} <strong style="color: #ceafa6;">${recipientName}</strong>,</p>
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 30px;">${T.deliveryInstructions.intro}</p>

          <!-- Order Info Card -->
          <div style="background: linear-gradient(135deg, #f8f6f4 0%, #faf8f6 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #e8e2dd; position: relative;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); border-radius: 15px 15px 0 0;"></div>
            <h3 style="font-family: 'Playfair Display', serif; margin: 10px 0 15px 0; color: #ceafa6; font-size: 22px; font-weight: 600;">${T.common.orderCardTitle(order.orderNumber)}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">${T.deliveryInstructions.statusLabel}</p>
                <p style="margin: 5px 0; color: #2d2d2d; font-weight: 600;">${statusLabel}</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">${T.deliveryInstructions.estimatedDeliveryLabel}</p>
                <p style="margin: 5px 0; color: #2d2d2d; font-weight: 600;">${estimatedDelivery ? estimatedDelivery.toLocaleDateString(DATE_LOCALES[language], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : T.deliveryInstructions.estimatedDeliveryFallback}</p>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="background: linear-gradient(135deg, #f8f6f4 0%, #faf8f6 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #e8e2dd;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 12px 0; color: #2d2d2d; font-size: 18px; font-weight: 600;">${T.deliveryInstructions.addressHeading}</h4>
            <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.7;">
              ${address.street || ''}<br>
              ${address.city || ''}${address.state ? `, ${address.state}` : ''} ${address.zipCode || ''}<br>
              ${address.country || ''}
            </p>
          </div>

          ${hasTracking ? `
          <!-- Tracking -->
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #4a4a4a; font-size: 15px; margin-bottom: 15px;">${T.deliveryInstructions.trackingLine(order.tracking.carrier || '', order.tracking.trackingNumber)}</p>
            ${order.tracking.trackingUrl ? `
            <a href="${order.tracking.trackingUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);">${T.deliveryInstructions.trackPackageCta}</a>
            ` : ''}
          </div>
          ` : ''}

          <!-- Delivery Tips -->
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; color: #856404; font-size: 14px; font-weight: 600;">${T.deliveryInstructions.tipsHeading}</p>
            <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.8;">
              ${T.deliveryInstructions.tips.map(tip => `<li>${tip}</li>`).join('\n              ')}
            </ul>
          </div>

          <!-- Support Info -->
          <div style="background: #f8f6f4; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
              ${T.common.contactIntro('dostavi')}<br>
              ${T.common.contactPrefix} <a href="mailto:${process.env.CONTACT_EMAIL || 'angelina.kondic997@gmail.com'}" style="color: #ceafa6; text-decoration: none; font-weight: 600;">${process.env.CONTACT_EMAIL || 'angelina.kondic997@gmail.com'}</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2d2d2d; padding: 30px; text-align: center;">
          <p style="color: #ceafa6; font-size: 18px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif; font-weight: 600;">${appName}</p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${appName}. ${T.deliveryInstructions.footerTagline}
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getPaymentRequestTemplate(order, language = 'sr') {
    const T = dictionaries[language];
    const appName = process.env.APP_NAME || 'SveVišnja Kozmetika';

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${T.paymentRequest.pageTitle(appName)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        </style>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #2d2d2d; max-width: 650px; margin: 0 auto; padding: 0; background: #faf9f7;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ceafa6 0%, #d4b8a8 50%, #e2c4b8 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;"></div>
          <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${appName}</h1>
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.95;">${T.paymentRequest.headerTagline}</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-family: 'Playfair Display', serif; color: #2d2d2d; margin: 0; font-size: 28px; font-weight: 600;">${T.paymentRequest.heading}</h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); margin: 15px auto; border-radius: 2px;"></div>
          </div>

          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 25px;">${T.common.greeting()} <strong style="color: #ceafa6;">${order.customer.name}</strong>,</p>
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 30px;">${T.paymentRequest.intro}</p>

          <!-- Order Info Card -->
          <div style="background: linear-gradient(135deg, #f8f6f4 0%, #faf8f6 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #e8e2dd; position: relative;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); border-radius: 15px 15px 0 0;"></div>
            <h3 style="font-family: 'Playfair Display', serif; margin: 10px 0 15px 0; color: #ceafa6; font-size: 22px; font-weight: 600;">${T.common.orderCardTitle(order.orderNumber)}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">${T.paymentRequest.dateLabel}</p>
                <p style="margin: 5px 0; color: #2d2d2d; font-weight: 600;">${new Date(order.createdAt).toLocaleDateString(DATE_LOCALES[language], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">${T.paymentRequest.totalLabel}</p>
                <p style="margin: 5px 0; color: #ceafa6; font-weight: 700; font-size: 20px;">${formatRSD(order.total)}</p>
              </div>
            </div>
          </div>

          <!-- Payment Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${order.payment.paymentUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; font-size: 18px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3); transition: all 0.3s ease;">${T.paymentRequest.payNowCta}</a>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px; text-align: center;">
              <strong>${T.paymentRequest.testModeLabel}</strong> ${T.paymentRequest.testModeText}
            </p>
          </div>

          <!-- Order Summary -->
          <div style="background: linear-gradient(135deg, #f8f6f4 0%, #faf8f6 100%); padding: 25px; border-radius: 15px; margin: 30px 0; border: 1px solid #e8e2dd;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 20px 0; color: #2d2d2d; font-size: 20px; font-weight: 600;">${T.paymentRequest.summaryHeading}</h4>
            <div style="space-y: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px;">
                <span style="color: #666; font-weight: 500;">${T.common.subtotalLabel}</span>
                <span style="color: #2d2d2d; font-weight: 600;">${formatRSD(order.subtotal)}</span>
              </div>
              ${order.tax.amount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px;">
                <span style="color: #666; font-weight: 500;">${T.common.taxLabel}</span>
                <span style="color: #2d2d2d; font-weight: 600;">${formatRSD(order.tax.amount)}</span>
              </div>
              ` : ''}
              ${order.shipping.cost > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px;">
                <span style="color: #666; font-weight: 500;">${T.common.shippingLabel}</span>
                <span style="color: #2d2d2d; font-weight: 600;">${formatRSD(order.shipping.cost)}</span>
              </div>
              ` : ''}
              <div style="border-top: 2px solid #ceafa6; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #2d2d2d; font-weight: 700; font-size: 20px;">${T.common.totalLabel}</span>
                  <span style="color: #ceafa6; font-weight: 700; font-size: 24px;">${formatRSD(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Support Info -->
          <div style="background: #f8f6f4; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
              ${T.common.contactIntro('uplati')}<br>
              ${T.common.contactPrefix} <a href="mailto:${process.env.CONTACT_EMAIL || 'angelina.kondic997@gmail.com'}" style="color: #ceafa6; text-decoration: none; font-weight: 600;">${process.env.CONTACT_EMAIL || 'angelina.kondic997@gmail.com'}</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2d2d2d; padding: 30px; text-align: center;">
          <p style="color: #ceafa6; font-size: 18px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif; font-weight: 600;">${appName}</p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${appName}. ${T.paymentRequest.footerTagline}
          </p>
        </div>
      </body>
      </html>
    `;
  }

  // Payment confirmation email template
  getPaymentConfirmationTemplate(order, language = 'sr') {
    const T = dictionaries[language];
    const appName = process.env.APP_NAME || 'SveVišnja Kozmetika';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${T.paymentConfirmation.pageTitle(appName)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        </style>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #2d2d2d; max-width: 650px; margin: 0 auto; padding: 0; background: #faf9f7;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;"></div>
          <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${appName}</h1>
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.95;">${T.paymentConfirmation.headerTagline}</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="font-family: 'Playfair Display', serif; color: #2d2d2d; margin: 0; font-size: 28px; font-weight: 600;">${T.paymentConfirmation.heading}</h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #10b981, #059669); margin: 15px auto; border-radius: 2px;"></div>
          </div>

          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 25px;">${T.common.greeting()} <strong style="color: #10b981;">${order.customer.name}</strong>,</p>
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 30px;">${T.paymentConfirmation.intro}</p>

          <!-- Success Card -->
          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #bbf7d0; position: relative;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #10b981, #059669); border-radius: 15px 15px 0 0;"></div>
            <h3 style="font-family: 'Playfair Display', serif; margin: 10px 0 15px 0; color: #10b981; font-size: 22px; font-weight: 600;">${T.common.orderCardTitle(order.orderNumber)}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">${T.paymentConfirmation.dateLabel}</p>
                <p style="margin: 5px 0; color: #2d2d2d; font-weight: 600;">${new Date(order.payment.paidAt).toLocaleDateString(DATE_LOCALES[language], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">${T.paymentConfirmation.totalLabel}</p>
                <p style="margin: 5px 0; color: #10b981; font-weight: 700; font-size: 20px;">${formatRSD(order.total)}</p>
              </div>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="background: #f8f6f4; padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #e8e2dd;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 15px 0; color: #2d2d2d; font-size: 18px; font-weight: 600;">${T.paymentConfirmation.whatsNextHeading}</h4>
            <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; line-height: 1.8;">
              <li>${T.paymentConfirmation.bullets.confirmed}</li>
              <li>${T.paymentConfirmation.bullets.shippingNotice}</li>
              <li>${T.paymentConfirmation.bullets.estimatedDelivery(order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString(DATE_LOCALES[language]) : T.paymentConfirmation.estimatedDeliveryFallback)}</li>
            </ul>
          </div>

          <!-- Track Order Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${frontendUrl}/orders/${order._id}" style="background: linear-gradient(135deg, #ceafa6 0%, #d4b8a8 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(206, 175, 166, 0.3); transition: all 0.3s ease;">${T.paymentConfirmation.trackOrderCta}</a>
          </div>

          <!-- Support Info -->
          <div style="background: #f8f6f4; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
              ${T.common.contactIntro('porudžbini')}<br>
              ${T.common.contactPrefix} <a href="mailto:${process.env.CONTACT_EMAIL || 'angelina.kondic997@gmail.com'}" style="color: #ceafa6; text-decoration: none; font-weight: 600;">${process.env.CONTACT_EMAIL || 'angelina.kondic997@gmail.com'}</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2d2d2d; padding: 30px; text-align: center;">
          <p style="color: #ceafa6; font-size: 18px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif; font-weight: 600;">${appName}</p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${appName}. ${T.paymentConfirmation.footerTagline}
          </p>
        </div>
      </body>
      </html>
    `;
  }

  // Payment failed email template
  getPaymentFailedTemplate(order, language = 'sr') {
    const T = dictionaries[language];
    const appName = process.env.APP_NAME || 'SveVišnja Kozmetika';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${T.paymentFailed.pageTitle(appName)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        </style>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #2d2d2d; max-width: 650px; margin: 0 auto; padding: 0; background: #faf9f7;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;"></div>
          <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${appName}</h1>
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.95;">${T.paymentFailed.headerTagline}</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="font-family: 'Playfair Display', serif; color: #2d2d2d; margin: 0; font-size: 28px; font-weight: 600;">${T.paymentFailed.heading}</h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #ef4444, #dc2626); margin: 15px auto; border-radius: 2px;"></div>
          </div>

          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 25px;">${T.common.greeting()} <strong style="color: #ef4444;">${order.customer.name}</strong>,</p>
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 30px;">${T.paymentFailed.intro(order.orderNumber)}</p>

          <!-- Error Card -->
          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fef2f2 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #fecaca; position: relative;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #ef4444, #dc2626); border-radius: 15px 15px 0 0;"></div>
            <h3 style="font-family: 'Playfair Display', serif; margin: 10px 0 15px 0; color: #ef4444; font-size: 22px; font-weight: 600;">${T.common.orderCardTitle(order.orderNumber)}</h3>
            <p style="margin: 10px 0; color: #666; font-size: 14px;">
              <strong>${T.paymentFailed.reasonsLabel}</strong><br>
              ${T.paymentFailed.reasons.map(reason => `• ${reason}`).join('<br>\n              ')}
            </p>
          </div>

          <!-- Retry Payment Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${frontendUrl}/orders/${order._id}" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3); transition: all 0.3s ease;">${T.paymentFailed.retryCta}</a>
          </div>

          <!-- Help Section -->
          <div style="background: #f8f6f4; padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #e8e2dd;">
            <h4 style="font-family: 'Playfair Display', serif; margin: 0 0 15px 0; color: #2d2d2d; font-size: 18px; font-weight: 600;">${T.paymentFailed.helpHeading}</h4>
            <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; line-height: 1.8;">
              ${T.paymentFailed.helpBullets.map(bullet => `<li>${bullet}</li>`).join('\n              ')}
            </ul>
          </div>

          <!-- Support Info -->
          <div style="background: #f8f6f4; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
              ${T.paymentFailed.contactIntro}<br>
              ${T.common.contactPrefix} <a href="mailto:${process.env.CONTACT_EMAIL || 'angelina.kondic997@gmail.com'}" style="color: #ceafa6; text-decoration: none; font-weight: 600;">${process.env.CONTACT_EMAIL || 'angelina.kondic997@gmail.com'}</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2d2d2d; padding: 30px; text-align: center;">
          <p style="color: #ceafa6; font-size: 18px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif; font-weight: 600;">${appName}</p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${appName}. ${T.paymentFailed.footerTagline}
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getNewsletterTemplate(subject, message, user, language = 'sr') {
    const T = dictionaries[language];
    const appName = process.env.APP_NAME || 'SveVišnja Kozmetika';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const recipientName = (user && (user.name || user.firstName)) || '';

    // Plain text from the admin newsletter form - escape it, keep line breaks,
    // don't try to translate it.
    const escapeHtml = (str) => String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const messageHtml = escapeHtml(message || '').replace(/\n/g, '<br>');

    return `
      <!DOCTYPE html>
      <html lang="${language}">
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
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.95;">${T.newsletter.headerTagline}</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-family: 'Playfair Display', serif; color: #2d2d2d; margin: 0; font-size: 26px; font-weight: 600;">${escapeHtml(subject)}</h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #ceafa6, #d4b8a8); margin: 15px auto; border-radius: 2px;"></div>
          </div>

          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 20px;">${T.common.greeting()}${recipientName ? ` <strong style="color: #ceafa6;">${recipientName}</strong>` : ''},</p>
          <p style="font-size: 16px; color: #4a4a4a; line-height: 1.8;">${messageHtml}</p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${frontendUrl}/products" style="background: linear-gradient(135deg, #ceafa6 0%, #d4b8a8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(206, 175, 166, 0.3);">${T.newsletter.shopNowCta}</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2d2d2d; padding: 30px; text-align: center;">
          <p style="color: #ceafa6; font-size: 18px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif; font-weight: 600;">${appName}</p>
          <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">
            © ${new Date().getFullYear()} ${appName}. ${T.newsletter.footerTagline}
          </p>
          <p style="margin: 0;"><a href="${frontendUrl}/unsubscribe?email=${encodeURIComponent(user.email)}" style="color: #999; font-size: 12px;">${T.newsletter.unsubscribeCta}</a></p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
