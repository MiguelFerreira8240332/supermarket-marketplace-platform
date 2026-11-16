const mongoose = require('mongoose');

const supermarketSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'O supermercado deve ter um utilizador responsável']
    },
    name: {
        type: String,
        required: [true, 'O nome do supermercado é obrigatório'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'A descrição é obrigatória']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'], // Obriga a que seja um "ponto" no mapa
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // Array de números: [longitude, latitude]
            required: true,
            validate: {
                validator: function(v) {
                    // Validação "mesquinha": longitude entre -180/180 e latitude entre -90/90
                    return v.length === 2 && 
                           v[0] >= -180 && v[0] <= 180 && 
                           v[1] >= -90 && v[1] <= 90;
                },
                message: 'Coordenadas inválidas. Use [longitude, latitude].'
            }
        },
        address: { 
            type: String, 
            required: [true, 'A morada descritiva é obrigatória'] 
        }
    },
    openingHours: {
        type: String,
        required: [true, 'O horário de funcionamento é obrigatório']
    },
    deliveryMethods: [{
        type: String,
        enum: {
            values: ['levantamento em loja', 'entrega por estafeta'],
            message: '{VALUE} não é um método válido'
        }
    }],
    deliveryCosts: {
        pickup: { type: Number, default: 0, min: 0 },
        courier: { type: Number, default: 0, min: 0 }
    },
    isApproved: {
        type: Boolean,
        default: false  
    },
    rejectionMessage: { 
        type: String, 
        default: "" 
    },
    image: {
    type: String,
    default: () => {
        const images = [
            'defaultmarket1.jpg',
            'defaultmarket2.jpg',
            'defaultmarket3.jpg',
            'defaultmarket4.jpg'
        ];

        return images[Math.floor(Math.random() * images.length)];
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Supermarket', supermarketSchema);