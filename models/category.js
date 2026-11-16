const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    
    {
        name: {
            type: String,  // nome: frutas, bebidas, laticinios
            required: true, // obriga a categoria a ter nome
            trim: true,  // "  frutas  " = "frutas"
            unique: true  // impete ter 2 categorias iguais
        }
    },

    { timestamps: true } // cria createdAt e updatedAt 
)

module.exports = mongoose.model('Category', categorySchema)
