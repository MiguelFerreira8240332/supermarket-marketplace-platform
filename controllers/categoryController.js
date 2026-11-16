// controller/categoryController.js 

const Category = require('../models/category')
const Product = require('../models/product')

const { renderError } = require('./utils/errorHandler') 

// mostrar a lista de categorias
exports.list = async (req,res) => {
    try {
        const categories = await Category.find().sort({name: 1})
        res.render('categories/index', {categories: categories})

    } catch (err) {
        return renderError(req, res, 500, "Erro ao listar categorias", err)
    }
}

exports.listapi = async (req,res) => {
    res.json(await Category.find().sort({name: 1}))
}

// mostrar formulário ao criar categoria
exports.create = async (req,res) => {
    res.render('categories/create')
}

exports.edit = async (req,res) => {
    try {
        const category = await Category.findOne({_id: req.params.id})

        if (!category) return renderError(req, res, 400, "Categoria não encontrada")
    
        res.render('categories/edit', {category})

    } catch (err) {
        return renderError(req, res, 500, "Não foi possível editar a categoria", err)
    }
}

exports.update = async (req,res) => {
    try {
        const {name} = req.body
        if (!name || name.trim() === '') {
            return renderError(req, res, 400, "Nome para a categoria inválido")
        }
        await Category.findByIdAndUpdate(
            req.params.id, 
            { name: name.trim() },
            { new: true}
        )

        res.redirect('/categories')

    } catch (err) {
        if (err.code === 11000) {
            return renderError(req, res, 400, "Já existe uma categoria com este nome", err)
        }

        return renderError(req, res, 500, "Erro ao eliminar categoria", err)
    }
}

exports.show = async (req,res) => {
    try {
        const category = await Category.findById(req.params.id)

        if (!category) {
            return renderError(req, res, 400, "Categoria não encontrada")
        }

        res.render('categories/show', {category})

    } catch (err) {
        return renderError(req, res, 500, "Erro ao mostrar categoria", err)
    }
}

// gravar na base de dados
exports.save = async (req,res) => {
    try {
        const {name} = req.body

        if (!name || name.trim() === '') {
            return renderError(req, res, 400, 'O nome da categoria é obrigatório')
        }

        await Category.create({name: name.trim()})

        res.redirect('/categories')

    } catch (err) {
        if (err.code === 11000) {
            return renderError(req, res, 400, "Já existe esta categoria na base de dados", err)
        }

        return renderError(req, res, 500, "Não foi possível gravar a categoria", err)
    }
}

exports.delete = async (req, res) => {
    try {
        const categoryId = req.params.id;
       
        const product = await Product.findOne({ category: categoryId });

        if (product) {
            return renderError(req, res, 400, "Não foi possivel apagar a categoria: Existem produtos relacionados")
        }

        await Category.findByIdAndDelete(categoryId);
        res.redirect('/categories');

    } catch (err) {
        return renderError(req, res, 500, "Erro ao apagar categoria", err)
    }
}