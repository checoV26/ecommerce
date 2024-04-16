const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { logger } = require("./logger");
const {
  valRol,
  valUser,
  encriptarContrasena,
  compararContrasenas,
  querryCreate,
  compareObjects,
} = require("./validation.js");
const { executeQuerry } = require("./db.js");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const PORT = 3003;

// save as rol
app.post("/save/rol",validateToken, async (req, res) => {
  logger.info("Petición recibida en /save/rol/");
  const rol = req.body;
  const validation = valRol(rol);
  const querry = "INSERT INTO rol(nombre,descripcion) VALUES (?,?)";
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
    const data = [rol.nombre, rol.desc];
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
        msg: "Error al guardar",
      });
    }
  }
});

// update rol
app.put("/update/rol/:id",validateToken, async (req, res) => {
  const idRol = req.params.id;
  const rol = req.body;
  logger.info("Petición recibida en /update/rol/" + idRol);
  const querry = "UPDATE rol SET nombre=?,descripcion=? WHERE id=?";
  const querryCount = "SELECT COUNT(*) AS count FROM rol WHERE id=?";
  if (!idRol || isNaN(idRol)) {
    logger.info("Rol invalida para consultar, id: " + idAddress);
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "Rol invalida, no se puede actualizar!",
      data: [idAddress],
    });
  } else {
    const querryResult = await executeQuerry(querryCount, idRol);
    if (querryResult[0].count > 0) {
      const validation = valRol(rol);
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
        const data = [rol.nombre, rol.desc, idRol];
        try {
          const querryResult = await executeQuerry(querry, data);
          res.status(200).json({
            statusCode: 200,
            status: "success",
            msg: "Guardado",
          });
          logger.info("datos guardados:", { data, "id obtenido": idRol });
        } catch (error) {
          console.log(error);
          logger.error("Error al ejecutar la consulta SQL", {
            querry: querry,
            data: data,
            error: error,
          });
          res.status(409).json({
            statusCode: 409,
            status: "error",
            msg: "Error al guardar",
          });
        }
      }
    } else {
      logger.info("Rol inexistente, " + idRol);
      res.status(409).json({
        statusCode: 409,
        status: "warning",
        msg: "Rol inexistente, no se puede actualizar!",
        data: [],
      });
    }
  }
});

