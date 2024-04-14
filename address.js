const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { logger } = require("./logger.js");
const { valAddress, formatAddress,validateToken } = require("./validation.js");
const { executeQuerry } = require("./db.js");
const bcrypt = require("bcrypt");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const PORT = 3000;

// Insert
app.post("/save/address",validateToken, async (req, res) => {
  logger.info("Petición recibida en /save/address");
  const address = req.body;
  const validation = valAddress(address);
  const querry =
    "INSERT INTO address(cp, estado, municipio, colonia, calle, numeroExterno, numeroInterno, referencia) VALUES (?,?,?,?,?,?,?,?)";
  if (validation) {
    logger.info("Datos incorrectos o faltantes:", { validation });
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Datos incorrectos o faltantes!",
      data: validation,
    });
    logger.info("Datos incorrectos o faltantes:", validation);
  } else {
    const data = [
      address.cp,
      address.estado,
      address.municipio,
      address.colonia,
      address.calle,
      address.numeroExterno,
      address.numeroInterno,
      address.referencia,
    ];
    try {
      const querryResult = await executeQuerry(querry, data);
      const insertedId = querryResult.insertId.toString();
      res.status(200).json({
        statusCode: 200,
        status: "success",
        msg: "Guardado",
        Id: insertedId,
      });
      logger.info("datos guardados:", { data, "id obtenido": insertedId });
    } catch (error) {
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
});
// Update
app.put("/update/address/:id",validateToken, async (req, res) => {
  const idAddress = req.params.id;
  const address = req.body;
  logger.info("Petición recibida en /update/address/" + idAddress);
  const querry =
    "UPDATE address SET cp=?,estado=?,municipio=?,colonia=?,calle=?,numeroExterno=?,numeroInterno=?,referencia=? WHERE id=?";
  const querryCount = "SELECT COUNT(*) AS count FROM address WHERE id=?";
  // Validamos que el idAddress venga informado
  if (!idAddress || isNaN(idAddress)) {
    logger.info("Dirección invalida para consultar, id: " + idAddress);
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Dirección invalida para actualizar!",
      data: [idAddress],
    });
  } else {
    const validation = valAddress(address);
    // Validamos que la dirección exista
    const querryResult = await executeQuerry(querryCount, idAddress);
    if (querryResult[0].count > 0) {
      if (validation) {
        res.status(400).json({
          statusCode: 400,
          status: "warning",
          msg: "¡Datos incorrectos o faltantes!",
          data: validation,
        });
      } else {
        const data = [
          address.cp,
          address.estado,
          address.municipio,
          address.colonia,
          address.calle,
          address.numeroExterno,
          address.numeroInterno,
          address.referencia,
          idAddress,
        ];
        try {
          const querryResult = await executeQuerry(querry, data);
          const addressFormat = formatAddress(address);
          res.status(200).json({
            statusCode: 200,
            status: "success",
            msg: "!Dirección actualizada¡",
            data: [addressFormat],
          });
          logger.info("Dirección actualizada", data);
        } catch (error) {
          logger.error("Error al ejecutar la consulta", {
            querry: querry,
            data: data,
            error: error,
          });
          res.status(409).json({
            statusCode: 409,
            status: "error",
            msg: "Error al ejecutar la consulta SQL",
          });
        }
      }
    } else {
      logger.info("Dirección inexistente, " + idAddress);
      res.status(409).json({
        statusCode: 409,
        status: "warning",
        msg: "¡Dirección invalida para actualizar!",
        data: [],
      });
    }
  }
});
// List
app.get("/list/address/:id",validateToken, async (req, res) => {
  const idAddress = req.params.id;
  logger.info("Petición recibida en /list/address/" + idAddress);
  const querry =
    "SELECT cp,estado,municipio,colonia,calle,numeroExterno,numeroInterno,referencia FROM address WHERE id=?";

  if (!idAddress || isNaN(idAddress)) {
    logger.info("Dirección invalida para consultar, id: " + idAddress);
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Dirección invalida para consultar!",
      data: [idAddress],
    });
  } else {
    try {
      const querryResult = await executeQuerry(querry, [idAddress]);
      if (querryResult.length > 0) {
        res.status(200).json({
          statusCode: 200,
          status: "success",
          msg: "Se consulto correctamente la información",
          data: querryResult,
        });
        logger.info(
          "Se consulto los datos de la dirección con el id: " + idAddress,
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
          "Se consultaron los datos de la dirección con el id: " +
            idAddress +
            " y no se encontraron datos",
          {
            querryResult,
          }
        );
      }
    } catch (error) {
      logger.error("Error al ejecutar la consulta SQL", {
        querry: querry,
        data: idAddress,
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

// Delete
app.delete("/delete/address/:id",validateToken, async (req, res) => {
  const idAddress = req.params.id;
  const querry = "DELETE FROM address WHERE id=?";
  const querryCount =
    "SELECT COUNT(*) AS count FROM personal WHERE direccion=?";
  logger.info("Petición recibida en /delete/address/" + idAddress);
  if (!idAddress || isNaN(idAddress)) {
    logger.info(
      "Dirección invalida para eliminar, id a eliminar: " + idAddress
    );
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Dirección invalida para eliminar!",
      data: [idAddress],
    });
  } else {
    try {
      // Verificar si hay registros en la tabla Personal relacionados con esta dirección
      const personalRecords = await executeQuerry(querryCount, [idAddress]);
      const count = personalRecords[0].count;
      if (count > 0) {
        // Informar al usuario que primero debe eliminar los registros en la tabla Personal
        logger.info(
          "¡No se puede eliminar la dirección! Primero elimine los registros relacionados en el Personal: " +
            idAddress
        );
        res.status(400).json({
          statusCode: 400,
          status: "info",
          msg: "¡No se puede eliminar la dirección, primero elimine los registros relacionados en el Personal!.",
        });
      } else {
        const querryResult = await executeQuerry(querry, [idAddress]);
        res.status(200).json({
          statusCode: 200,
          status: "success",
          msg: "¡Dirección eliminada!",
          data: [],
        });
        logger.info("¡Se elimino la dirección con el id " + idAddress + "!");
      }
    } catch (error) {
      logger.error("Error al ejecutar la consulta SQL", {
        querry: querry,
        data: [idAddress],
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

try {
  app.listen(PORT, () => {
    logger.info(`Servidor iniciado en el puerto ${PORT}`); // Log de información
    console.log(`Servidor iniciado en el puerto ${PORT}`);
  });
} catch (error) {
  logger.error(`Error al iniciar el servidor: ${error.message}`);
}
