require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var session = require("express-session");
var { renderError } = require('./controllers/utils/errorHandler')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var orderRoutes = require('./routes/orderRoutes');
var categoryRoutes = require('./routes/categoryRoutes');
var productRoutes = require('./routes/productRoutes');
var authRouter = require('./routes/auth');
var supermarketRoutes = require('./routes/supermarketRoutes');
var adminRoutes = require('./routes/adminRoutes');
var courierRoutes = require('./routes/courierRoutes');
var apiRoutes = require('./routes/api');

var cors = require('cors');
var cron = require('node-cron');
var Order = require('./models/order'); 
var Product = require('./models/product');
var swaggerUi = require('swagger-ui-express');
var swaggerDocument = require('./swagger.json');

var app = express();

var dbURI = process.env.MONGODB_URI;
if (!dbURI) {
  console.error('Missing MONGODB_URI environment variable (see .env.example)');
  process.exit(1);
}

mongoose.connect(dbURI)
  .then(function() { 
    console.log(' MongoDB ligado: paw_ac_2'); 
  })
  .catch(function(err) { 
    console.error(' Erro na ligação:', err); 
  });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || "dev-only-change-me",
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/categories', categoryRoutes); 
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/auth', authRouter);
app.use('/supermarket', supermarketRoutes);
app.use('/admin', adminRoutes);
app.use('/courier', courierRoutes);
app.use("/api", apiRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// errorHandlers
app.use(function(req, res, next) {
  renderError(req, res, 404, "Página não encontrada");
});

// errorHandler
app.use(function(err, req, res, next) {
  console.error("Erro não tratado:", err);
  const statusCode = err.status || 500;
  const message = req.app.get('env') === 'development'
    ? err.message
    : "Ocorreu um erro interno.";
  renderError(req, res, statusCode, message);
});

cron.schedule('* * * * *', async () =>{
  try {
    const maxTime = new Date(Date.now() - 5 * 60 * 1000);

    const pendentOrders = await Order.find({
      status: 'Pendente',
      orderDate: { $lt: maxTime } 
    });

    if(pendentOrders.length > 0){
      for (const order of pendentOrders){
        for(const product of order.products){
          await Product.findByIdAndUpdate(product.productId, {
            $inc: { stock: product.amount }
          });
        }

        order.status = 'Cancelada';
        await order.save();
      }
    }


  } catch (err) {
    console.error('[CRON ERROR]:', err);
  }
})


module.exports = app;
