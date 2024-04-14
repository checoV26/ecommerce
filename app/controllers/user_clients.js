
const { executeQuerry } = require('../../db');
const { logger } = require('../../logger');

const controller = {

    getClients: async (req, res) => {
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
                console.log(result);
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