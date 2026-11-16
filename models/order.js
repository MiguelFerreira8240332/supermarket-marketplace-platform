
var mongoose = require('mongoose');

var OrderSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId, 
        ref:'User', required: true
    },
    courier: {
        type: mongoose.Schema.Types.ObjectId, 
        ref:'User', 
        default: null
    },
    supermarket: {
        type: mongoose.Schema.Types.ObjectId, 
        ref:'Supermarket', 
        required: true
    },
    products: [{ 
        productId: {type: mongoose.Schema.Types.ObjectId, ref:'Product', required: true},
        amount: {type: Number, required: true, min: 1},
        price: {type: Number, required: true, min: 0}
    }], 
    orderDate: {
        type: Date, 
        required:true, 
        default: Date.now
    },
    confirmationDate: {
        type: Date
    },
    totalValue:{
        type: Number, 
        required: true
    }, 
    deliveryCost: {
        type: Number, 
        required: true, 
        default: 3
    },
    deliveryMethod: {
        type: String, 
        enum:['Levantamento em loja', 'Entrega ao domicilio'], 
        required: true
    },
    status: {
        type: String, 
        enum: ['Pendente', 'Confirmada', 'Em processamento', 'Em entrega', 'Entregue', 'Cancelada'], 
        default: 'Pendente'
    },
    deliveryDate: {
    type: Date
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Order', OrderSchema);

