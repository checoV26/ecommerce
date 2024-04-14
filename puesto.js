const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { logger } = require("./logger");
const { valPuesto } = require("./validation.js");
const { executeQuerry } = require("./db.js");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const PORT = 3001;

// Insert
app.post("/save/puesto", validateToken,async (req, res) => {
  logger.info("Petición recibida en /save/puesto");
  const puesto = req.body;
  const validation = valPuesto(puesto);
  const querry = "INSERT INTO puesto(nombre, descripcion) VALUES (?,?)";
  if (validation) {
    logger.info("Datos incorrectos o faltantes:", { validation });
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Datos incorrectos o faltantes!",
      data: validation,
    });
  } else {
    const data = [puesto.nombre, puesto.desc];
    try {
      const querryResult = await executeQuerry(querry, data);
      const insertedId = querryResult.insertId.toString();
      res.status(200).json({
        statusCode: 200,
        status: "success",
        msg: "Guardado",
        Id: insertedId,
      });
      logger.info("Puesto guardado:", { data, "id obtenido": insertedId });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        res.status(400).json({
          statusCode: 400,
          status: "warning",
          msg: "El puesto que intenta ingresar ya existe",
        });
        logger.error("Los siguientes campos ya existen:");
      } else {
        logger.error("Error al ejecutar la consulta SQL", {
          querry: querry,
          data: data,
          error: error,
        });
        res.status(409).json({
          statusCode: 409,
          status: "error",
          msg: "Error al ejecutar la consulta",
        });
      }
    }
  }
});

// Update
app.put("/update/puesto/:id", validateToken,async (req, res) => {
  const idPuesto = req.params.id;
  const puesto = req.body;
  const querry = "UPDATE puesto SET nombre=?,descripcion=? WHERE id=?";
  const querryCount = "SELECT COUNT(*) AS count FROM puesto WHERE id=?";
  logger.info("Petición recibida en /update/puesto/", idPuesto);
  if (!idPuesto || isNaN(idPuesto)) {
    logger.info("Puesto invalido, No puede ser actualizado, id: " + idPuesto);
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Puesto invalido, No puede ser actualizado!",
      data: [idPuesto],
    });
  } else {
    // validamos la existencia
    const querryResult = await executeQuerry(querryCount, idPuesto);
    if (querryResult[0].count > 0) {
      const validation = valPuesto(puesto);
      if (validation) {
        res.status(400).json({
          statusCode: 400,
          status: "warning",
          msg: "¡Datos incorrectos o faltantes!",
          data: validation,
        });
        logger.info("¡Datos incorrectos o faltantes!", validation);
      } else {
        const data = [puesto.nombre, puesto.desc, idPuesto];
        try {
          const querryResult = await executeQuerry(querry, data);
          res.status(200).json({
            statusCode: 200,
            status: "success",
            msg: "!Dirección actualizada¡",
            data: [],
          });
          logger.info("¡Dirección actualizada!", data);
        } catch (error) {
          console.log(error);
          logger.info("¡Error al ejecutar la consulta!", data, error);
          res.status(409).json({
            statusCode: 409,
            status: "error",
            msg: "Error al ejecutar la consulta",
          });
        }
      }
    } else {
      logger.info(
        "Puesto inexistente, No puede ser actualizado, id: " + idPuesto
      );
      res.status(409).json({
        statusCode: 409,
        status: "warning",
        msg: "¡Puesto inexistente, No puede ser actualizado!",
        data: [],
      });
    }
  }
});

// list for id
app.get("/list/puesto/:id", validateToken,async (req, res) => {
  const idPuesto = req.params.id;
  logger.info("Petición recibida en /list/puesto/" + idPuesto);
  const querry = "SELECT nombre,descripcion FROM puesto WHERE id=?";
  const querryCount = "SELECT COUNT(*) AS count FROM puesto WHERE id=?";
  if (!idPuesto || isNaN(idPuesto)) {
    logger.info("Puesto invalida para consultar, id a consultar: " + idPuesto);
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Puesto invalida para consultar!",
      data: [],
    });
  } else {
    try {
      const querryResult = await executeQuerry(querryCount, [idPuesto]);
      if (querryResult[0].count > 0) {
        const querryResult = await executeQuerry(querry, [idPuesto]);

        if (querryResult.length > 0) {
          res.status(200).json({
            statusCode: 200,
            status: "success",
            msg: "Se consulto correctamente la información",
            data: querryResult,
          });
          logger.info(
            "Se consulto los datos del puesto con el id: " + idPuesto,
            {
              querryResult,
            }
          );
        } else {
          res.status(200).json({
            statusCode: 200,
            status: "success",
            msg: "No se encontraron datos",
            data: querryResult,
          });
          logger.info(
            "Se consultaron los datos del puesto con el id: " +
              idPuesto +
              " y no se encontraron datos",
            {
              querryResult,
            }
          );
        }
      } else {
        logger.error("puesto inexistente", {
          querry: querry,
          data: idPuesto,
        });
        res.status(409).json({
          statusCode: 409,
          status: "info",
          msg: "¡El puesto solicitado no existe!",
        });
      }
    } catch (error) {
      logger.error("Error al ejecutar la consulta", {
        data: idPuesto,
        error: error,
      });
      res.status(409).json({
        statusCode: 409,
        status: "error",
        msg: "Error al ejecutar la consulta",
      });
    }
  }
});

// list all
app.get("/list/all/puesto", validateToken,async (req, res) => {
  logger.info("Petición recibida en /list/all/puesto");
  const querry = "SELECT * FROM puesto";
  try {
    const querryResult = await executeQuerry(querry, []);
    res.status(200).json({
      statusCode: 200,
      status: "success",
      msg: "",
      data: querryResult,
    });
    logger.info("Se consultaron los puestos existente ");
  } catch (error) {
    logger.error("Error al ejecutar la consulta", {
      error: error,
    });
    res.status(409).json({
      statusCode: 409,
      status: "error",
      msg: "Error al ejecutar la consulta",
    });
  }
});

try {
  app.listen(PORT, () => {
    logger.info(`Servidor iniciado en el puerto ${PORT}`); // Log de información
    console.log(`Servidor iniciado en el puerto ${PORT}`);
  });
} catch (error) {
  logger.error(`Error al iniciar el servidor: ${error.message}`);
}
