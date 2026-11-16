var express = require("express")
var router = express.Router()

var { isCourier } = require("../middlewares/auth")
var courierController = require("../controllers/courierController")


// dashboard do estafeta
router.get("/dashboard", isCourier, courierController.dashboard)

// mostrar encomendas disponiveis para entrega
router.get("/available", isCourier, courierController.available)

// mostrar estafeta
router.get('/show/:id', courierController.show)

// aceitar uma entrega
router.post("/accept/:id", isCourier, courierController.accept)

// entregas em andamento 
router.get("/currentDeliveries", isCourier, courierController.currentDeliveries)

// historico de entregas
router.get("/myDeliveries", isCourier, courierController.myDeliveries)

// atualizar o estado de uma entrega
router.post("/update-status/:id", isCourier, courierController.updateStatus)

// usar ajaxx para mostrar dinamicamente filtros da tabela
router.get("/api/myDeliveries", isCourier, courierController.myDeliveriesAPI)

// editar informacoes do estafeta
router.get("/settings", isCourier, courierController.settingsForm)
router.post("/settings/:id", isCourier, courierController.updateSettings)

// avaliacoes do estafeta
router.get('/:id/reviews', isCourier, courierController.reviews);


module.exports = router;