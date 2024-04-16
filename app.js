'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Configura body-parser para analizar solicitudes con cuerpo JSON
app.use(bodyParser.json());

// Configura body-parser para analizar solicitudes con cuerpo de formulario
app.use(bodyParser.urlencoded({ extended: true }));

//Ruta practica
const route_clients = require('./app/routes/user_clients');
app.use('/api', route_clients);

require('dotenv').config();
const { logger } = require('./logger');

  const PORT = process.env.PORT;

  try {
    app.listen(PORT, () => {
      logger.info(`Servidor iniciado en el puerto ${PORT}`); 
      console.log(`Servidor iniciado en el puerto ${PORT}`);
    });
  } catch (error) {
    logger.error(`Error al iniciar el servidor: ${error.message}`);
  }