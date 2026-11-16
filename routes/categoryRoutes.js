const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/categoryController')
var { isAdmin } = require("../middlewares/auth");


// ----------------rotas publicas--------------------------
// ----------------rotas publicas--------------------------

// mostrar categorias
router.get('/', categoryController.list)

// ✅ PRIMEIRO rotas específicas
router.get('/create', isAdmin, categoryController.create)

// mostrar detalhes de uma categoria
router.get('/:id', categoryController.show)



// -------------------rotas protegidas (admin)--------------------

// abrir formulário para gravar
router.post('/', isAdmin, categoryController.save)

// editar categoria
router.get('/edit/:id', isAdmin, categoryController.edit)

// atualizar categoria
router.post('/update/:id', isAdmin, categoryController.update)

// apagar categoria
router.post('/delete/:id', isAdmin, categoryController.delete)


module.exports = router