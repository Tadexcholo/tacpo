// routes/register.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const twilio = require('twilio');
const crypto = require('crypto');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Ruta para registrar administradores (sin el prefijo `/api`)
router.post('/', [
    check('nombre_usuario').not().isEmpty().withMessage('El nombre de usuario es obligatorio'),
    check('correo').isEmail().withMessage('Correo inválido'),
    check('contra').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    check('numero').isMobilePhone().withMessage('Número de teléfono inválido'),
    check('pais').not().isEmpty().withMessage('El país es obligatorio'),
    check('g-recaptcha-response').not().isEmpty().withMessage('reCAPTCHA es obligatorio')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ msg: errors.array() });
    }
    const { nombre_usuario, correo, contra, numero, pais, 'g-recaptcha-response': captchaResponse } = req.body;
    try {
        const recaptchaRes = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: captchaResponse
            }
        });
        if (!recaptchaRes.data.success) {
            return res.status(400).json({ msg: 'Verificación de reCAPTCHA fallida' });
        }
        const [existingUser] = await db.query('SELECT * FROM administradores WHERE correo = ?', [correo]);
        if (existingUser.length > 0) {
            return res.status(400).json({ msg: 'El correo ya está registrado' });
        }
        const [existingPhone] = await db.query('SELECT * FROM administradores WHERE numero = ?', [numero]);
        if (existingPhone.length > 0) {
            return res.status(400).json({ msg: 'El número de teléfono ya está registrado' });
        }
        const hashedPassword = await bcrypt.hash(contra, 10);
        const codigoConfirmacion = crypto.randomInt(100000, 999999);
        await db.query(
            'INSERT INTO administradores (nombre_usuario, correo, contra, numero, pais, codigo_confirmacion, activacion) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre_usuario, correo, hashedPassword, numero, pais, codigoConfirmacion, 'no']
        );
        try {
            const message = await twilioClient.messages.create({
                body: `Tu código de verificación es: ${codigoConfirmacion}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: numero
            });
            console.log('SMS enviado:', message.sid);
        } catch (smsError) {
            console.error('Error al enviar SMS:', smsError);
            return res.status(500).json({ msg: 'Error al enviar SMS de verificación' });
        }
        res.status(200).json({ msg: 'Administrador registrado. Se envió un código de verificación por SMS.' });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ msg: 'Error interno del servidor' });
    }
});

// Ruta para la verificación del código de confirmación (sin prefijo /api)
router.post('/verifyRegistration/', async (req, res) => {
    const { numero, codigo_confirmacion } = req.body;
    try {
        const [user] = await db.query('SELECT * FROM administradores WHERE numero = ?', [numero]);
        if (user.length === 0) {
            return res.status(400).json({ msg: 'Número de teléfono no registrado' });
        }
        if (user[0].codigo_confirmacion != codigo_confirmacion) {
            return res.status(400).json({ msg: 'Código de confirmación incorrecto' });
        }
        await db.query('UPDATE administradores SET activacion = "si" WHERE numero = ?', [numero]);
        res.status(200).json({ success: true, message: 'Cuenta activada exitosamente. Puedes acceder al Dashboard.' });
    } catch (error) {
        console.error('Error en la verificación:', error);
        res.status(500).json({ msg: 'Error en la verificación del código' });
    }
});

module.exports = router;
