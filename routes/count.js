import express from "express";
import AWS from "aws-sdk";
const router = express.Router();
import { check, validationResult } from "express-validator";
import { checkIfFileExists } from "../utils/utils.js";

// Updates the play count and last played date of a specific deck
router.put(
  ["/:user/:deck/:operation", "/:user/:deck"],
  check("user").escape(),
  check("deck").escape(),
  check("operation").optional(),
  async (req, res) => {
    // Validates that the parameters are correct
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If one of them isn't, returns an error
      return res.status(400).json({
        message: "Ocurrió un error, por favor intenta nuevamente más tarde",
      });
    }
    // Loads the data into variables to use
    const user = req.params.user;
    const deck = req.params.deck;
    const operation = req.params?.operation;
    const fileName = `${user}.json`;

    // Configure AWS S3
    AWS.config.update({ region: process.env.AWS_REGION });
    const s3 = new AWS.S3({ apiVersion: process.env.AWS_API_VERSION });

    try {
      // Checks if the file exists
      // If it doesn't returns an error
      // If it does, returns the content
      const fileData = await checkIfFileExists(s3, fileName);
      // Checks if the file exists in the S3 bucket
      if (!fileData) {
        return res
          .status(404)
          .json({ message: "El usuario especificado no existe" });
      }
      let foundDeck = false;
      let deckForUIUpdate = {};
      const today = Date.now();
      // If the file already exists
      // return the data to be updated later
      fileData.forEach((fileDeck) => {
        if (fileDeck.id === deck) {
          foundDeck = true;
          if (operation === "minus") {
            if (fileDeck.played > 0) {
              fileDeck.played = fileDeck.played - 1;
            }
          } else {
            fileDeck.played = fileDeck.played + 1;
            fileDeck.lastPlayed = today;
          }
          deckForUIUpdate = fileDeck;
        }
      });
      if (!foundDeck) {
        return res
          .status(404)
          .json({ message: "Mazo no encontrado, verifique el código" });
      }
      // Update the file in S3
      const uploadParams = {
        Bucket: "commandertracker",
        Body: JSON.stringify(fileData),
        Key: fileName,
      };
      s3.upload(uploadParams, function (err, data) {
        if (err) {
          console.log("Error", err);
          return res
            .status(500)
            .json({ message: "Hubo un error al actualizar tus datos" });
        }
        if (data) {
          return res.status(200).json(deckForUIUpdate);
        }
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        message:
          "Hubo un problema al cargar los mazos, verifica que el nombre de usuario sea el correcto.",
      });
    }
  }
);

export { router as countRoutes };
