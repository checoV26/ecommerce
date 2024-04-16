const express = require('express');
const router = express.Router();

const UserClientController = require('../controllers/user_clients');

router.post('/create_userclient', UserClientController.registerClient);
router.get('/cliente/:id', UserClientController.getClient);
router.put('/update_cliente/:id', UserClientController.updateCliente);

module.exports = router;