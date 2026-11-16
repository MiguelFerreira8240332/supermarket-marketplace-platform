var express = require("express");
var router = express.Router();
var { isSupermarket } = require("../middlewares/auth");
var { isLoggedIn } = require("../middlewares/auth") 
var supermarketController = require("../controllers/supermarket");
var productController = require("../controllers/productController");

// dashboard
router.get("/dashboard", isSupermarket, supermarketController.dashboard);

// mostrar detalhes do supermercado
router.get("/show/:id", isLoggedIn, supermarketController.show);

// formulario de edicao do supermercado
router.get("/settings", isSupermarket, supermarketController.settingsForm);

// atualizar detalhes do supermercado
router.post("/settings/:id", isSupermarket, supermarketController.upload.single('image'), supermarketController.updateSettings);

// produtos do supermercado com login feito
router.get("/products", isSupermarket, productController.listFromSession);

// notificacoes
router.post('/notifications/read/:id', isSupermarket, supermarketController.readNotification);

// reviews
router.get('/:id/reviews', isSupermarket, supermarketController.reviews);


// estatisticas do supermercado
// router.get("/stats", isSupermarket, supermarketController.stats);


/*
router.get("/products/create", isSupermarket, productController.create);
router.post("/products", isSupermarket, productController.upload.single('image'), productController.save);


router.get("/products/edit/:id", isSupermarket, productController.edit);
router.post("/products/update/:id", isSupermarket, productController.upload.single('image'), productController.update);
*/

module.exports = router;