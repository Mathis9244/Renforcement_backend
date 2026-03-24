const express = require('express');
const router = express.Router();
const authService = require('../services/auth');

router.post('/login', authService.login);
router.post('/forgot-password', authService.forgotPassword);
router.post('/reset-password', authService.resetPassword);
router.post('/2fa/setup', authService.setup2faStub);
router.post('/2fa/verify', authService.verify2faStub);

module.exports = router;
