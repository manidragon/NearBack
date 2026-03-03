
const express = require('express');
const ChatboatController = require('../controllers/ChatboatController');


const router = express.Router();

router.post('/', ChatboatController.simpleChat);
router.post('/product/:productId', ChatboatController.askProductQuestionController);


module.exports = router;
