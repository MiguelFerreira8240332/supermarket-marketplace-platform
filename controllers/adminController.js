const User = require("../models/user");
const Supermarket = require("../models/supermarket");
const Order = require("../models/order");  
const Product = require('../models/product');
const Notification = require('../models/notification');

var { renderError } = require('./utils/errorHandler')
const { getMonthRange } = require('./utils/dateUtils');

var adminController = {};

// dashboard admin
adminController.dashboard = async (req, res) => {
    try {
        const pendingSupermarkets = await Supermarket.countDocuments({ isApproved: false });
        const totalUsers = await User.countDocuments();

        const stats = await getAdminStats();

        res.render("admin/dashboard", {
            session: req.session,
            pendingSupermarkets,
            totalUsers, 
            stats
        });

    } catch (err) {
        console.log("Erro no dashboard admin:", err);
        res.redirect("/");
    }
};

// Listar supermercados que aguardam aprovação
adminController.listPending = async (req, res) => {
    try {
        const supermarkets = await Supermarket.find({ isApproved: false });
        res.render("admin/pendingSupermarkets", { supermarkets: supermarkets });

    } catch (err) {
        return renderError(req, res, 500, "Não foi possível listar supermercados pendentes", err)
    }
};

// Aprovar um supermercado para que possa vender
adminController.approve = async (req, res) => {
    try {
        await Supermarket.findByIdAndUpdate(req.params.id, { isApproved: true });
        res.redirect("/admin/dashboard");
    } catch (err) {
        res.redirect("/admin/dashboard");
    }
};

// Rejeitar um supermercado
adminController.reject = async (req, res) => {
    try {
        const supermarketId = req.params.id; 
        const { reason } = req.body;

        await Supermarket.findByIdAndUpdate(supermarketId, { rejectionMessage: reason });

        res.redirect('/admin/pendingSupermarkets');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao guardar mensagem de rejeição.");
    }
};

// Listar todos os utilizadores por role
adminController.listAllUsers = async (req, res) => {
    try {
        const users = await User.find({});

        const data = {
            clients: users.filter(u => u.role === 'client'),
            supermarkets: users.filter(u => u.role === 'supermarket'),
            couriers: users.filter(u => u.role === 'courier'),
            admins: users.filter(u => u.role === 'admin')
        };

        res.render("admin/usersList", { data, users });
    } catch (err) {
        return renderError(req, res, 500, "Erro ao carregar a lista de utilizadores", err)
    }
}

// adminController.deleteUser
adminController.deleteUser = async (req, res) => { 
    try {
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return renderError(req, res, 400, "Erro ao eliminar utilizador")
        }

        if (user.role === 'supermarket') {
            await Supermarket.deleteMany({ owner: userId });
        }
        
        await User.findByIdAndDelete(userId);

        res.redirect("/admin/allUsers"); 

    } catch (err) {
        return renderError(req, res, 500, "Erro ao eliminar utilizador", err)
    }
};

adminController.listOrders = async (req, res) => {
    try {
        const { supermarketId, status } = req.query; // O ID vem do formulário de filtro (?supermarketId=...), por isso req.query e não req.params.     
        let filter = {};
        
        if (supermarketId) {
            filter.supermarket = supermarketId; // Se filter ficar vazio, o Mongo traz tudo, e não apenas os que têm ID da req.query.
        }

        if (status) {
            filter.status = status;
        }

        const orders = await Order.find(filter).populate('supermarket').sort({ orderDate: -1 });
        const supermarkets = await Supermarket.find().sort({ name: 1 });

        res.render('admin/ordersList', { 
            orders, 
            supermarkets, 
            selectedMarket: supermarketId || '', 
            selectedStatus: status
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao carregar encomendas");
    }
};

adminController.settingsForm = async (req, res) => {
    try {
        const admin = await User.findById(req.session.user._id)

        if (!admin || admin.role !== 'admin') {
            return res.redirect('/')
        }

        res.render('admin/settings', { admin, isOwner: true})

    } catch (err) {
        return renderError(req, res, 500, "Erro ao abrir settings", err)
    }
}

adminController.updateSettings = async (req, res) => {
    try {
        const { id } = req.params

        const { name, email, phoneNumber, address } = req.body

        const updatedAdmin = await User.findByIdAndUpdate(
            id,
            { name, email, phoneNumber, address },
            { new: true }
        )

        if (!updatedAdmin) return res.status(404).send('Admin não encontrado')

        req.session.user = updatedAdmin

        // redirect para o perfil
        res.redirect(`/admin/user/view/${id}`)

    } catch (err) {
        return renderError(req, res, 500, "Erro ao atualizar admin", err)
    }
}

// mostrar estatisticas do admin
async function getAdminStats() {
    const { start, end } = getMonthRange();
    const lastMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const lastMonthEnd = start;

    const validStatus = { $nin: ["Pendente", "Cancelada"] };

    const thisMonthOrders = await Order.countDocuments({
        status: validStatus,
        deliveryDate: { $gte: start, $lt: end }
    });

    const lastMonthOrders = await Order.countDocuments({
        status: validStatus,
        deliveryDate: { $gte: lastMonthStart, $lt: lastMonthEnd }
    });

    let growth = 0;
    if (lastMonthOrders > 0) {
        growth = ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100;
    }

    const topCouriers = await Order.aggregate([
        { $match: { status: "Entregue", courier: { $ne: null } }},
        { $group: {
            _id: "$courier",
            total: { $sum: 1 }
        }},
        { $sort: { total: -1 }},
        { $limit: 3 },
        { $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "courier"
        }},
        { $unwind: "$courier" }
    ]);

    const topSupermarkets = await Order.aggregate([
        { $match: { status: validStatus }},
        { $group: {
            _id: "$supermarket",
            total: { $sum: 1 }
        }},
        { $sort: { total: -1 }},
        { $limit: 3 },
        { $lookup: {
            from: "supermarkets",
            localField: "_id",
            foreignField: "_id",
            as: "market"
        }},
        { $unwind: "$market" }
    ]);

    return {
        growth,
        topCouriers: topCouriers.map(c => ({
            id: c._id,
            name: c.courier.name,
            total: c.total
        })),
        topSupermarkets: topSupermarkets.map(s => ({
            id: s._id,
            name: s.market.name,
            total: s.total
        }))
    };
}

adminController.moderateProduct = async (req, res) => {
    try {
        const { reason } = req.body;

        const product = await Product.findById(req.params.id).populate('supermarket');

        if (!product) {
            return res.status(404).json({error: 'Produto não encontrado'});
        }

        const supermarket = await Supermarket.findById(product.supermarket._id);

        await Notification.create({
            user: supermarket.owner,
            title: 'Produto removido',
            message:
                `O produto "${product.name}" foi removido ` +
                `pelo administrador ${req.session.user.name}. ` +
                `Motivo: ${reason}`
        });

        await Product.findByIdAndDelete(product._id);
        res.json({success: true});

    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Erro ao moderar produto'});
    }
};


module.exports = adminController;