const Joi = require("joi");
const bcrypt = require("bcrypt");

const clientSchema = Joi.object({
    nombre: Joi.string().min(3).max(50).required(),
    apellidoP: Joi.string().min(5).max(50).required(),
    apellidoM: Joi.string().min(5).max(50).required(),
    correo: Joi.string().email().required(),
    user: Joi.string().min(5).max(20).required(),
    password: Joi.string().min(8).required()
});

const validateCliente = (datos) => {
    const { error } = clientSchema.validate(datos, { abortEarly: false });
    if (error) {
        return error.details.map((detail) => detail.context.label);
    }
    return null;
}

const encriptarContrasena = async (contrasena) => {
    const saltRounds = 10; // Costo del algoritmo de hashing
    const hash = await bcrypt.hash(contrasena, saltRounds);
    return hash.slice(0, 64); // Truncar el hash a 64 caracteres
  };

module.exports = {
    validateCliente,
    encriptarContrasena
}