const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translationController');

// Define a POST route for translation
router.post('/translate', translationController.translateText);

module.exports = router;