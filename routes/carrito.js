const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Función auxiliar para validar la entrada
const validarId = (id, res) => {
  if (!id) {
    res.status(400).json({ msg: 'Falta el id del producto.' });
    return false;
  }
  return true;
};

// Endpoint para agregar un producto al carrito
router.post('/add', async (req, res) => {
  const { id } = req.body;
  if (!validarId(id, res)) return;

  try {
    await db.query('INSERT INTO carrito (id_producto) VALUES (?)', [id]);
    res.status(200).json({ msg: 'Producto agregado al carrito.' });
  } catch (error) {
    console.error("Error en /api/carrito/add:", error.message);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

// Endpoint para eliminar un producto del carrito
router.post('/remove', async (req, res) => {
  const { id } = req.body;
  if (!validarId(id, res)) return;

  try {
    await db.query('DELETE FROM carrito WHERE id_producto = ?', [id]);
    res.status(200).json({ msg: 'Producto eliminado del carrito.' });
  } catch (error) {
    console.error("Error en /api/carrito/remove:", error.message);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

// Endpoint para finalizar la compra (checkout)
router.post('/checkout', async (req, res) => {
  const { productIds } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ msg: 'No hay productos para comprar.' });
  }

  try {
    // Eliminar productos de "trabajos" e insertar en "carrito" en una sola consulta
    await db.query('DELETE FROM trabajos WHERE id IN (?)', [productIds]);
    await db.query('INSERT INTO carrito (id_producto) VALUES ?', [productIds.map(id => [id])]);

    res.status(200).json({ msg: 'Compra realizada con éxito.' });
  } catch (error) {
    console.error("Error en /api/carrito/checkout:", error.message);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

module.exports = router;