// list
app.get("/list/rol/:id",validateToken, async (req, res) => {
  const idRol = req.params.id;
  logger.info("Petición recibida en /list/rol/" + idRol);
  const querry = "SELECT nombre, descripcion FROM rol WHERE id=?";
  const querryCount = "SELECT COUNT(*) AS count FROM rol WHERE id=?";
  if (!idRol || isNaN(idRol)) {
    logger.info("El rol no es valido, id a consultar: " + idRol);
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡El rol no es valido!",
      data: [],
    });
  } else {
    try {
      const querryResult = await executeQuerry(querryCount, [idRol]);
      if (querryResult[0].count > 0) {
        const querryResult = await executeQuerry(querry, [idRol]);
        if (querryResult.length > 0) {
          res.status(200).json({
            statusCode: 200,
            status: "success",
            msg: "Se consulto correctamente la información",
            data: querryResult,
          });
          logger.info("Se consulto los datos del rol con el id: " + idRol, {
            querryResult,
          });
        } else {
          res.status(200).json({
            statusCode: 200,
            status: "success",
            msg: "No se encontraron datos",
            data: querryResult,
          });
          logger.info(
            "Se consultaron los datos del rol con el id: " +
              idRol +
              " y no se encontraron datos",
            {
              querryResult,
            }
          );
        }
      } else {
        logger.error("Rol inexistente", {
          querry: querry,
          data: idRol,
        });
        res.status(409).json({
          statusCode: 409,
          status: "info",
          msg: "¡El rol solicitado no existe!",
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

// liast all
app.get("/list/all/rol/",validateToken, async (req, res) => {
  logger.info("Petición recibida en /list/rol/all");
  const querry = "SELECT * FROM rol";
  try {
    const querryResult = await executeQuerry(querry, []);
    res.status(200).json({
      statusCode: 200,
      status: "success",
      msg: "",
      data: querryResult,
    });
    logger.info("Se consultaron los roles existente ");
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

// usuarios
app.post("/save/user",validateToken, async (req, res) => {
  logger.info("Petición recibida en /save/user");
  const user = req.body;
  const querry =
    "INSERT INTO usuarios(user, password, personal, rol) VALUES (?,?,?,?)";
  const validation = valUser(user);
  if (validation) {
    logger.info("Datos incorrectos o faltantes:", { validation });
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Datos incorrectos o faltantes!",
      data: validation,
    });
  } else {
    const passEncriptada = await encriptarContrasena(user.password);
    const data = [user.user, passEncriptada, user.idPersonal, user.idRol];

    try {
      const querryResult = await executeQuerry(querry, data);
      const insertedId = querryResult.insertId.toString();
      res.status(200).json({
        statusCode: 200,
        status: "success",
        msg: "Guardado",
        data: insertedId,
      });
      logger.info("Puesto guardado:", { data, "id obtenido": insertedId });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        res.status(400).json({
          statusCode: 400,
          status: "warning",
          msg: "El usuario que intenta ingresar ya existe",
          data: [],
        });
        logger.error("Los siguientes campos ya existen:", data);
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
app.put("/update/user/:id",validateToken, async (req, res) => {
  const idUser = req.params.id;
  const user = req.body;
  logger.info("Petición recibida en update/user/" + idUser);
  const validation = valUser(user);
  const querryCompare =
    "SELECT user,password,personal,rol FROM usuarios WHERE id=?";
  if (validation) {
    logger.info("Datos incorrectos o faltantes:", { validation });
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Datos incorrectos o faltantes!",
      data: validation,
    });
  } else {
    const userData = {
      user: user.user,
      personal: user.idPersonal,
      rol: user.idRol,
    };
    const querryResultC = await executeQuerry(querryCompare, idUser);
    const valueComare = await compararContrasenas(
      user.password,
      querryResultC[0].password
    );
    delete querryResultC[0].password;

    const value = compareObjects(userData, querryResultC[0]);
    const objeto = value.differences;
    console.log(value);
    if (value.areEqual && valueComare) {
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
      if (!valueComare) {
        objeto.password = await encriptarContrasena(user.password);
      }
      const dataValue = querryCreate(objeto, "usuarios", "id");
      const querry = dataValue.concatQuerry;
      let data = dataValue.data;
      data.push(idUser);
      try {
        const querryResult = await executeQuerry(querry, data);
        res.status(200).json({
          statusCode: 200,
          status: "success",
          msg: "!Usuario actualizado¡",
          data: [],
        });
        logger.info("Usuario actualizada", data);
      } catch (error) {
        console.log(error);
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
});

// update status
app.put("/update/status/user/:id",validateToken, async (req, res) => {
  const idUser = req.params.id;
  const status = req.body;
  logger.info(
    "Petición recibida en /update/status/user/, con status " +
      status +
      " con id: " +
      idUser
  );
  const querry = "UPDATE usuarios SET status=? WHERE id=?";
  const querryCount = "SELECT COUNT(*) AS count FROM usuarios WHERE id=?";
  const data = [status.status, idUser];
  try {
    const querryResultCount = await executeQuerry(querryCount, [idUser]);
    if (querryResultCount[0].count > 0) {
      const querryResult = await executeQuerry(querry, data);
      res.status(200).json({
        statusCode: 200,
        status: "success",
        msg: "!Personal actualizado¡",
      });
      logger.info(
        "Personal actualizado con el id: " + idUser + " al status: " + status
      );
    } else {
      logger.info("Personal inexistente, " + idUser);
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
      data: data,
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
