const mysql = require('mysql2/promise'); // 🔹 Usamos la versión con promesas

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fotografias',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conectado a la base de datos');
        connection.release(); 
    } catch (err) {
        console.error('❌ Error conectando a la base de datos:', err);
        process.exit(1);
    }
})();

module.exports = pool; 
