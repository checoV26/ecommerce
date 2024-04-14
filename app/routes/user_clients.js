const express = require('express');
const router = express.Router();

const UserClientController = require('../controllers/user_clients');

router.get('/cliente/:id', UserClientController.getClients);
// router.get('/');

// router.get('/:id');

// router.post('/id');

// router.patch('/:id');

// router.delete('/:id');

module.exports = router;