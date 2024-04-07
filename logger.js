const winston = require('winston');
const { join } = require('path');

const logsFolder = join(__dirname, 'logs');
const logFilename = join(logsFolder, 'app.log');

// Define los niveles de log personalizados
const customLevels = {
  levels: {
    error: 0,
    warning: 1,
    info: 2,
    success: 3
  },
  colors: {
    error: 'red',
    warning: 'yellow',
    info: 'green',
    success: 'blue'
  }
};

// Registra los niveles de log personalizados en Winston
winston.addColors(customLevels.colors);

const logger = winston.createLogger({
  levels: customLevels.levels, // Usa los niveles de log personalizados
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: logFilename })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = {
  logger
};