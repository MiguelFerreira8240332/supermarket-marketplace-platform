var mongoose = require("mongoose");
var Order = require("../models/order");
var Product = require("../models/product");
var Supermarket = require("../models/supermarket");
var User = require("../models/user");
const supermarket = require("../models/supermarket");
const Category = require('../models/category');
const Notification = require("../models/notification");
const { sendNotificationEmail } = require('./utils/mailer.js');
const Review = require('../models/review');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { renderError } = require('./utils/errorHandler');
const { buildOrderSummary } = require('./utils/orderMessage');

var orderController = {};

const now = new Date();


orderController.show = async function(req, res){
    try{
        const orderFound = await Order.findById(req.params.id).populate('supermarket').populate('products.productId').populate('client');

        if (!orderFound){
            return renderError(req, res, 400, "Encomenda não encontrada")
        }

        res.render("orders/show", {order: orderFound, isCourier: req.session.user?.role === 'courier'});

    }catch (err){
        return renderError(req, res, 500, "Erro ao mostra encomenda", err)
    };
}

orderController.save = async function(req, res){
    const order = new Order(req.body);
    try{
        await order.save();

        console.log("A sua encomenda foi processada com sucesso");
        res.redirect(`/orders/show/${order._id}`);

    }catch (err){
        console.error("Erro ao salvar encomenda:", err);

        const supermarkets = await Supermarket.find();
        const products = await Product.find();
        const users = await User.find({role: 'client'});

        res.render("orders/create", {
            supermarkets,
            products,
            users
        });
    };
}

orderController.updateStatus = async function(req, res){
    try{
        const { status } = req.body;

        if (status === 'Cancelada') {
            return orderController.cancel(req, res);
        }

        const update = { status };

        if (status === "Entregue") {
            update.deliveryDate = new Date();
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            update,
            { new: true }
        );

        res.redirect(`/orders/show/${order._id}`);

    } catch (err){
        return renderError(req, res, 500, "Erro ao atualizar estado da encomenda", err)
    };
}

orderController.delete = async function(req, res){
    try{
        await Order.findByIdAndDelete(req.params.id);

        console.log("Encomenda eliminada com sucesso.");
        res.redirect('/orders');

    } catch (err){
        return renderError(req, res, 500, "Não foi possivel eliminar a encomenda", err)
    };
}

orderController.create = async function(req, res){
    try {
        const products = Object.values(req.body.products || {});
        const supermarket = req.body.supermarket;

        let totalCost = 0;
        let totalProducts = [];
        let deliveryCost = 0;

        const supermarketFound = await Supermarket.findById(supermarket);

        if (!supermarketFound){
            return renderError(req, res, 400, "Supermercado não encontrado")
        } 


        for(let product of products){
            const productFound = await Product.findById(product.productId);

            if(!productFound){
                return renderError(req, res, 400, "Um dos produtos selecionados nao pertence ao catalogo. Por favor verifique os dados")
            }

            if(productFound.supermarket.toString() !== supermarket.toString()){
                return res.status(404).send("Um dos produtos selecionados nao pertence ao supermercado!");
            }

            const amount = Number(product.amount);

            if (amount > productFound.stock) {
                return renderError(req, res, 400, `Nao temos stock suficente de: ${productFound.name}. ` + `Stock disponivel: ${productFound.stock}, Pedido: ${product.amount}`)
            }

            const price = productFound.price;
            totalCost += price * amount;

            totalProducts.push({
                productId: productFound._id,
                amount,
                price
            });

            productFound.stock -= amount;
            await productFound.save();
        }

        if (req.body.deliveryMethod === "Entrega ao domicilio") {
            deliveryCost = supermarketFound.deliveryCosts?.courier || 0; 
        } else {
            deliveryCost = supermarketFound.deliveryCosts?.pickup || 0; 
        }

        totalCost += deliveryCost

        const order = new Order({
            client: req.body.client,
            supermarket,
            products: totalProducts,
            deliveryMethod: req.body.deliveryMethod,
            deliveryCost: deliveryCost,
            totalValue: totalCost,
            status: "Pendente"
        });

        await order.save();

        try {
            const session = await stripe.checkout.sessions.create({
                line_items: [{
                    price_data: {
                        currency: 'eur',
                        product_data: { name: `Encomenda #${order._id} - ${req.body.deliveryMethod}` },
                        unit_amount: Math.round(totalCost * 100),
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${req.protocol}://${req.get('host')}/orders/payment-success/${order._id}`,
                cancel_url: `${req.protocol}://${req.get('host')}/orders/show/${order._id}?status=Cancelada`,
            });

            return res.redirect(303, session.url);

        } catch (stripeError) {
            console.error(stripeError);
            return res.redirect(`/orders/show/${order._id}?error=stripe_unavailable`);
        }

    } catch (err){
        return renderError(req, res, 500, "Não foi possivel criar a encomenda", err)
    };
};


orderController.cancel = async function(req, res){
    try {
        const order = await Order.findById(req.params.id);

        if (!order){
            return renderError(req, res, 500, "Encomenda não encontrada")
        }

        const now = new Date();
        const orderDate = order.confirmationDate || order.orderDate;

        const timePassed = (now - orderDate) / (1000 * 60);

        if(timePassed > 5){
            return renderError(req, res, 400, 'Ja passaram mais de 5 minutos desde que a sua encomenda foi criada. Ja nao e possivel cancelar!')

        }

        if (order.products && order.products.length > 0) {
            for (const item of order.products) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: item.amount } 
                });
            }
        }

        order.status = 'Cancelada';
        await order.save();

        console.log("A sua encomenda foi cancelada com sucessor.");
        res.redirect(`/orders/show/${order._id}`);

    }catch(err){
        return renderError(req, res, 500, "Não foi possivel cancelar a encomenda", err)
    };
};

