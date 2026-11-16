// controllers/reviewController.js

const Review = require('../models/review');
const Order = require('../models/order');

const reviewController = {};

reviewController.create = async (req, res) => {
    try {
        const { orderId, 
            supermarketRating, supermarketComment,
            courierRating,courierComment
        } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Encomenda não encontrada' });
        }

        if (order.client.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Sem permissão' });
        }

        if (order.status !== 'Entregue') {
            return res.status(400).json({ error: 'A encomenda ainda não foi entregue' });
        }

        const existingReview = await Review.findOne({ order: orderId });

        if (existingReview) {
            return res.status(400).json({ error: 'Esta encomenda já foi avaliada' });
        }

        if (!supermarketRating && !courierRating) {
            return res.status(400).json({ error: 'Tens de avaliar pelo menos um serviço'});
        }

        const review = new Review({
            order: orderId,
            client: req.user.id,
            supermarket: order.supermarket,
            courier: order.courier || null,

            supermarketRating,
            supermarketComment,

            courierRating,
            courierComment
        });

        await review.save();

        res.status(201).json(review);

    } catch (err) {
        res.status(500).json({ error: 'Erro ao criar avaliação'});
    }
};


reviewController.getSupermarketReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ 
            supermarket: req.params.id,
            supermarketRating: { $ne: null }
            })
                .populate('client', 'name')
                .sort({ createdAt: -1 });

        res.json(reviews);

    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar avaliações' });
    }
};


reviewController.getCourierReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ 
            courier: req.params.id,
            courierRating: { $ne: null }
            })
                .populate('client', 'name')
                .sort({ createdAt: -1 });

        res.json(reviews);

    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar avaliações' });
    }
};

module.exports = reviewController;