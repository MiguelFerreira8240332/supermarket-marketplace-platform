// controllers/auth.js 

var User = require("../models/user");
var bcrypt = require("bcryptjs");

const Supermarket = require("../models/supermarket");
const { sendAdminNotification } = require('./utils/mailer');
const { renderError } = require('./utils/errorHandler')

var authController = {};

// mostra a pagina de registo
authController.showSignup = function(req, res) {
    res.render("auth/signup", {hideHeader: true});
}

authController.showWelcome = function(req,res) {
    res.render('auth/welcome', {hideHeader: true})
}

// processar o registo
authController.signup = async function(req, res) {
    try {
        const { name, email, password, address, phoneNumber, role } = req.body;

        // Validações
        if (!name || !email || !password || !address || !phoneNumber) {
            return res.render("auth/signup", { error: "Todos os campos são obrigatórios.", hideHeader: true });
        }

        if (!/^\d{9}$/.test(phoneNumber)) {
            return res.render("auth/signup", { error: "O telefone deve ter exatamente 9 dígitos.", hideHeader: true });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render("auth/signup", { error: "Este e-mail já está registado.", hideHeader: true });
        }

        // Hash da password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            address,
            phoneNumber,
            role: role || 'client'
        });

        await newUser.save();

        // Se for supermercado → criar entidade supermercado
        if (newUser.role === 'supermarket') {
            
            await Supermarket.create({
                owner: newUser._id,
                name: "Nome Pendente",
                description: "Descrição Pendente",
                location: { coordinates: [0, 0], address: newUser.address },
                openingHours: "00:00 - 00:00",
                isApproved: false
            });
        }

        sendAdminNotification({
            name: newUser.name,
            address: newUser.address,
            phoneNumber: newUser.phoneNumber
        });

        res.redirect("/auth/login", {hideHeader: true});

    } catch (err) {
        console.log(err);
        res.render("auth/signup", { error: "Erro ao criar conta. Tente novamente.", hideHeader: true });
    }
};

// mostrar pagina de login
authController.showLogin = function(req, res) {
    res.render("auth/login", {hideHeader: true});
};

// processar login
authController.login = async function(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        // Verificar credenciais
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render("auth/login", { error: "E-mail ou password incorretos.", hideHeader: true });
        }

        // Guardar utilizador na sessão
        req.session.user = user;

        // Se for supermercado > verificar aprovação
        if (user.role === 'supermarket') {
            const Supermarket = require("../models/supermarket");

            const supermarket = await Supermarket.findOne({ owner: user._id });

            if (user.role === "supermarket") {
                const supermarket = await Supermarket.findOne({ owner: user._id });

                if (!supermarket) {
                    return res.render("auth/login", {
                        error: "Não foi encontrado supermercado associado a esta conta.",
                        hideHeader: true
                    });
                }

                req.session.supermarketId = supermarket._id;
                console.log("supermarketid: ", supermarket._id)
                req.session.supermarketApproved = supermarket.isApproved;
            }
        }   

        // Redirecionamento por role
        if (user.role === 'admin') return res.redirect("/admin/dashboard");
        if (user.role === 'supermarket') return res.redirect("/supermarket/dashboard");
        if (user.role === 'courier') return res.redirect("/courier/dashboard");

        return res.redirect("/");

    } catch (err) {
        return renderError(req, res, 500, "Erro interno ao fazer login", err)
    }
};

// logout
authController.logout = function(req, res) {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect("/auth/login");
    });
};

authController.showPwForm = (req, res) => {
    res.render('auth/pwRedefine', {hideHeader: true})
}

authController.redefinePW = async (req, res) => {
    const minLength = 4

    try {
        const { oldpw, newpw } = req.body
        
        const user = await User.findById(req.session.user._id)

        if (!user) return res.status(404).json( {error: 'Utilizador não encontrado'} )

        const isMatch = await bcrypt.compare(oldpw, user.password)

        if (!isMatch) return res.status(400).json( {error: 'Password antiga incorreta'} )

        if (newpw.length < minLength) return res.status(400).json( {error: `Password deve ter pelo menos ${minLength} carateres`})

        const hashed = await bcrypt.hash(newpw, 10)

        user.password = hashed

        await user.save()

        return res.json({ message: "Password alterada com sucesso" });

    } catch (err) {
        console.log(err)
        return res.status(500).json({error: "Erro no servidor"})
    }
}

module.exports = authController;