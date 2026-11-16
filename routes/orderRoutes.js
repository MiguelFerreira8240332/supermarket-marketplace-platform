var express = require('express');
var router = express.Router();
var orderController = require('../controllers/order');
const Supermarket = require('../models/supermarket');
const Product = require('../models/product');
const Order = require('../models/order');

// Listar todas as encomendas
router.get('/', orderController.list);

// Mostrar formulário de criação
router.get('/create', orderController.counterSale);

router.post('/create', orderController.create);

// Mostrar detalhes de uma encomenda
router.get('/show/:id', orderController.show);

// Processar atualização de estado
router.post('/updateStatus/:id', orderController.updateStatus);

// Processar cancelamento (Regra 5 min)
router.post('/cancel/:id', orderController.cancel);

// Eliminar registo
router.post('/delete/:id', orderController.delete);

//Editar encomenda
router.get('/edit/:id', orderController.edit);

//Pagamento sucesso
router.get('/payment-success/:id', orderController.successfulPayment);

module.exports = router;

