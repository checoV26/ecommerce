const Joi = require("joi");

// definimos el objeto de validación

const address = Joi.object({
  pais: Joi.string().required(),
  estado: Joi.string().required(),
  municipio: Joi.string().required(),
  colonia: Joi.string().required(),
  calle: Joi.string().required(),
  nExterior: Joi.string().required(),
  nInterior: Joi.string().allow(""),
  cp: Joi.number().required(),
});

const person = Joi.object({
  nombre: Joi.string().required(),
  apellidoPaterno: Joi.string().required(),
  apellidoMaterno: Joi.string().required(),
  genero: Joi.string().required(),
  rfc: Joi.string().length(13).allow(""),
  curp: Joi.string().length(18).required(),
  nss: Joi.number().integer().min(10000000000).max(99999999999).required(),
  correo: Joi.string().email().required(),
  telefono: Joi.number().integer().min(1000000000).max(9999999999).allow(""),
  celular: Joi.number().integer().min(1000000000).max(9999999999).required(),
  fechaIngreso: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  direccion: Joi.number().required(),
});

const user = Joi.object({
  idPersonal: Joi.number().required(),
  user: Joi.string().required(),
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

const formatAddress = (data) => {
  let address = "";

  // Validar y concatenar país
  if (data.pais) {
    address += data.pais + ", ";
  }

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
  if (data.nExterior) {
    address += "Nº " + data.nExterior + ", ";
  }

  // Validar y concatenar número interior
  if (data.nInterior) {
    address += "Int. " + data.nInterior + ", ";
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
module.exports = {
  valAddress,
  valPerson,
  valUser,
  formatAddress
};
