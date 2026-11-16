const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email e password são obrigatórios." });
        }

        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Email ou password incorretos." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        user.password = undefined;

        res.json({
            token,
            user
        });

    } catch (err) {
        res.status(500).json({ error: "Erro interno ao fazer login." });
    }
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, address, phoneNumber } = req.body;

        if (!name || !email || !password || !address || !phoneNumber) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios." });
        }

        if (!/^\d{9}$/.test(phoneNumber)) {
            return res.status(400).json({ error: "Telefone deve ter 9 dígitos." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email já registado." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name, email,
            password: hashedPassword,
            address, phoneNumber,
            role: 'client'
        });

        res.status(201).json({ message: "Conta criada com sucesso." });

    } catch (err) {
        res.status(500).json({ error: "Erro ao criar conta." });
    }
};

exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar utilizador." });
    }
};