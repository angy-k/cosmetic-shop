const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

// Create transporter for sending emails
const createTransporter = () => {
  // Use environment variables for email configuration
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Validation rules for contact form
const contactValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
];

// Submit contact form
const submitContactForm = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, message } = req.body;

    // Check if email configuration is available
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email configuration not found. Contact form submission logged but not sent.');
      
      // Log the contact form submission
      console.log('Contact Form Submission:', {
        name,
        email,
        message,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
      });
    }

    // Create email transporter
    const transporter = createTransporter();

    // Email to business owner
    const businessEmail = {
      from: process.env.SMTP_USER,
      to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ceafa6;">New Contact Form Submission</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <p style="color: #666; font-size: 12px;">
            This message was sent from the Cosmetic Shop contact form on ${new Date().toLocaleString()}.
          </p>
        </div>
      `
    };

    // Auto-reply email to customer
    const customerEmail = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Thank you for contacting Cosmetic Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ceafa6;">Thank you for your message!</h2>
          <p>Dear ${name},</p>
          <p>Thank you for reaching out to us. We have received your message and will get back to you within 24 hours.</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your message:</h3>
            <p style="font-style: italic;">"${message}"</p>
          </div>
          
          <p>If you have any urgent questions, you can also reach us at:</p>
          <ul>
            <li>Email: ${process.env.CONTACT_EMAIL || process.env.SMTP_USER}</li>
            <li>Phone: +1 (555) 123-4567</li>
          </ul>
          
          <p>Best regards,<br>The Cosmetic Shop Team</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated response. Please do not reply to this email.
          </p>
        </div>
      `
    };

    // Send emails
    await Promise.all([
      transporter.sendMail(businessEmail),
      transporter.sendMail(customerEmail)
    ]);

    res.status(200).json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.'
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    
    // Log the submission even if email fails
    console.log('Contact Form Submission (email failed):', {
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,
      timestamp: new Date().toISOString(),
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'There was an error sending your message. Please try again later.'
    });
  }
};

module.exports = {
  contactValidation,
  submitContactForm
};
