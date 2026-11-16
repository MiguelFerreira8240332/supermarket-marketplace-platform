const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
    {
        name: { // nome do produto
            type: String, 
            required: true,
            trim: true
        },
        
        description: {  // descrição do produto
            type: String,
            default: '',
            trim: true
        },

        price: { // preço do produto (>0)
            type: Number,
            required: true,
            min: 0
        },

        stock: { // stock do produto (>0)
            type: Number,
            required: true,
            min: 0
        },

        image: { // imagem do produto
            type: String, 
            default: 'defaultProduct.jpg'
        },

        category: {  // referencia á categoria do produto (FK)
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true
        },

        supermarket: {  // referencia ao supermercado (FK)
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supermarket',
            required: true
        },

        active: { type: Boolean, default: true }
    },
    
    { timestamps: true } // coloca os campos updatedAt, createdAt
)

module.exports = mongoose.model('Product', productSchema)