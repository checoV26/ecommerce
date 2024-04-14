const { logger } = require("./logger.js");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const bcrypt = require("bcrypt");
require("dotenv").config();

const address = Joi.object({
  cp: Joi.number().min(10000).max(99999).required(),
  estado: Joi.string().max(50).required(),
  municipio: Joi.string().max(50).required(),
  colonia: Joi.string().max(50).required(),
  calle: Joi.string().max(100).required(),
  numeroExterno: Joi.string().max(50).required(),
  numeroInterno: Joi.string().max(50).allow(""),
  referencia: Joi.string().max(250).allow(""),
});

const puesto=Joi.object({
  nombre: Joi.string().max(100).required(),
  desc: Joi.string().max(255).allow(""),
});

const person = Joi.object({
  nombre: Joi.string().max(50).required(),
  apellidoP: Joi.string().max(50).required(),
  apellidoM: Joi.string().max(50).required(),
  correo: Joi.string().max(100).email().required(),
  telefono: Joi.number().integer().min(1000000000).max(9999999999).required(),
  direccion: Joi.number().required(),
  puesto: Joi.number().required(),
});

const rol=Joi.object({
  nombre: Joi.string().max(50).required(),
  desc: Joi.string().max(255).allow(""),
});


const user = Joi.object({
  user: Joi.string().min(8).required(),
  password: Joi.string().min(8).required(),
  idPersonal: Joi.number().required(),
  idRol: Joi.number().required(),
});

const login = Joi.object({
  user: Joi.string().min(8).required(),
  password: Joi.string().min(8).required(),
});


const valAddress = (datos) => {
  const { error } = address.validate(datos, { abortEarly: false });
  if (error) {
    return error.details.map((detail) => detail.context.label);
  }
  return null;
};

const valPerson = (datos) => {
  const { error } = person.validate(datos, { abortEarly: false });
  if (error) {
    return error.details.map((detail) => detail.context.label);
  }
  return null;
};
const valUser = (datos) => {
  const { error } = user.validate(datos, { abortEarly: false });
  if (error) {
    return error.details.map((detail) => detail.context.label);
  }
  return null;
};

const valLogin = (datos) => {
  const { error } = login.validate(datos, { abortEarly: false });
  if (error) {
    return error.details.map((detail) => detail.context.label);
  }
  return null;
};

const valPuesto = (datos) => {
  const { error } = puesto.validate(datos, { abortEarly: false });
  if (error) {
    return error.details.map((detail) => detail.context.label);
  }
  return null;
};
const valRol = (datos) => {
  const { error } = rol.validate(datos, { abortEarly: false });
  if (error) {
    return error.details.map((detail) => detail.context.label);
  }
  return null;
};

const formatAddress = (data) => {
  let address = "";
  // Validar y concatenar estado
  if (data.estado) {
    address += data.estado + ", ";
  }

  // Validar y concatenar municipio
  if (data.municipio) {
    address += data.municipio + ", ";
  }

  // Validar y concatenar colonia
  if (data.colonia) {
    address += data.colonia + ", ";
  }

  // Validar y concatenar calle
  if (data.calle) {
    address += "Calle " + data.calle + ", ";
  }

  // Validar y concatenar número exterior
  if (data.numeroExterno) {
    address += "Nº " + data.numeroExterno + ", ";
  }

  // Validar y concatenar número interior
  if (data.numeroInterno) {
    address += "Int. " + data.numeroInterno + ", ";
  }

  // Validar y concatenar código postal
  if (data.cp) {
    address += "C.P. " + data.cp;
  }

  // Eliminar la coma y el espacio final si la dirección no está vacía
  if (address.endsWith(", ")) {
    address = address.slice(0, -2);
  }
  return address;
};

let querryCreate = (objeto, table, id) => {
  let concatKeyString = `UPDATE ${table} SET `;
  let data = [];
  let keys = Object.keys(objeto);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    concatKeyString += `${key}=?`;
    data.push(objeto[key]);
    if (i < keys.length - 1) {
      concatKeyString += ",";
    }
  }
  concatKeyString += ` WHERE ${id}=?`;
  return { concatQuerry: concatKeyString, data };
};

let compareObjects = (obj1, obj2) => {
  let areEqual = true;
  const differences = {};
  for (let key in obj1) {
    if (obj1[key] !== obj2[key]) {
      areEqual = false;
      differences[key] = obj1[key];
    }
  }
  return { areEqual, differences };
};

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
    console.log(error)
    throw new Error("Error al comparar contraseñas");
  }
};

function  generateAccessToken(user) {
  return jwt.sign(user, process.env.SECRET, { expiresIn: "10m" });
}

function dateNow() {
  const now = new Date();
  const fechaActual = now.toISOString().split("T")[0];

  // Obtener la hora actual en formato 'HH:MM:SS'
  const horaActual = now.toTimeString().split(" ")[0];
  return fechaActual + ", " + horaActual;
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
module.exports = {
  valAddress,
  valPerson,
  valUser,
  valPuesto,
  valRol,
  valLogin,
  formatAddress,
  querryCreate,
  compareObjects,
  encriptarContrasena,
  compararContrasenas,
  generateAccessToken,
  dateNow,
  validateToken
};
