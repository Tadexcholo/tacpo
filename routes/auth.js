const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const passport = require('passport');
const db = require('../config/db'); // Importa la conexión a la base de datos

const router = express.Router();

// Middleware de validación
const validateRegister = [
    check('nombre_usuario').not().isEmpty().withMessage('El nombre de usuario es obligatorio'),
    check('correo').isEmail().withMessage('Correo inválido'),
    check('contra').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    check('captchaResponse').not().isEmpty().withMessage('Captcha es obligatorio')
];

// Ruta para registrar un administrador
router.post('/register', validateRegister, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ msg: errors.array() });
    }

    const { nombre_usuario, correo, contra, captchaResponse } = req.body;

    if (!validateCaptcha(captchaResponse)) {
        return res.status(400).json({ msg: "Verificación de CAPTCHA fallida" });
    }

    try {
        const hashedPassword = await bcrypt.hash(contra, 10);
        const token = crypto.randomBytes(16).toString('hex');

        await db.query('INSERT INTO administradores (nombre_usuario, correo, contra, token_verificacion) VALUES (?, ?, ?, ?)', 
            [nombre_usuario, correo, hashedPassword, token]);

        await sendVerificationEmail(correo, token);

        res.status(200).json({ msg: 'Administrador registrado exitosamente, por favor verifica tu correo.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al registrar el administrador' });
    }
});

// Verificar el código de verificación enviado por correo
router.post('/verifyEmail', async (req, res) => {
    const { email, verificationCode } = req.body;

    try {
        const [user] = await db.query('SELECT * FROM administradores WHERE correo = ?', [email]);

        if (!user || user.length === 0) {
            return res.status(404).json({ msg: 'Administrador no encontrado' });
        }

        if (user[0].token_verificacion !== verificationCode) {
            return res.status(400).json({ msg: 'Código de verificación incorrecto' });
        }

        await db.query('UPDATE administradores SET verificado = true WHERE correo = ?', [email]);

        res.status(200).json({ success: true, message: 'Cuenta verificada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al verificar la cuenta' });
    }
});

// Recuperación de contraseña
router.post('/recoverPassword', async (req, res) => {
    const { email } = req.body;

    try {
        const [user] = await db.query('SELECT * FROM administradores WHERE correo = ?', [email]);

        if (!user || user.length === 0) {
            return res.status(404).json({ msg: 'Administrador no encontrado' });
        }

        const recoveryToken = crypto.randomBytes(16).toString('hex');
        await db.query('UPDATE administradores SET recovery_token = ? WHERE correo = ?', [recoveryToken, email]);

        const recoveryLink = `http://localhost:3000/reset-password/${recoveryToken}`;
        await sendRecoveryEmail(email, recoveryLink);

        res.status(200).json({ success: true, message: 'Enlace de recuperación enviado al correo' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al recuperar la contraseña' });
    }
});

// Iniciar sesión con Google
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        res.redirect('/dashboard.html');
    }
);

// Funciones auxiliares
function validateCaptcha(captchaResponse) {
    return captchaResponse === 'correctCaptchaResponse'; // Simulación
}

async function sendVerificationEmail(correo, token) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: process.env.NODE_ENV === 'production' ? 465 : 587, // 587 para local, 465 para prod
        secure: process.env.NODE_ENV === 'production', // Solo usa SSL en producción
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
     

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: correo,
        subject: 'Verificación de cuenta',
        text: `Por favor, usa este código de verificación: ${token}`
    });
}

async function sendRecoveryEmail(correo, link) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: process.env.NODE_ENV === 'production' ? 465 : 587, // 465 para producción, 587 para local
        secure: process.env.NODE_ENV === 'production', // SSL solo en producción
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: correo,
        subject: 'Recuperación de contraseña',
        text: `Para restablecer tu contraseña, haz clic en el siguiente enlace: ${link}`
    });
}

module.exports = router;
