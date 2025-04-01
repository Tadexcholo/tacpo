const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Obtener el token desde las cabeceras Authorization
    const token = req.headers['authorization']?.split(' ')[1]; // 'Bearer <token>'

    if (!token) {
        return res.status(403).json({ msg: 'No token provided' }); // Si no hay token, retorna un error 403
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded; // Guarda la información del usuario decodificada en la solicitud
        next(); // Si el token es válido, continua con la solicitud
    } catch (error) {
        return res.status(401).json({ msg: 'Token inválido' }); // Si el token es inválido, retorna un error 401
    }
};
