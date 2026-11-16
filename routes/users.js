var express = require('express');
const userController = require('../controllers/user');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/findOrCreate', userController.findOrCreateClient);


module.exports = router;
