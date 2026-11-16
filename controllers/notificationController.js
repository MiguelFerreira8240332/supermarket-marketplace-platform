const Notification = require('../models/notification');

exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            user: req.user.id
        })
        .sort({ createdAt: -1 })
        .limit(10);

        res.json(notifications);

    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
}

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, seen: false},
            { seen: true }
        );

        res.json({ message: 'Notificações atualizadas' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar notificações' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({_id: req.params.id, user: req.user.id});

        if (!notification) {
            return res.status(404).json({ error: 'Notificação não encontrada'});
        }

        notification.seen = true;
        await notification.save();

        res.json({ message: 'Notificação marcada como lida' });

    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar notificação' });
    }
};

