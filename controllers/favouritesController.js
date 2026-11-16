const Favourite = require('../models/favorites');

// Adiciona um produto à lista de favoritos do utilizador autenticado
exports.addFavorite = async (req, res) => {
    try {
        await Favourite.findOneAndUpdate(
            { user: req.user.id },
            { $addToSet: { products: req.params.id } },
            { upsert: true }
        );
        res.json({ message: "Adicionado aos favoritos" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao adicionar favorito" });
    }
};

// Remove um produto da lista de favoritos do utilizador autenticado
exports.removeFavorite = async (req, res) => {
    try {
        await Favourite.findOneAndUpdate(
            { user: req.user.id },
            { $pull: { products: req.params.id } }
        );
        res.json({ message: "Removido dos favoritos" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao remover favorito" });
    }
};

// Obtém todos os produtos e supermercados favoritos do utilizador autenticado
exports.getFavorites = async (req, res) => {
    try {
        const favorite = await Favourite.findOne({ user: req.user.id })
            .populate({
                path: 'products',
                populate: { 
                    path: 'category',
                    model: 'Category' 
                }
            })
            .populate('supermarkets');
        res.json(favorite || { products: [], supermarkets: [] });
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar favoritos" });
    }
};

// Adiciona um supermercado à lista de favoritos do utilizador autenticado
exports.addFavoriteSupermarket = async (req, res) => {
    try {
        await Favourite.findOneAndUpdate(
            { user: req.user.id },
            { $addToSet: { supermarkets: req.params.id } },
            { upsert: true }
        );
        res.json({ message: "Supermercado adicionado aos favoritos" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao adicionar favorito" });
    }
};

// Remove um supermercado da lista de favoritos do utilizador autenticado
exports.removeFavoriteSupermarket = async (req, res) => {
    try {
        await Favourite.findOneAndUpdate(
            { user: req.user.id },
            { $pull: { supermarkets: req.params.id } }
        );
        res.json({ message: "Supermercado removido dos favoritos" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao remover favorito" });
    }
};