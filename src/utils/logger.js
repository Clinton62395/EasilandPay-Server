import winston from "winston";
// Création du logger
export const logger = winston.createLogger({
  level: "info", // niveau minimum
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), // affiche dans la console
    new winston.transports.File({ filename: "app.log" }), // écrit dans un fichier
  ],
});
