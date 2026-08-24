const mongoose = require('mongoose');

// One record per newsletter send - lets the admin panel show a history of
// what was sent, when, by whom, and how many recipients actually got it.
const newsletterLogSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientCount: {
    type: Number,
    required: true,
    default: 0
  },
  successCount: {
    type: Number,
    required: true,
    default: 0
  },
  failedCount: {
    type: Number,
    required: true,
    default: 0
  },
  failedEmails: [{
    type: String
  }]
}, {
  timestamps: true
});

newsletterLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('NewsletterLog', newsletterLogSchema);
