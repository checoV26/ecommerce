const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { logger } = require("./logger");
const {
  valAddress,
  valPerson,
  valUser,
  formatAddress,
} = require("./validation.js");
const { executeQuerry } = require("./db.js");
const bcrypt = require("bcrypt");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const PORT = process.env.PORT;

app.post("/login", async (req, res) => {
  logger.info("Petición recibida en /login");
  const { user, password } = req.body;
  const querry = "SELECT * FROM Usuarios WHERE user=?";
  try {
    const result = await executeQuerry(querry, [user]);
    if (result.length === 0) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }
    const passSave = result[0].password;
    const verifyPass = await compararContrasenas(password, passSave);
    if (verifyPass) {
      const userObject = { userName: user, rol: "admin" };
      const accessToken = generateAccessToken(userObject);
      logger.info("Usuario y contraseña correctos:", {
        userName: user,
        password: "***********",
      });

      return res.header("Authorization", accessToken).json({
        message: "Autenticado",
        time: dateNow(),
        status: 200,
      });
    } else {
      logger.error("Usuario o contraseña incorrectos:", {
        userName: user,
        password: "***********",
      });
      return res.status(400).json({
        status: 400,
        msg: "¡Usuario y contraseña son incorrectos!",
      });
    }
  } catch (error) {
    logger.error("Error al autenticar al usuario:", error);
    return res
      .status(500)
      .json({ status: 500, msg: "Error al autenticar al usuario" });
  }
});

//Guardar direccioness
app.post("/save/address", async (req, res) => {
  logger.info("Petición recibida en /address");
  const address = req.body;
  const validation = valAddress(address);
  const querry =
    "INSERT INTO Direccion(pais, estado, municipio, colonia, calle, numeroExterior, numeroInterior, codigoPostal) VALUES (?,?,?,?,?,?,?,?)";
  if (validation) {
    logger.info("Datos incorrectos o faltantes:", { validation });
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Datos incorrectos o faltantes!",
      data: validation,
    });
  } else {
    const data = [
      address.pais,
      address.estado,
      address.municipio,
      address.colonia,
      address.calle,
      address.nExterior,
      address.nInterior,
      address.cp,
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
      res.status(500).json({
        statusCode: 500,
        status: "error",
        msg: "Error al ejecutar la consulta SQL",
      });
    }
  }
});

// Actualizar direcciones
app.put("/update/address/:id", (req, res) => {
  const idAddress = req.params.id;
  const address = req.body;
  const querry =
    "UPDATE Direccion SET pais=?,estado=?,municipio=?,colonia=?,calle=?,numeroExterior=?,numeroInterior=?,codigoPostal=? WHERE id=?";
  // Validamos que el idAddress venga informado
  if (!idAddress || isNaN(idAddress)) {
    logger.info(
      "Dirección invalida para consultar, id a consultar: " + idAddress
    );
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Dirección invalida para actualizar!",
      data: [idAddress],
    });
  } else {
    const validation = valAddress(address);
    if (validation) {
      res.status(400).json({
        statusCode: 400,
        status: "warning",
        msg: "¡Datos incorrectos o faltantes!",
        data: validation,
      });
    } else {
      const data = [
        address.pais,
        address.estado,
        address.municipio,
        address.colonia,
        address.calle,
        address.nExterior,
        address.nInterior,
        address.cp,
        idAddress,
      ];
      try {
        const addressFormat = formatAddress(address);
        res.status(200).json({
          statusCode: 200,
          status: "success",
          msg: "!Dirección actualizada¡",
          data: [addressFormat],
        });
      } catch (error) {
        console.log(error);
        res.status(500).json({
          statusCode: 500,
          status: "error",
          msg: "Error al ejecutar la consulta SQL",
        });
      }
    }
  }
});

// Consultar dirección por id
app.get("/list/address/:id", async (req, res) => {
  const idAddress = req.params.id;
  const querry =
    "SELECT pais,estado,municipio,colonia,calle,numeroExterior,numeroInterior,codigoPostal FROM Direccion WHERE id=?";

  if (!idAddress || isNaN(idAddress)) {
    logger.info(
      "Dirección invalida para consultar, id a consultar: " + idAddress
    );
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
      res.status(500).json({
        statusCode: 500,
        status: "error",
        msg: "Error al ejecutar la consulta SQL",
      });
    }
  }
});

