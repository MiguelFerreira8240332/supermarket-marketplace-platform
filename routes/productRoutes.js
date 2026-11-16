const express = require('express')
const router = express.Router()
const productController = require('../controllers/productController')
var { isSupermarket } = require("../middlewares/auth");
var { isLoggedIn } = require('../middlewares/auth') 

// ---------------apenas supermercados (rotas protegidas)----------------------------

// mostrar formulario para criar produto
router.get('/create', isSupermarket, productController.create)

// guardar produto
router.post('/', isSupermarket, productController.upload.single('image'), productController.save)

// atualizar produto
router.post('/update/:id', isSupermarket, productController.upload.single('image'), productController.update)

// editar produto
router.get('/edit/:id', isSupermarket, productController.edit)

// apagar produto
router.post('/delete/:id', isSupermarket,productController.delete)

// ---------------clientes (publico)----------------------------

// mostrar todos os produtos
router.get('/', isLoggedIn, productController.list)

// mostrar produtos filtrados
router.get('/api', isLoggedIn, productController.listAPI)

// mostrar detalhes do produto 
router.get('/:id', isLoggedIn, productController.show)

module.exports = router;