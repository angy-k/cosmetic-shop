// Email copy for emailService.js - separate from frontend/lib/translations
// since the backend can't import that ES module. sr (default)/en live in
// ./locales, picked per-recipient from user.preferences.language (falls back to sr).

const sr = require('./locales/sr');
const en = require('./locales/en');

const dictionaries = { sr, en };

module.exports = { sr, en, dictionaries };