orderController.successfulPayment = async function (req, res) {
    try{
        const order = await Order.findById(req.params.id);

        if(!order){
             return renderError(req, res, 400, "Encomenda não encontrada")
        }

        order.status = 'Confirmada';
        order.confirmationDate = new Date();
        await order.save();

        res.redirect(`/orders/show/${order._id}`);

    }catch (err){
        return renderError(req, res, 500, "Não foi possivel confirmar o pagamento", err)
    };
};

orderController.newOrder = async function (req, res){
    try{
        const supermarkets = await Supermarket.find();
        const products = await Product.find();
        const users = await User.find({role: 'client'});

        res.render('orders/counterSale', {
            title: 'Nova Encomenda',
            supermarkets,
            products,
            users
        });
    }catch(err){
        return res.status(500).send('Erro ao carregar a página');
    }
};

orderController.list = async function (req, res){
    try {

        const filters = {};

        if (req.query.status) {
            filters.status = req.query.status;
        }

        if (req.query.deliveryMethod) {
            filters.deliveryMethod = req.query.deliveryMethod;
        }

        const orders = await Order.find(filters)
            .populate('supermarket')
            .populate('client')
            .populate('products.productId');

        res.render('orders/index', {
            orders,
            query: req.query
        });

    } catch(err){
        console.error(err);
        res.status(500).send("Erro ao carregar encomendas");
    }
};

orderController.edit = async function (req, res){
    try {
        const order = await Order.findById(req.params.id).populate('client');
    
        if(!order){
            return res.status(404).send("Encomenda não encontrada");
        }
    
        res.render('orders/edit', { order });
    
    } catch (err){
        console.error(err);
        res.status(500).send("Erro ao carregar encomenda");
    }
};

orderController.counterSale = async function(req, res){
    try {
        marketId = req.session.supermarketId;

        if(!marketId){
            res.status(500).send("Supermercado não encontrado.");
            //return res.redirect('auth/login');
        }

        const products = await Product.find({ supermarket: marketId, active: true })
        .populate('category');
        const users = await User.find({ role: 'client' });
        const marketInfo = await Supermarket.findById(marketId);

        const categories = await Category.find();

        res.render('orders/counterSale', {
            supermarket: marketInfo,
            products: products,
            users: users,
            categories: categories,
            supermarkets: [marketInfo]
        });

    }catch (err){
        res.status(500).send("Erro ao carregar dados");
    }
}


// ----------------------------------------- api frontoffice ------------------------------------

orderController.apiOrdersCount = async (req, res) => {
    try {
        const count = await Order.countDocuments(
            {client: req.user.id,
            status: { $ne: 'Cancelada' }
        });

        res.json({ count });
    } catch (err) {
        res.status(500).json({
            error: 'Erro ao contar encomendas'
        });

    }
};
orderController.apiOngoingOrders = async (req, res) => {
    try {
        const orders = await Order.find({ 
            client: req.user.id,
            status: { $in: ['Pendente', 'Confirmada', 'Em processamento', 'Em entrega'] }
        })
        .populate('supermarket')
        .populate('products.productId')
        .sort({ orderDate: -1 });
        
        for (const order of orders) {
            const review = await Review.findOne({ order: order._id});
            order._doc.hasReview = !!review;
        }
        
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar encomendas' });
    }
};

orderController.apiFinishedOrders = async (req, res) => {
    try {
        const query = {
            client: req.user.id,
            status: { $in: ['Entregue', 'Cancelada'] }
        };
        
        const orders = await Order.find(query)
                .populate('supermarket')
                .populate('products.productId')
                .sort({ orderDate: -1 })

        for (const order of orders) {
            const review = await Review.findOne({
                order: order._id
            });
            order._doc.hasReview = !!review;
        }
        
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar histórico' });
    }
};

orderController.apiCancel = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ error: 'Encomenda não encontrada' });

        if (order.client.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Sem permissão' });
        }

        const now = new Date();
        const orderDate = order.confirmationDate || order.orderDate;
        const timePassed = (now - orderDate) / (1000 * 60);

        if (timePassed > 5) {
            return res.status(400).json({ error: 'Já passaram mais de 5 minutos. Não é possível cancelar' });
        }

        if (order.products && order.products.length > 0) {
            for (const item of order.products) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: item.amount }
                });
            }
        }

        order.status = 'Cancelada';
        await order.save();

        const title = 'Encomenda cancelada';
        const message = `A encomenda #${order._id} foi cancelada`;
        const user = await User.findById(req.user.id);

        await Notification.create({
            user: req.user.id,
            title,
            message
        });

        const populatedOrder = await Order.findById(req.params.id)
            .populate('supermarket')
            .populate('products.productId');
             
        const emailMessage = `${message}\n${buildOrderSummary(populatedOrder)}`;
        await sendNotificationEmail(user.email, title, emailMessage);

        res.json({ message: 'Encomenda cancelada com sucesso' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao cancelar encomenda' });
    }
};