// Eliminar dirección
app.delete("/delete/address/:id", async (req, res) => {
  const idAddress = req.params.id;
  const querry = "DELETE FROM Direccion WHERE id=?";
  const querryCount =
    "SELECT COUNT(*) AS count FROM Personal WHERE direccion=?";
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
      console.log(error);
      logger.error("Error al ejecutar la consulta SQL", {
        querry: querry,
        data: [idAddress],
        error: error,
      });
      res.status(500).json({
        statusCode: 500,
        status: "error",
        msg: "Error al ejecutar la consulta SQL",
      });
    }
  }
});

// Guardar personal
app.post("/save/staff", async (req, res) => {
  logger.info("Petición recibida en /person");
  const person = req.body;
  const validation = valPerson(person);
  const querry =
    "INSERT INTO Personal(nombre, apellido_Paterno,apellido_Materno,genero,rfc,curp,nss,correo,telefono,celular, fechaIngreso,direccion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
  if (validation) {
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Datos incorrectos o faltantes!",
      campos: validation,
    });
  } else {
    const data = [
      person.nombre,
      person.apellidoPaterno,
      person.apellidoMaterno,
      person.genero,
      person.rfc,
      person.curp,
      person.nss,
      person.correo,
      person.telefono,
      person.celular,
      person.fechaIngreso,
      person.direccion,
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

      if (error.code === "ER_DUP_ENTRY") {
        // El valor duplicado viola la restricción única
        let msg = "Los siguientes campos ya existen:";
        const { rfc, curp, nss, correo, telefono, celular } = person;
        if (error.sqlMessage.includes("rfc")) msg += ` RFC: ${rfc}`;
        if (error.sqlMessage.includes("curp")) msg += ` CURP: ${curp}`;
        if (error.sqlMessage.includes("nss")) msg += ` NSS: ${nss}`;
        if (error.sqlMessage.includes("correo")) msg += ` Correo: ${correo}`;
        if (error.sqlMessage.includes("telefono"))
          msg += ` Teléfono: ${telefono}`;
        if (error.sqlMessage.includes("celular")) msg += ` Celular: ${celular}`;

        res.status(400).json({
          statusCode: 400,
          status: "warning",
          msg: msg,
        });
        logger.error("Los siguientes campos ya existen:", { msg });
      } else {
        res.status(500).json({
          statusCode: 500,
          status: "error",
          msg: "¡Error al ejecutar la consulta SQL!",
        });
      }
    }
  }
});

// Consultar personal por id
app.get("/list/staff/:id", async (req, res) => {
  const idStaff = req.params.id;
  const querry =
    "SELECT nombre, apellido_Paterno, apellido_Materno, genero, rfc, curp, nss, correo, telefono, celular, fechaIngreso, direccion FROM Personal WHERE id=?;";
  if (!idStaff || isNaN(idStaff)) {
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Personal invalido!",
      data: [idStaff],
    });
  } else {
    try {
      const querryResult = await executeQuerry(querry, [idStaff]);
      if (querryResult.length > 0) {
        const data = {
          nombre: querryResult[0].nombre,
          apellido_Paterno: querryResult[0].apellido_Paterno,
          apellido_Materno: querryResult[0].apellido_Materno,
          genero: querryResult[0].genero,
          rfc: querryResult[0].rfc,
          curp: querryResult[0].curp,
          nss: querryResult[0].nss,
          correo: querryResult[0].correo,
          telefono: querryResult[0].telefono,
          celular: querryResult[0].celular,
          fechaIngreso: querryResult[0].fechaIngreso,
          direccion: querryResult[0].direccion.toString(),
        };
        res.status(200).json({ status: 200, msg: "success", data: data });
        logger.info("Se consulto los datos del personal con el id: " + id, {
          querryResult,
        });
      } else {
        res.status(200).send({
          statusCode: 200,
          status: "success",
          msg: "Personal no existente, no se encontraron datos",
          data: querryResult,
        });
        logger.info(
          "Se consultaron los datos del personal con el id: " +
            id +
            " y no se encontraron datos",
          {
            querryResult,
          }
        );
      }
    } catch (error) {
      logger.error("Error al ejecutar la consulta SQL", {
        querry: querry,
        data: id,
        error: error,
      });
      res.status(500).json({
        statusCode: 500,
        status: "error",
        msg: "Error al ejecutar la consulta SQL",
      });
    }
  }
});

