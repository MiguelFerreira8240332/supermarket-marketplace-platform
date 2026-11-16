// controllers/courierController.js

const Order = require('../models/order')
const { renderError } = require('./utils/errorHandler')
const mongoose = require('mongoose')
const { getMonthRange } = require('./utils/dateUtils');
const User = require('../models/user'); 
const Review = require('../models/review');

var courierController = {};

// dashboard do estafeta
courierController.dashboard = async (req, res) => {
    try {
        const currentOrdersNumber = await Order.countDocuments({
            courier: req.session.user._id,
            status: { $in: ['Em processamento', 'Em entrega'] }
        });

        const availableOrdersNumber = await Order.countDocuments({
            deliveryMethod: 'Entrega ao domicilio',
            courier: null,
            status: 'Confirmada'
        });

        const stats = await getStats(req.session.user._id);

        res.render("courier/dashboard", {
            title: "Dashboard do estafeta",
            session: req.session,
            myDeliveriesCount: currentOrdersNumber,
            availableCount: availableOrdersNumber,
            stats,
            courier: req.session.user
        });

    } catch (err) {
        return renderError(req, res, 500, "Erro ao carregar dashboard", err);
    }
};

// lista de entregas disponiveis
courierController.available = async (req, res) => {
    try {
        const deliveries = await getAvailableDeliveries();

        res.render('courier/available', {deliveries, title: 'Entregas disponíveis'})

    } catch (err) {
        return renderError(req, res, 500, "Erro ao carregar entregas disponiveis", err)
    }
}

// entregas em andamento
courierController.currentDeliveries = async (req, res) => {
    try {
        const currentDeliveries = await Order.find({
            courier: req.session.user._id,
            status: { $in: ['Em processamento', 'Em entrega'] }
        })
        .populate('supermarket')
        .populate('client')
        .populate('products.productId')

        res.render('courier/currentDeliveries', {
            deliveries: currentDeliveries,
            session: req.session,
        })
    
    } catch (err) {
        return renderError(req, res, 500, "Erro ao mostrar entregas em andamento", err)

    }
}

// aceitar entregas e atualizar estado de 'Confirmada' para 'Em processamento'
courierController.accept = async (req,res) => {
    try {
        const activeOrders = await Order.countDocuments({
            courier: req.session.user._id,
            status: { $in: ['Em processamento', 'Em entrega'] }
        })

        if (activeOrders > 0) {
            const deliveries = await getAvailableDeliveries();

            return res.render('courier/available', {
                deliveries,
                title: 'Entregas disponiveis',
                activeDeliveries: 'Só podes ter uma encomenda ativa de cada vez'
            })
        }
        
        await Order.findOneAndUpdate(
            {
                _id: req.params.id,
                courier: null // evita dois estafetas aceitarem ao mesmo tempo
            },
            {
                courier: req.session.user._id,
                status: 'Em processamento'
            }
        )

        res.redirect('/courier/currentDeliveries')

    } catch (err) {
        return renderError(req, res, 500, "Erro ao aceitar entrega", err)
    }
}

// hitorico de entregas do estafeta
courierController.myDeliveries = async (req,res) => {
    try {

        let filter = {
            courier: req.session.user._id
        }

        if (req.query.status) {
            filter.status = req.query.status
        } else {
            filter.status = { $in: ['Entregue', 'Cancelada']}
        }

        const orders = await Order.find(filter)
            .populate('supermarket')
            .populate('client')
            .populate('products.productId')

        res.render('courier/myDeliveries', {orders, query: req.query})

    } catch (err) { 
        return renderError(req, res, 500, "Erro ao carregar histórico de entregas", err)
    }
}

courierController.myDeliveriesAPI = async (req, res) => {
    try {
        let filter = {
            courier: req.session.user._id
        };

        if (req.query.status) {
            filter.status = req.query.status;
        } else {
            filter.status = { $in: ['Entregue', 'Cancelada'] };
        }

        const orders = await Order.find(filter)
            .populate('supermarket')
            .populate('client')
            .populate('products.productId');

        res.render('partials/orders/ordersTable', { orders, actionType: 'none'});

    } catch (err) {
        return renderError(req, res, 500, "Erro ao mostrar filtro do histórico de entregas", err)
    }
};

// formulario para editar detalhes do estafeta
courierController.settingsForm = async function(req, res) {
    try {
        const courier = await User.findById(req.session.user._id);

        if (!courier) {
            return res.redirect("/courier/dashboard");
        }

        res.render("courier/settings", {courier, isOwner: true} );
    } catch (err) {
        console.log("Erro ao abrir settings:", err);
        res.redirect("/courier/dashboard");
    }
};


