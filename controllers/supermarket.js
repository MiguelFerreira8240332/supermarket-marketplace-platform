var Supermarket = require("../models/supermarket")
var Product = require("../models/product")
var Category = require("../models/category")
var Order = require("../models/order")
var Notification = require('../models/notification');

var { renderError } = require('./utils/errorHandler')
const { getMonthRange } = require('./utils/dateUtils');
var mongoose = require("mongoose")
const supermarket = require("../models/supermarket")
const Review = require('../models/review');

const multer = require('multer')
const path = require('path')
const fs = require('fs')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images')
    },
    filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
}
})

var supermarketController = {};

supermarketController.upload = multer({storage: storage})


// ------------ definições da loja (dono da loja)--------------------

// atualizar detalhes do supermercado
supermarketController.updateSettings = async function(req, res) {
    try {
        const supermarket = await Supermarket.findById(req.params.id);

        let deliveryMethods = [];

        if (req.body.deliveryMethods) {
            deliveryMethods = Array.isArray(req.body.deliveryMethods)
                ? req.body.deliveryMethods
                : [req.body.deliveryMethods];
        }

        let imageName = supermarket.image;

        if (req.file) {

            if (supermarket.image &&!supermarket.image.startsWith('defaultmarket')) {

                const oldImagePath = path.join(__dirname, '../public/images/', supermarket.image);

                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            imageName = req.file.filename;
        }

        // dados atualizados
        const settings = {

            name: req.body.name,
            description: req.body.description,
            openingHours: req.body.openingHours,
            image: imageName,
            deliveryMethods: deliveryMethods,

            deliveryCosts: {
                pickup: req.body.pickupCost || 0,
                courier: req.body.courierCost || 0
            },

            location: {
                type: "Point",
                coordinates: [
                    parseFloat(req.body.longitude) || 0,
                    parseFloat(req.body.latitude) || 0
                ],
                address: req.body.address
            }
        };

        await Supermarket.findByIdAndUpdate(req.params.id, settings);

        res.redirect("/supermarket/dashboard");

    } catch (err) {
        console.log("Erro ao atualizar supermercado:", err);
        const supermarket = await Supermarket.findById(req.params.id);

        res.render("supermarket/settings", {
            title: "Meu Supermercado",
            supermarket: supermarket,
            error: "Erro ao atualizar."
        });
    }
};
// mostrar dashboard
supermarketController.dashboard = async (req, res) => {
    try {
        const market = await Supermarket.findOne({owner: req.session.user._id});

        const notifications = await Notification.find({
            user: req.session.user._id,
            seen: false
        }).sort({ createdAt: -1 });

        const stats = await getStats(req.session.supermarketId)

        res.render('supermarket/dashboard', {
            title: 'Bem vindo: ',
            user: req.session.user,
            market,
            notifications,
            session: req.session,
            ...stats
        })

    } catch (err) {
        return renderError(req, res, 500, "Erro ao carregar dashboard", err)
    }
};

supermarketController.show = async (req,res) => {
    try {
        const supermarket = await Supermarket.findById(req.params.id)
    
        if (!supermarket) {
            return renderError(req, res, 400, "Supermercado não encontrado")
        }

        var isOwner = req.session.supermarketId && req.session.supermarketId.toString() === req.params.id
       
        res.render("supermarket/show", {
            supermarket: supermarket,
            goback: isOwner ? '/supermarket/dashboard' : req.get('Referer'),
            isOwner: isOwner
        })
    } catch (err) {
        return renderError(req, res, 500, "Não foi possivel mostrar o supermercado", err)
    }
}

// formulario para editar detalhes do supermercado
supermarketController.settingsForm = async function(req, res) {
    try {
        const supermarket = await Supermarket.findById(req.session.supermarketId);

        if (!supermarket) {
            return res.redirect("/supermarket/dashboard");
        }

        const deliveryMethods = supermarket.deliveryMethods || []

        res.render("supermarket/settings", {
            title: "Meu Supermercado",
            supermarket: supermarket,
            deliveryMethods: deliveryMethods,
            session: req.session
        });
    } catch (err) {
        console.log("Erro ao abrir settings:", err);
        res.redirect("/supermarket/dashboard");
    }
};

supermarketController.reviews = async (req, res) => {
    const reviews = await Review.find({
        supermarket: req.params.id,
        supermarketRating: { $exists: true }
    })
    .populate('client', 'name');

    res.render('supermarket/reviews', { reviews, type: 'supermarket' });
};

async function getStats(supermarketId) {
    const objectId = new mongoose.Types.ObjectId(supermarketId)
    const { start, end } = getMonthRange()

    const status = { $nin: ["Pendente", "Cancelada"] }

    const ordersNum = await Order.countDocuments({
        supermarket: supermarketId,
        status
    })

    const monthOrdersNum = await Order.countDocuments({
        supermarket: supermarketId,
        status,
        orderDate: { $gte: start, $lt: end }
    })

    const totalRevenueResult = await Order.aggregate([
        { $match: { supermarket: objectId, status }},
        { $group: { _id: null, total: { $sum: "$totalValue" }}}
    ])

    const totalRevenue = totalRevenueResult[0]?.total || 0

    const monthRevenueResult = await Order.aggregate([
        { $match: {
            supermarket: objectId,
            status,
            orderDate: { $gte: start, $lt: end }
        }},
        { $group: { _id: null, total: { $sum: "$totalValue" }}}
    ])

    const monthRevenue = monthRevenueResult[0]?.total || 0

    const topProducts = await Order.aggregate([
        { $match: { supermarket: objectId, status }},
        { $unwind: "$products" },
        { $group: {
            _id: "$products.productId",
            totalSold: { $sum: "$products.amount" }
        }},
        { $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product"
        }},
        { $unwind: "$product"},
        { $sort: { totalSold: -1 }},
        { $limit: 3 }
    ])

    const reviews = await Review.find({
        supermarket: supermarketId,
        supermarketRating: { $exists: true }
    });

    const totalReviews = reviews.length;

    let totalRating = 0;

    for (const review of reviews) {
        totalRating += review.supermarketRating;
    }

    const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;

    return {
        ordersNum, monthOrdersNum, totalRevenue, monthRevenue, topProducts, averageRating, totalReviews
    }
}

supermarketController.readNotification = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(
            req.params.id,
            { seen: true }
        );
        res.redirect('/supermarket/dashboard');
    } catch (err) {
        console.log(err);
        res.redirect('/supermarket/dashboard');
    }
};



// ------------------------------------ frontoffice --------------------------------------
supermarketController.apiGetSupermarkets = async (req,res) => {
    try {
        const Supermarkets = await Supermarket.find({ isApproved: true });
        res.json(Supermarkets)
    } catch (err) {
        res.json({ error: "Erro ao obter supermercados" })
    }
}

supermarketController.apiGetSupermarketById = async (req,res) => {
    try {
        const supermarket = await Supermarket.findById(req.params.id);
        if (!supermarket) return res.status(404).json({ error: 'Supermercado não encontrado' });
        res.json(supermarket)
    } catch (err) {
        res.status(500).json({ error: "Erro ao obter supermercados" })
    }
}


module.exports = supermarketController;