// Actualizar personal
app.put("/update/staff/:id", (req, res) => {
  const idStaff = req.params.id;
  const person = req.body;
  const validation = valPerson(person);

  if (!idStaff || isNaN(idStaff)) {
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Personal invalido para actualizar!",
      data: [idStaff],
    });
  } else {
    const data = [
      person.nombre,
      person.apellidoPaterno,
      person.apellidoMaterno,
      person.genero,
      person.rfc,
      person.curp,
      person.nss,
      person.correo,
      person.telefono,
      person.celular,
      person.fechaIngreso,
      person.direccion,
    ];
    try {
      if (validation) {
        res.status(400).json({
          statusCode: 400,
          status: "warning",
          msg: "¡Datos incorrectos o faltantes!",
          campos: validation,
        });
      } else {
      }
    } catch (error) {
      logger.error("Error al ejecutar la consulta SQL", {
        querry: "",
        data: data,
        error: error,
      });
    }
  }
});
// Eliminar personal

// Guardar usuarios
app.post("/save/user", validateToken, async (req, res) => {
  const user = req.body;
  const validation = valUser(user);
  const querry =
    "INSERT INTO Usuarios(idPersonal,user,password) VALUES (?,?,?)";
  if (validation) {
    res.status(400).json({
      statusCode: 400,
      status: "warning",
      msg: "¡Datos incorrectos o faltantes!",
      campos: validation,
    });
  } else {
    try {
      const passEncriptada = await encriptarContrasena(user.password);
      const data = [user.idPersonal, user.user, passEncriptada];
      const querryResult = await executeQuerry(querry, data);
      const insertedId = querryResult.insertId.toString();
      res
        .status(200)
        .json({
          statusCode: 200,
          status: "success",
          msg: "Guardado",
          Id: insertedId,
        });
      logger.info("datos guardados:", { data, "id obtenido": insertedId });
    } catch (error) {
      logger.error("Error al ejecutar la consulta SQL", {
        querry: querry,
        error: error,
      });
      if (error.code === "ER_DUP_ENTRY") {
        let msg = "Los siguientes campos ya existen,";
        if (error.sqlMessage.includes("user")) msg += ` user: ${user.user}`;
        res.status(400).json({
          statusCode: 400,
          status: "info",
          msg: msg,
        });
        logger.error("Los siguientes campos ya existen:", { msg });
      } else {
        res
          .status(500)
          .json({
            statusCode: 500,
            status: "error",
            msg: "Error al ejecutar la consulta SQL",
          });
      }
    }
  }
});

// Actualizar usuario

// eliminar usuario

// Función para encriptar la contraseña y truncar el hash a 64 caracteres
const encriptarContrasena = async (contrasena) => {
  const saltRounds = 10; // Costo del algoritmo de hashing
  const hash = await bcrypt.hash(contrasena, saltRounds);
  return hash.slice(0, 64); // Truncar el hash a 64 caracteres
};

const compararContrasenas = async (
  contrasenaIngresada,
  contrasenaEncriptada
) => {
  try {
    const resultado = await bcrypt.compare(
      contrasenaIngresada,
      contrasenaEncriptada
    );
    return resultado;
  } catch (error) {
    throw new Error("Error al comparar contraseñas");
  }
};

function generateAccessToken(user) {
  return jwt.sign(user, process.env.SECRET, { expiresIn: "10m" });
}

function validateToken(req, res, next) {
  const accessToken = req.headers["authorization"];
  if (!accessToken) {
    logger.error("Token de acceso no proporcionado"); // Log de error
    return res.status(401).send("Access denied");
  }
  jwt.verify(accessToken, process.env.SECRET, (err, user) => {
    if (err) {
      logger.error("Token inválido o expirado"); // Log de error
      return res.status(403).send("Access denied, token expired or incorrect");
    }
    req.user = user;
    next();
  });
}

function dateNow() {
  const now = new Date();
  const fechaActual = now.toISOString().split("T")[0];

  // Obtener la hora actual en formato 'HH:MM:SS'
  const horaActual = now.toTimeString().split(" ")[0];
  return fechaActual + ", " + horaActual;
}

try {
  app.listen(PORT, () => {
    logger.info(`Servidor iniciado en el puerto ${PORT}`); // Log de información
    console.log(`Servidor iniciado en el puerto ${PORT}`);
  });
} catch (error) {
  logger.error(`Error al iniciar el servidor: ${error.message}`);
}
