const axios = require('axios');

async function verifyRecaptcha(req, res, next) {
    const captchaResponse = req.body['g-recaptcha-response'];

    if (!captchaResponse) {
        return res.status(400).json({ success: false, msg: 'reCAPTCHA es obligatorio' });
    }

    try {
        const recaptchaRes = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: captchaResponse
            }
        });

        if (!recaptchaRes.data.success) {
            return res.status(400).json({ success: false, msg: 'Verificación de reCAPTCHA fallida' });
        }

        next();
    } catch (error) {
        console.error('Error en la verificación de reCAPTCHA:', error);
        return res.status(500).json({ success: false, msg: 'Error en la verificación de reCAPTCHA' });
    }
}

module.exports = verifyRecaptcha;
