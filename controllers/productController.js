const Product = require('../models/product')
const Category = require('../models/category')
const Supermarket = require('../models/supermarket')
const Favorite = require('../models/favorites');

const multer = require('multer')
const path = require('path')
const fs = require('fs')

const { renderError } = require('./utils/errorHandler')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + path.extname(file.originalname))
    }
})

exports.upload = multer({storage: storage})

// mostrar lista de produtos (vai usar depois a api para mostrar os produtos)
exports.list = async (req,res, sort = 1) => {
    try {
        const categories = await Category.find().sort({ name: 1 })
        const supermarkets = await Supermarket.find({isApproved: true}).sort({ name: 1 })
        
        res.render('products/index', {
            isOwner: false, // aqui nao vamos passar pk o market tem a area dele especial
            goback: req.get('Referer') || '/products',
            categories: categories,
            supermarkets: supermarkets
        })
    } catch (err) {
        return renderError(req, res, 500, "Não foi possivel listar os produtos", err)
    }
}

    // mostrar a lista de produtos do supermercado (vai usar a api para os ir buscar na vista)
    exports.listFromSession = async (req, res) => {
        try {
            const categories = await Category.find().sort({ name: 1 })
            const supermarkets = await Supermarket.find({isApproved: true}).sort({ name: 1 })

            res.render('products/index', {
                goback: req.get('Referer') || '/supermarket/dashboard',
                isOwner: true,
                categories: categories,
                supermarkets: supermarkets,
                mysupermarket: req.session.supermarketId
                    
            })
        } catch (err) {
            return renderError(req, res, 500, "Não foi possivel mostrar os produtos", err)

        }
    }

// mostrar formulário para criar produto
exports.create = async (req,res) => {
    try {
        const categories = await Category.find().sort({ name: 1 })
        
        res.render('products/create', { categories})
    } catch (err) {
        return renderError(req, res, 500, "Não foi possivel mostrar o formulário de criação do produto", err)
    }
}

exports.show = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category')
            .populate('supermarket')

        if (!product) {
            return renderError(req, res, 400, "Produto não encontrado")
        }
        
        // verificar se o supermercado com login é o dono do produto
        const isOwner = req.session.supermarketId && req.session.supermarketId.toString() === product.supermarket._id.toString()
        
        res.render('products/show', { 
            product, 
            goback: req.get('Referer') || (isOwner ? '/supermarket/dashboard' : '/products'),
            isOwner  
        })
    } catch (err) {
        return renderError(req, res, 500, "Não foi possivel mostrar a página do produto", err)
    }
}

exports.edit = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            supermarket: req.session.supermarketId,
            active: true
        });

        const categories = await Category.find().sort({ name: 1 });

        if (!product) {
            return renderError(req, res, 400, "Produto não encontrado para edição")
        }

        const goback = '/supermarket/products';

        res.render('products/edit', { product, categories, goback });
    } catch (err) {
        return renderError(req, res, 500, "Não foi possivel editar o produto", err)
    }
};

exports.update = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            supermarket: req.session.supermarketId,
            active: true
        });

        if (!product) {
            return renderError(req, res, 400, 'Produto não encontrado')
        }

        const message = validate(req.body, true);

        if (message) {
            return renderError(req, res, 400, message)
        }

        let imageName = product.image;
          
        if (req.file) {
            if (product.image && product.image !== 'defaultProduct.jpg') {
                const oldImagePath = path.join(__dirname, '../public/images/', product.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            imageName = req.file.filename;
        }

        await Product.findByIdAndUpdate(req.params.id, {
            name: req.body.name.trim(),
            description: req.body.description?.trim() || '',
            price: Number(req.body.price),
            stock: Number(req.body.stock),
            image: imageName,
            category: req.body.category,
            supermarket: req.session.supermarketId
        });

        res.redirect('/supermarket/products');
        
    } catch (err) {
        return renderError(req, res, 500, "Não foi possivel atualizar o produto", err)
    }
};

exports.save = async (req,res) => {
    try {
        const message = validate(req.body)

        if (message) {
            return renderError(req, res, 400, message)
        } 

        // a terminologia = ?.trim() nao executa trim ao contrario do ternario se for 0 ou false executa
        await Product.create({
            name: req.body.name.trim(),
            description: req.body.description?.trim() || '',
            price: Number(req.body.price),
            stock: Number(req.body.stock),
            image: req.file ? req.file.filename : 'defaultProduct.jpg',
            category: req.body.category,
            supermarket: req.session.supermarketId,
        })

        res.redirect('/supermarket/products');
    } catch (err) {
        return renderError(req, res, 500, "Erro ao criar o produto", err)
    }
}

exports.delete = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            supermarket: req.session.supermarketId,
            active: true
        });
        
        if (!product) {
            return renderError(req, res, 400, "Produto não encontrado para apagar")
        }
        
        await Product.findByIdAndUpdate(req.params.id, { active: false });
        
        if (product.image && product.image !== 'defaultProduct.jpg') {
            const imagePath = path.join(__dirname, '../public/images/', product.image);
            
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log('Imagem apagada:', product.image);
            }
        }
        
        res.redirect('/supermarket/products'); 
        
    } catch (err) {
        return renderError(req, res, 500, "Erro ao apagar o produto", err)
    }
};

exports.listAPI = async (req, res) => {
    try {
        let filter = { active: true }

        const page = parseInt(req.query.page) || 1

        if (req.session.supermarketId) {
            filter.supermarket = req.session.supermarketId
        }

        if (req.query.name) {
            filter.name = { $regex: req.query.name, $options: 'i' }
        }

        if (req.query.category) {
            filter.category = req.query.category
        }

        if (req.query.supermarket) {
            filter.supermarket = req.query.supermarket
        }

        const sort = req.query.sort === 'created'
            ? { createdAt: -1 }
            : { name: 1 }
        

        const products = await Product.find(filter)
            .populate('category')
            .populate('supermarket')
            .sort(sort)
            .skip((page-1) * 4)
            .limit(4)

        res.render('partials/products/productsList', { 
            products,
            showAddToCart: req.query.context === 'sale'
        })

    } catch (err) {
        return renderError(req, res, 500, "Erro ao filtrar produtos", err)
    }
}

// ------------------------------ API PARA FRONTOFFICE -----------------------------------------------

exports.listapi = async (req, res) => {
  try {
    const { search, category, supermarket } = req.query;

    let filter = {active: true};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    if (supermarket) filter.supermarket = supermarket;
    

    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const products = await Product.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('category')
    .populate('supermarket');

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
};

function validate(data) {
    if (!data.name || data.name.trim() === '') {
        return 'O nome do produto é obrigatório'
    }

    if (!data.price || Number(data.price) < 0) {
        return 'Preço do produto inválido'
    }

    if (!data.stock || Number(data.stock) < 0) {
        return 'Stock do produto inválido'
    } 

    if (!data.category) {
        return 'Categoria obrigatória para produto'
    }


    return null; // se não houver erros
}





