const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { logger } = require("./logger");
const { valPerson,querryCreate,compareObjects,validateToken } = require("./validation.js");
const { executeQuerry } = require("./db.js");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const PORT = 3002;

// Insert
app.post("/save/personal", validateToken,async (req, res) => {
  logger.info("Petición recibida en /save/personal");
  const personal = req.body;
  const validation = valPerson(personal);
  const querry =
    "INSERT INTO personal(nombre, apellidoP, apellidoM, correo, telefono, direccion, puesto) VALUES (?,?,?,?,?,?,?)";
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
      personal.nombre,
      personal.apellidoP,
      personal.apellidoM,
      personal.correo,
      personal.telefono,
      personal.direccion,
      personal.puesto,
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
      console.log(error);
      logger.error("Error al ejecutar la consulta SQL", {
        querry: querry,
        data: data,
        error: error,
      });

      if (error.code === "ER_DUP_ENTRY") {
        let msg = "Los siguientes campos ya existen:";
        const { correo, telefono } = personal;
        if (error.sqlMessage.includes("correo")) msg += ` correo: ${correo}`;
        if (error.sqlMessage.includes("telefono"))
          msg += ` telefono: ${telefono}`;

        res.status(400).json({
          statusCode: 400,
          status: "warning",
          msg: msg,
        });
        logger.error("Los siguientes campos ya existen:", { msg });
      }

      res.status(409).json({
        statusCode: 409,
        status: "error",
        msg: "Error al guardar",
      });
    }
  }
});
// Update
app.put("/update/personal/:id", validateToken,async (req, res) => {
  const idPersonal = req.params.id;
  const personal = req.body;
  logger.info("Petición recibida en /update/personal/" + idPersonal);
  const querryCompare =
    "SELECT nombre,apellidoP,apellidoM,correo,telefono,direccion,puesto FROM personal WHERE id=?";
  const querryCount = "SELECT COUNT(*) AS count FROM personal WHERE id=?";
  if (!idPersonal || isNaN(idPersonal)) {
    logger.info("Personal invalida para consultar, id: " + idAddress);
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "Personal invalida, no se puede actualizar!",
      data: [idAddress],
    });
  } else {
    const querryResult = await executeQuerry(querryCount, idPersonal);
    if (querryResult[0].count > 0) {
      const validation = valPerson(personal);
      if (validation) {
        res.status(400).json({
          statusCode: 400,
          status: "warning",
          msg: "¡Datos incorrectos o faltantes!",
          data: validation,
        });
        logger.info("¡Datos incorrectos o faltantes!", validation);
      } else {
        const querryResultC = await executeQuerry(querryCompare, idPersonal);
        const value = compareObjects(personal, querryResultC[0]);
        if (value.areEqual) {
          res.status(200).json({
            statusCode: 200,
            status: "info",
            msg: "¡No se encontraron modificaciones en los datos, no se aplico ninguna modificación!",
            data: [],
          });
          logger.info(
            "¡No se encontraron modificaciones en los datos, no se aplico ninguna modificación!"
          );
        } else {
          const objeto = value.differences;
          const dataValue = querryCreate(objeto, "personal", "id");
          const querry = dataValue.concatQuerry;
          let data = dataValue.data;
          data.push(idPersonal);
          console.log(data);
          try {
            const querryResult = await executeQuerry(querry, data);
            res.status(200).json({
              statusCode: 200,
              status: "success",
              msg: "!Personal actualizado¡",
              data: [],
            });
            logger.info("Personal actualizada", data);
          } catch (error) {
            logger.error("Error al ejecutar la consulta", {
              querry: querry,
              data: data,
              error: error,
            });
            res.status(409).json({
              statusCode: 409,
              status: "error",
              msg: "Error al actualizar",
            });
          }
        }
      }
    } else {
      logger.info("Personal inexistente, " + idPersonal);
      res.status(409).json({
        statusCode: 409,
        status: "warning",
        msg: "Personal inexistente, no se puede actualizar!",
        data: [],
      });
    }
  }
});
// List
app.get("/list/personal/:id", validateToken,async (req, res) => {
  const idPersonal = req.params.id;
  logger.info("Petición recibida en /list/personal/" + idPersonal);
  const querry =
    "SELECT nombre,apellidoP,apellidoM,correo,telefono,direccion,puesto,status FROM personal WHERE id=?";
  const querryCount = "SELECT COUNT(*) AS count FROM personal WHERE id=?";
  if (!idPersonal || isNaN(idPersonal)) {
    logger.info("El personal no es valido, id a consultar: " + idPersonal);
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡El personal no es valido!",
      data: [],
    });
  } else {
    try {
      const querryResult = await executeQuerry(querryCount, [idPersonal]);
      if (querryResult[0].count > 0) {
        const querryResult = await executeQuerry(querry, [idPersonal]);

        if (querryResult.length > 0) {
          res.status(200).json({
            statusCode: 200,
            status: "success",
            msg: "Se consulto correctamente la información",
            data: querryResult,
          });
          logger.info(
            "Se consulto los datos del puesto con el id: " + idPersonal,
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
              idPersonal +
              " y no se encontraron datos",
            {
              querryResult,
            }
          );
        }
      } else {
        logger.error("personal inexistente", {
          querry: querry,
          data: idPersonal,
        });
        res.status(409).json({
          statusCode: 409,
          status: "info",
          msg: "¡El personal solicitado no existe!",
        });
      }
    } catch (error) {
      logger.error("Error al ejecutar la consulta", {
        querry: querry,
        error: error,
      });
      res.status(409).json({
        statusCode: 409,
        status: "error",
        msg: "Error al actualizar",
      });
    }
  }
});
// Lista all
app.get("/list/personal/all/:status", validateToken,async (req, res) => {
  const statusPersonal = req.params.status;
  logger.info(
    "Petición recibida en /list/personal/all/, con status " + statusPersonal
  );
  const querry = "SELECT * FROM personal where status=?";
  try {
    const querryResult = await executeQuerry(querry, [statusPersonal]);
    if (querryResult.length > 0) {
      res.status(200).json({
        statusCode: 200,
        status: "success",
        msg: "",
        data: querryResult,
      });
      logger.info("Se consultaron los puestos existente ");
    } else {
      res.status(409).json({
        statusCode: 409,
        status: "success",
        msg: "¡No se encontraron datos!",
        data: querryResult,
      });
      logger.info("¡No se encontraron datos!");
    }
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
// update status
app.put("/update/status/personal/:id", validateToken,async (req, res) => {
  const idPersonal = req.params.id;
  const status = req.body;
  logger.info(
    "Petición recibida en /update/status/personal/, con status " +
      status +
      " con id: " +
      idPersonal
  );
  const querry = "UPDATE personal SET status=? WHERE id=?";
  const querryCount = "SELECT COUNT(*) AS count FROM personal WHERE id=?";
  const data = [status.status, idPersonal];
  try {
    const querryResultCount = await executeQuerry(querryCount, [idPersonal]);
    if (querryResultCount[0].count > 0) {
      const querryResult = await executeQuerry(querry, data);
      res.status(200).json({
        statusCode: 200,
        status: "success",
        msg: "!Personal actualizado¡",
      });
      logger.info(
        "Personal actualizado con el id: " +
          idPersonal +
          " al status: " +
          status
      );
    } else {
      logger.info("Personal inexistente, " + idPersonal);
      res.status(409).json({
        statusCode: 409,
        status: "warning",
        msg: "¡Personal inexistente!",
        data: [],
      });
    }
  } catch (error) {
    logger.error("Error al ejecutar la consulta", {
      error: error,
      data:data
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
