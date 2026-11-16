var express = require("express");
var router = express.Router();
var authController = require("../controllers/auth");
const { redirectIfLoggedIn, isLoggedIn } = require("../middlewares/auth");


// mostrar pagina inicial
router.get('/', authController.showWelcome)
router.get('/welcome', authController.showWelcome)

// mostrar formulários
router.get("/login", redirectIfLoggedIn, authController.showLogin);
router.get("/signup", redirectIfLoggedIn, authController.showSignup);

// processar formulários
router.post("/signup", redirectIfLoggedIn, authController.signup);
router.post("/login", redirectIfLoggedIn, authController.login);

// alterar e enviar password
router.get("/redefinePw", isLoggedIn, authController.showPwForm);
router.post("/redefinePW", isLoggedIn, authController.redefinePW);

// logout
router.get("/logout", isLoggedIn, authController.logout);


module.exports = router;    