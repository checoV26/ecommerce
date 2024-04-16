
const { executeQuerry } = require('../../db');
const { logger } = require('../../logger');
const { validateCliente, encriptarContrasena } = require('../validators/clients');

const controller = {

    registerClient: async (req, res) => {
        logger.info('Petición recibida en create_userclient');
        const userclient = req.body;
        const query = 'INSERT INTO clients_users (nombre, apellidoP, apellidoM, correo, USER, PASSWORD) VALUES (?, ?, ?, ?, ?, ?)';
        const validation = validateCliente(userclient);
        if (validation) {
            logger.info('Datos incorrectos o faltantes', { validation });
            res.status(400).json({
                statusCode: 400,
                status: 'warning',
                message: '¡Datos incorrectos!',
                data: validation
            });
        } else {
            const passwordHash = await encriptarContrasena(userclient.password);
            const data = [userclient.nombre, userclient.apellidoP, userclient.apellidoM, userclient.correo, userclient.user, passwordHash];
            try {
                const result = await executeQuerry(query, data);
                const insertID = result.insertId.toString();
                res.status(200).json({
                    statusCode: 200,
                    status: 'success',
                    message: 'Guardado',
                    data: insertID
                });
                logger.info("Usuario registrado:", { data, "id obtenido": insertedId });
            } catch (error) {
                if (error.code === "ER_DUP_ENTRY") {
                    res.status(400).json({
                        statusCode: 400,
                        status: 'warning',
                        message: "El usuario que intenta ingresar ya existe",
                        data: []
                    });
                    logger.error("Los siguientes campos ya existen:", data);
                } else {
                    logger.error("Error al ejecutar la consulta SQL", {
                        query: query,
                        data: data,
                        error: error,
                    });
                    res.status(409).json({
                        statusCode: 409,
                        status: "error",
                        message: "Error al ejecutar la consulta",
                    });
                }
            }
        }
    },

    getClient: async (req, res) => {
        const client_id = req.params.id;
        logger.info("Petición recibida en /cliente/"+ client_id);
        const query = 'SELECT * FROM clients_users WHERE id=?';   
        if(!client_id || isNaN(client_id)) {
            logger.info("El cliente no es valido, id a consultar: " + client_id);
            res.status(400).json({
                statusCode: 400,
                status: 'warning',
                message: '¡El cliente no es válido!',
                data: []
            });
        } else {
            try {
                const result = await executeQuerry(query, [client_id]);
                if (result.length > 0) {
                    res.status(200).json({
                        statusCode: 200,
                        status: 'success',
                        message: 'Consulta correctamente',
                        data: result
                    });
                    logger.info('Consulta de datos del cliente con id: ' +client_id, {
                        result
                    });
                } else {
                    res.status(200).json({
                        statusCode: 200,
                        status: 'success',
                        message: 'No se encontro informacion',
                        data: result
                    });
                    logger.info(
                        'Se consultaron los datos del cliente con id: ' +client_id+' no se encontro información',
                        { result }
                    );
                }
            } catch (error) {
                logger.error('Error al ejecutar la consulta', {
                    query: query,
                    error: error
                });
                res.status(500).json({
                    statusCode: 500,
                    status: 'error',
                    message: 'Error al actualizar'
                });
            }
        }
    }
}

module.exports = controller;