// routes/api.js 

const express = require("express");
const router = express.Router();

const apiAuth = require("../controllers/apiAuth");
const productController = require("../controllers/productController");
const categoryController = require("../controllers/categoryController");
const supermarketController = require("../controllers/supermarket");
const userController = require('../controllers/user');
const notificationController = require('../controllers/notificationController');
const reviewController = require('../controllers/reviewController');
const favouritesController = require('../controllers/favouritesController');

const { verifyToken } = require("../middlewares/auth");
const orderController = require("../controllers/order");


// AUTH
router.post("/auth/login", apiAuth.login);
router.post("/auth/register", apiAuth.register);
router.get("/auth/me", verifyToken, apiAuth.me);

// USER
router.put("/users/:id", userController.apiUpdate);

// PRODUCTS
router.get("/products", productController.listapi);

// CATEGORIES
router.get("/categories", categoryController.listapi);

// SUPERMARKETS
router.get("/supermarkets", supermarketController.apiGetSupermarkets);
router.get("/supermarkets/:id", supermarketController.apiGetSupermarketById);

// FAVORITE Products and Supermarkets
router.post('/products/:id/favorite', verifyToken, favouritesController.addFavorite);
router.delete('/products/:id/favorite', verifyToken, favouritesController.removeFavorite);

router.post('/supermarkets/:id/favorite', verifyToken, favouritesController.addFavoriteSupermarket);
router.delete('/supermarkets/:id/favorite', verifyToken, favouritesController.removeFavoriteSupermarket);
router.get('/favorites', verifyToken, favouritesController.getFavorites);

// ORDERS
router.get('/orders/api-payment-success/:id', orderController.apiSuccessfulPayment);
router.get('/orders/ongoing', verifyToken, orderController.apiOngoingOrders);
router.get('/orders/finished', verifyToken, orderController.apiFinishedOrders);
router.put('/orders/:id/cancel', verifyToken, orderController.apiCancel);
router.post('/orders', verifyToken, orderController.apiCreateOrder);
router.put('/orders/:id/payment', verifyToken, orderController.apiCreatePayment);
router.get('/orders/count', verifyToken, orderController.apiOrdersCount);

// NOTIFICATIONS
router.get('/notifications', verifyToken, notificationController.getMyNotifications);
router.put('/notifications/read', verifyToken, notificationController.markAllAsRead);
router.put('/notifications/:id/read',verifyToken, notificationController.markAsRead);


// to add to swagger 
// REVIEWS
// REVIEWS
router.post('/reviews', verifyToken, reviewController.create);

router.get('/supermarkets/:id/reviews', reviewController.getSupermarketReviews);

router.get('/couriers/:id/reviews', reviewController.getCourierReviews);

module.exports = router;