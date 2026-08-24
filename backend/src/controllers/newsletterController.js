const { User, NewsletterLog } = require('../models');
const emailService = require('../services/emailService');

/**
 * Admin: Send a one-time newsletter to every subscribed user
 * @route POST /api/newsletter/send
 * @access Private (Admin only)
 */
const sendNewsletter = async (req, res) => {
  try {
    const { subject, message } = req.body || {};

    if (!subject || !subject.trim() || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    // Admin accounts default to newsletter:true like anyone else, but the
    // newsletter is a customer-facing feature - admins shouldn't receive it
    // (same reasoning as hiding the newsletter checkbox on their own profile).
    const recipients = await User.find({
      isActive: true,
      role: 'user',
      'preferences.newsletter': true
    }).select('email name');

    if (recipients.length === 0) {
      await NewsletterLog.create({
        subject,
        message,
        sentBy: req.user._id,
        recipientCount: 0,
        successCount: 0,
        failedCount: 0,
        failedEmails: []
      });

      return res.json({
        success: true,
        message: 'No subscribed users to send to',
        data: { sent: 0, failed: 0, total: 0, failedEmails: [] }
      });
    }

    const results = await emailService.sendNewsletterToUsers(recipients, { subject, message });
    const failedResults = results.filter(r => !r.success);
    const sent = results.length - failedResults.length;

    console.log(`Newsletter "${subject}" sent to ${sent}/${recipients.length} subscribers`);

    await NewsletterLog.create({
      subject,
      message,
      sentBy: req.user._id,
      recipientCount: recipients.length,
      successCount: sent,
      failedCount: failedResults.length,
      failedEmails: failedResults.map(r => r.email)
    });

    res.json({
      success: true,
      message: `Newsletter sent to ${sent} of ${recipients.length} subscribers`,
      data: {
        sent,
        failed: failedResults.length,
        total: recipients.length,
        failedEmails: failedResults.map(r => r.email)
      }
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending newsletter'
    });
  }
};

/**
 * Admin: Count of users currently subscribed to the newsletter
 * @route GET /api/newsletter/subscriber-count
 * @access Private (Admin only)
 */
const getSubscriberCount = async (req, res) => {
  try {
    const count = await User.countDocuments({
      isActive: true,
      role: 'user',
      'preferences.newsletter': true
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error counting newsletter subscribers:', error);
    res.status(500).json({
      success: false,
      message: 'Error counting subscribers'
    });
  }
};

/**
 * Admin: List of users currently subscribed to the newsletter
 * @route GET /api/newsletter/subscribers
 * @access Private (Admin only)
 */
const getSubscribers = async (req, res) => {
  try {
    const subscribers = await User.find({
      isActive: true,
      role: 'user',
      'preferences.newsletter': true
    }).select('name email createdAt').sort({ name: 1 });

    res.json({ success: true, data: { subscribers, count: subscribers.length } });
  } catch (error) {
    console.error('Error fetching newsletter subscribers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscribers'
    });
  }
};

/**
 * Admin: History of past newsletter sends
 * @route GET /api/newsletter/history
 * @access Private (Admin only)
 */
const getHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      NewsletterLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sentBy', 'name email'),
      NewsletterLog.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching newsletter history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching newsletter history'
    });
  }
};

/**
 * Unsubscribe a user from the newsletter via the link in the email footer
 * @route POST /api/newsletter/unsubscribe
 * @access Public
 */
const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOneAndUpdate(
      { email: String(email).toLowerCase().trim() },
      { 'preferences.newsletter': false },
      { new: true }
    );

    if (!user) {
      // Don't reveal whether the email exists in the system either way -
      // treat it as already unsubscribed from the requester's point of view.
      return res.json({ success: true, message: 'You have been unsubscribed' });
    }

    res.json({ success: true, message: 'You have been unsubscribed from the newsletter' });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({ success: false, message: 'Error processing unsubscribe request' });
  }
};

module.exports = {
  sendNewsletter,
  getSubscriberCount,
  getSubscribers,
  getHistory,
  unsubscribe
};
