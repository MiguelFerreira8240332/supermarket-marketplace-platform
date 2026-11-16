var express = require("express");
var router = express.Router();

router.get("/", function(req, res) {
    if (!req.session.user) {
        return res.render("auth/welcome", { title: "Bem-vindo", hideHeader: true });
    }

    const user = req.session.user;

    if (user.role === "admin") return res.redirect("/admin/dashboard");
    if (user.role === "supermarket") return res.redirect("/supermarket/dashboard");
    if (user.role === "courier") return res.redirect("/courier/dashboard");

    return res.render("index", { title: "Marketplace" });
});

module.exports = router;