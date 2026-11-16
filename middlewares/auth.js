// middlewares/auth.js

const jwt = require('jsonwebtoken');
const defaultPage = "/auth/welcome"

function isLoggedIn(req, res, next) {
    if (req.session.user) {
        return next()
    }
    return res.redirect(defaultPage)
}

function requireRole(role) {
    return (req, res, next) => {
        isLoggedIn(req, res, () => { // aqui vai executar se isloggedin chamar next (ou seja login feito)
            if (req.session.user.role === role) {
                return next()
            }
            return res.redirect(defaultPage)
        });
    };
}

function redirectIfLoggedIn(req, res, next) {
    if (!req.session.user) {
        return next();
    }

    const user = req.session.user;

    if (user.role === "admin") return res.redirect("/admin/dashboard");
    if (user.role === "supermarket") return res.redirect("/supermarket/dashboard");
    if (user.role === "courier") return res.redirect("/courier/dashboard");

    return res.redirect("/");
}

const isAdmin = requireRole("admin")
const isSupermarket = requireRole("supermarket")
const isCourier = requireRole("courier")
const isClient = requireRole("client")


const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: "Token em falta." });
        }

        const token = authHeader.split(' ')[1]; // "Bearer <token>"
        if (!token) {
            return res.status(401).json({ error: "Token em falta." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role }
        next();

    } catch (err) {
        return res.status(401).json({ error: "Token inválido." });
    }
};

const requireApiRole = (role) => {
    return (req, res, next) => {
        verifyToken(req, res, () => {
            if (req.user.role === role) {
                return next();
            }
            return res.status(403).json({ error: "Acesso negado." });
        });
    };
};

const isApiClient = requireApiRole("client");
const isApiAdmin = requireApiRole("admin");
const isApiCourier = requireApiRole("courier");

module.exports = {
    // sessões 
    isLoggedIn, isAdmin, isSupermarket, isCourier, isClient, redirectIfLoggedIn,
    // JWT 
    verifyToken, isApiClient, isApiAdmin, isApiCourier
};