courierController.updateSettings = async (req, res) => {
    try {
        const { id } = req.params
        const { name, email, phoneNumber, address } = req.body

        const courier = await User.findByIdAndUpdate(
            id,
            { name, email, phoneNumber, address },
            { new: true } // devolve o atualizado
        )

        if (!courier) {
            return res.status(404).send('Estafeta não encontrado')
        }

        req.session.user = courier

        res.redirect(`/courier/show/${id}`)

    } catch (err) {
        return renderError(req, res, 500, 'Erro ao atualizar estafeta', err)
    }
}


// atualizar estado da entrega
courierController.updateStatus = async (req, res) => {
    try {
        const update = {
            status: req.body.status
        };

        if (req.body.status === "Entregue") {
            update.deliveryDate = new Date();
        }

        await Order.findOneAndUpdate(
            {
                _id: req.params.id,
                courier: req.session.user._id
            }, 
            update
        );

        res.redirect('/courier/currentDeliveries');

    } catch (err) {
        return renderError(req, res, 500, "Erro ao atualizar estado da entrega", err);
    }
};

async function getStats(courierId) {
    const objectId = new mongoose.Types.ObjectId(courierId);
    const { start, end } = getMonthRange();

    const totalDeliveries = await Order.countDocuments({
        courier: courierId,
        status: "Entregue"
    });

    const monthDeliveries = await Order.countDocuments({
        courier: courierId,
        status: "Entregue",
        deliveryDate: { $gte: start, $lt: end }
    });

    const topSupermarkets = await Order.aggregate([
        { $match: { courier: objectId, status: "Entregue" } },
        { $group: { 
            _id: "$supermarket", 
            count: { $sum: 1 } 
        }},
        { $sort: { count: -1 } },
        { $limit: 3 },
        { $lookup: {
            from: "supermarkets", 
            localField: "_id",
            foreignField: "_id",
            as: "marketDetails"
        }},
        { $unwind: "$marketDetails" }
    ]);

    const totalEarningsResult = await Order.aggregate([
        { $match: { courier: objectId, status: "Entregue" }},
        { $group: { 
            _id: null, 
            total: { $sum: "$deliveryCost" }
        }}
    ]);

    const totalEarnings = totalEarningsResult[0]?.total || 0;

    const monthEarningsResult = await Order.aggregate([
        { $match: { 
            courier: objectId,
            status: "Entregue",
            deliveryDate: { $gte: start, $lt: end }
        }},
        { $group: { 
            _id: null, 
            total: { $sum: "$deliveryCost" }
        }}
    ]);

    const monthEarnings = monthEarningsResult[0]?.total || 0;

    const reviews = await Review.find({
        courier: courierId,
        courierRating: { $exists: true }
    });

    const totalReviews = reviews.length;

    let totalRating = 0;

    for (const review of reviews) {
        totalRating += review.courierRating;
    }

    const averageRating =
    totalReviews > 0
        ? (totalRating / totalReviews).toFixed(1)
        : 0;

    return {
        totalDeliveries,
        monthDeliveries,
        totalEarnings,
        monthEarnings,
        averageRating,
        totalReviews,

        topSupermarkets: topSupermarkets.map(s => ({
            id: s._id,
            name: s.marketDetails.name,
            count: s.count
        }))
    };
}

courierController.show = async (req, res) => {
    try {
        const courier = await User.findById(req.params.id);

        if (!courier || courier.role !== "courier") {
            return renderError(req, res, 404, "Estafeta não encontrado");
        }

        const stats = await getStats(courier._id); 

        const isOwner = req.session.user && req.session.user._id.toString() === courier._id.toString();

        res.render('courier/show', {
            courier,
            stats,
            isOwner,
        });

    } catch (err) {
        return renderError(req, res, 500, "Erro ao mostrar estafeta", err);
    }
};

async function getAvailableDeliveries() {
    return await Order.find({
        deliveryMethod: "Entrega ao domicilio",
        courier: null,
        status: 'Confirmada',
    })
    .populate('supermarket')
    .populate('client')
    .populate('products.productId')
}

courierController.reviews = async (req, res) => {

    const reviews = await Review.find({ courier: req.params.id})
        .populate('client', 'name');

    res.render('courier/reviews', { reviews, type: 'courier'});
};


module.exports = courierController;