var express = require("express");
var router = express.Router();
var { isAdmin } = require("../middlewares/auth");
var adminController = require("../controllers/adminController");
var userController = require("../controllers/user")

// dashboard admin
router.get("/dashboard", isAdmin, adminController.dashboard);

// supermercados pendentes
router.get("/pendingSupermarkets", isAdmin, adminController.listPending);

// aprovar supermercado
router.post("/supermarkets/approve/:id", isAdmin, adminController.approve);

// rejeitar supermerado
router.post("/supermarkets/reject/:id", isAdmin, adminController.reject);

// listar utilizadores
router.get("/allUsers", isAdmin, adminController.listAllUsers);

//Ver Informações pessoais
router.get('/user/view/:id', isAdmin, userController.showProfile);

// apagar utilizador
router.post("/user/delete/:id", isAdmin, adminController.deleteUser);

// listar encomendas
router.get("/orders", isAdmin, adminController.listOrders);

// alterar informacoes e password
router.get('/settings', isAdmin, adminController.settingsForm)
router.post('/settings/:id', isAdmin, adminController.updateSettings)

// moderar produtos
router.post('/products/moderate/:id', isAdmin, adminController.moderateProduct);

module.exports = router;