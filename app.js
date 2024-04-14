'use strict';

const express = require('express');
const app = express();

//Ruta practica
const route_clients = require('./app/routes/user_clients');
app.use('/api', route_clients);
// const jwt = require('jsonwebtoken');

require('dotenv').config();
const { logger } = require('./logger');

  const PORT = process.env.PORT;

  // app.get('/', (res) => {
  //   res.send(`<h1>Bienvenido: Servidor Ejecutandose en el puerto: ${PORT}</h1>`)
  // })

  try {
    app.listen(PORT, () => {
      logger.info(`Servidor iniciado en el puerto ${PORT}`); 
      console.log(`Servidor iniciado en el puerto ${PORT}`);
    });
  } catch (error) {
    logger.error(`Error al iniciar el servidor: ${error.message}`);
  }