orderController.apiCreateOrder = async (req, res) => {
    try {
        const client = req.user.id;

        const {supermarket, deliveryMethod, products } = req.body;

        if (!products || products.length === 0) {
            return res.status(400).json( {error: 'Carrinho vazio' });
        }

        const supermarketFound = await Supermarket.findById(supermarket);

        if (!supermarketFound) {
            return res.status(404).json({ error: 'Supermercado não encontrado' });
        }

        if (!supermarketFound.deliveryMethods.includes(deliveryMethod)) {
            return res.status(400).json({ error: 'Método de entrega inválido'});
        }

        let totalCost = 0;
        let totalProducts = [];
        let deliveryCost = 0;

        for (const item of products) {
            const productFound = await Product.findById(item.productId);

            if (!productFound) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }

            if ( productFound.supermarket.toString() !== supermarket.toString() ) {
                return res.status(400).json({  error: 'Produtos de supermercados diferentes' });
            }

            const amount = Number(item.amount);

            if (amount > productFound.stock) {
                return res.status(400).json({ error: `Stock insuficiente para ${productFound.name}` });
            }

            const price = productFound.price;

            totalCost += price * amount;

            totalProducts.push({
                productId: productFound._id,
                amount,
                price
            });
        }

        if (deliveryMethod === 'Entrega ao domicilio') {
            deliveryCost = supermarketFound.deliveryCosts?.courier || 0;
        } else {
            deliveryCost = supermarketFound.deliveryCosts?.pickup || 0;
        }

        let normalizedMethod = deliveryMethod;

        if (deliveryMethod === 'entrega por estafeta') {
            normalizedMethod = 'Entrega ao domicilio';
        }

        if (deliveryMethod === 'levantamento em loja') {
            normalizedMethod = 'Levantamento em loja';
        }

        totalCost += deliveryCost;


        for (const item of products) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.amount } });
        }

        const order = new Order({
            client,
            supermarket,
            products: totalProducts,
            deliveryMethod: normalizedMethod,
            deliveryCost,
            totalValue: totalCost,
            status: 'Pendente'
        });

        await order.save();

        const title = 'Encomenda criada';
        const message = `A encomenda #${order._id} foi criada com sucesso.`;
        const user = await User.findById(req.user.id);

        await Notification.create({
            user: req.user.id,
            title,
            message
        });

        const populatedOrder = await Order.findById(order._id)
            .populate('supermarket')
            .populate('products.productId');

        const emailMessage = `${message}\n${buildOrderSummary(populatedOrder)}`;
        await sendNotificationEmail(user.email, title, emailMessage);

        res.status(201).json(populatedOrder);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar encomenda'});
    }
};


orderController.apiCreatePayment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ error: 'Encomenda não encontrada' });
        if (order.client.toString() !== req.user.id) return res.status(403).json({ error: 'Sem permissão' });

        const session = await stripe.checkout.sessions.create({
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: { name: `Encomenda #${order._id}` },
                    unit_amount: Math.round(order.totalValue * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/api/orders/api-payment-success/${order._id}`,
            cancel_url: `http://localhost:4200/order-history`,
        });

        const title = `Encomenda pendente`;
        const message = `A encomenda #${order._id} aguarda pagamento`;
        const user = await User.findById(req.user.id);

        await Notification.create({
            user: req.user.id,
            title,
            message
        });

        const populatedOrder = await Order.findById(req.params.id)
            .populate('supermarket')
            .populate('products.productId');

        const emailMessage = `${message}\n${buildOrderSummary(populatedOrder)}`;
        await sendNotificationEmail(user.email, title, emailMessage);

        res.json({ url: session.url });

    } catch (err) {
        res.status(500).json({ error: 'Erro ao criar pagamento' });
    }
};

orderController.apiSuccessfulPayment = async function (req, res) {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Encomenda não encontrada' });

        order.status = 'Confirmada';
        order.confirmationDate = new Date();
        await order.save();

        const user = await User.findById(order.client);

        const title = 'Encomenda confirmada';
        const message = `Pagamento #${order._id} realizado com sucesso`;

        await Notification.create({
            user: order.client,
            title,
            message
        });

        const populatedOrder = await Order.findById(req.params.id)
            .populate('supermarket')
            .populate('products.productId');
        const emailMessage = `${message}\n${buildOrderSummary(populatedOrder)}`;
        await sendNotificationEmail(user.email, title, emailMessage);


        res.redirect(`http://localhost:4200/order-history?order=${order._id}`);
    } catch (err) {
        res.status(500).json({ error: 'Não foi possivel confirmar o pagamento' });
    }
};

module.exports = orderController;