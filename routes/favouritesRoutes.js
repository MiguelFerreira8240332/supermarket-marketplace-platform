var express = require("express");
var router = express.Router();
var favouritesController = require("../controllers/favouritesController");
const { authMiddleware, isCliente } = require('../middlewares/auth');
const favouritesRoutes = require('./routes/favouritesRoutes');

// Obtém a lista de favoritos do cliente autenticado
router.get('/favourits', authMiddleware, isCliente, favouritesController.getClienteFavourites);

// Regista as rotas de favoritos com o prefixo /api
app.use('/api', favouritesRoutes); 