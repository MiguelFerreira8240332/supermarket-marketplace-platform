const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'O nome é obrigatório'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'O e-mail é obrigatório'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, introduza um e-mail válido']
    },
    password: {
        type: String,
        required: [true, 'A password é obrigatória'],
        minlength: [6, 'A password deve ter pelo menos 6 caracteres']
    },
    address: {
        type: String,
        required: [true, 'A morada é obrigatória'] 
    },
    phoneNumber: {
        type: String,
        required: [true, 'O número de telefone é obrigatório'],
        match: [/^[0-9]{9}$/, 'O número de telefone deve ter exatamente 9 dígitos'] 
    },
    role: {
        type: String,
        required: true,
        enum: {
            values: ['client', 'supermarket', 'courier', 'admin'],
            message: '{VALUE} não é um perfil válido'
        },
    }
}, {
    timestamps: true // Cria automaticamente campos createdAt e updatedAt
});

module.exports = mongoose.model('User', userSchema);