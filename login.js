const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { logger } = require("./logger");
const { compararContrasenas, valLogin,generateAccessToken,dateNow } = require("./validation.js");
const { executeQuerry } = require("./db.js");
const { date } = require("joi");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const PORT = 3004;

app.post("/login", async (req, res) => {
  logger.info("Petición recibida en /login");
  const login = req.body;
  const querry = "SELECT CONCAT(p.nombre, ' ',p.apellidoP,' ',p.apellidoM) AS nombre,r.nombre AS rol,r.descripcion,u.password FROM usuarios u LEFT JOIN personal p ON u.personal = p.id LEFT JOIN rol r ON u.rol=r.id WHERE u.user =?";
  const validation = valLogin(login);
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
    try {
      const result = await executeQuerry(querry, [login.user]);
      console.log
      if (result.length === 0) {
        res.status(200).json({
          statusCode: 200,
          status: "warning",
          msg: "¡Usuario no encontrado!",
          data: [],
        });
        logger.info("¡Usuario no encontrado! :" + login.user);
      } else {
        const passSave = result[0].password;
        const verifyPass = await compararContrasenas(login.password, passSave);
        if (verifyPass) {
          const userObject = { userName: login.user, rol: result[0].rol,nombre:result[0].nombre,desc:result[0].descripcion };
          const accessToken = generateAccessToken(userObject);

          logger.info("Usuario y contraseña correctos:", {
            userName: login.user,
            password: "***********",
          });

          res.status(200).header("Authorization", accessToken).json({
            statusCode: 200,
            time: dateNow(),
            status: "success",
            msg: "¡Usuario autenticado correctamente!",
            data:userObject
          });

        
        } else {
          logger.error("Usuario o contraseña incorrectos:", {
            userName: login.user,
            password: "***********",
          });
          res.status(409).json({
            statusCode: 409,
            status: "error",
            msg: "Usuario o contraseña incorrectos",
            data:[]
          });
        }
      }
    } catch (error) {}
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
