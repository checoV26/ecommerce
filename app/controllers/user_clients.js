
// const { executeQuerry } = require("./db.js");
const { executeQuerry } = require('../../db');
const controller = {

    // createClients: async (res, req) =>{
    //     logger.info("Petición recibida en /createCliente");
    //     const {user, password} = req.body;
    //     const query = 'INSERT INTO'
    // }
    home: function(req, res){
        return res.status(200).send({
            message: 'Clientes'
        });
    },
    getClients: async (req, res) => {
        const query = 'SELECT * FROM clients_users';    
        return res.json({
            consulta: query,
            message: 'Clientes25'
        });
    }
}


const getItem = () => {
    
}

const createItem = () => {
    
}

const updateItem = () => {
    
}

const deleteItem = () => {
    
}

// module.exports = {getItem, getItems, createItem, updateItem, deleteItem}
module.exports = controller;