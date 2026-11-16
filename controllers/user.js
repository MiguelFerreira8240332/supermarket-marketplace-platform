var User = require("../models/user");

var userController = {};

userController.showProfile = async (req, res) => {
    try {
        
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return renderError(req, res, 400, "Utilizador não encontrado")
        }

        const isOwner = req.session.user && req.session.user._id.toString() === user._id.toString()
        
        res.render("partials/profile", { 
            profileUser: user, 
            user: req.session.user,
            isOwner
        });
    
    } catch (err) {
        return renderError(req, res, 500, "Não foi possivel mostrar o perfil do utilizador", err)
    }
};

userController.findOrCreateClient = async function(req, res) {
    try {
        const clientData = req.body;

        let created = false;

        let user = await User.findOne({ 
            email: clientData.email 
        });

        if (!user) {
            user = new User({
                name: clientData.name,
                email: clientData.email,
                phoneNumber: clientData.phoneNumber,
                address: 'a ser definido pelo cliente',
                role: 'client',
                password: clientData.password
            });

            await user.save();
            created = true;
        }

        res.status(200).json({ user, created });

    } catch (err) {
        console.log(err);

        res.status(500).json({ 
            error: "Erro ao processar cliente" 
        });
    }
};

userController.update = function(req, res) {
    const updatedData = {
        name: req.body.name,
        address: req.body.address,
        phoneNumber: req.body.phoneNumber
    };

    User.findByIdAndUpdate(req.params.id, updatedData, { new: true }, function(err, user) {
        if (err) return res.render("users/edit", { user: req.body, error: "Erro ao atualizar." });
        res.redirect("/users/profile");
    });
};

userController.delete = function(req, res) {
    User.findByIdAndRemove(req.params.id, function(err) {
        if (err) console.log("Erro ao eliminar:", err);
        res.redirect("/admin/users");
    });
};

// -------------------------------------frontoffice api---------------------------------
userController.apiUpdate = async function(req,res) {
    try {
        const {name, email, address, phoneNumber} = req.body;

        if (!name || !email || !address || !phoneNumber) {
            return res.status(404).json({error: "Alteração não realizada. Todos os campos são obrigatórios"})
        }

        const user = await User.findByIdAndUpdate(
            req.params.id, 
            {name, email, address, phoneNumber},
            {new: true});

        user.password = undefined;

        res.json({
            message: "Alterações gravadas",
            user
        })
    } catch (err) {
        res.status(500).json({error: 'Erro ao atualizar perfil'})
    }
}

module.exports = userController;