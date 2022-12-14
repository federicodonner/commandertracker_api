const express = require("express");
const router = express.Router();
const { check, validationResult, escape } = require("express-validator");
const fetch = require("node-fetch");
const fs = require("fs");

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

    try {
      // Checks if the file exists
      // If it doesn't returns an error
      // If it does, returns the content
      fs.open(`./files/${user}.json`, "r", function (fileDoesntExist, file) {
        // If the file doesn't exist, create it
        if (fileDoesntExist) {
          return res
            .status(404)
            .json({ message: "El usuario especificado no existe" });
        } else {
          let foundDeck = false;
          let deckForUIUpdate = {};
          let dataToUpdate = [];
          const today = Date.now();
          // If the file already exists
          // return the data to be updated later
          fs.readFile(`./files/${user}.json`, "utf8", function (err, fileData) {
            dataToUpdate = JSON.parse(fileData);
            dataToUpdate.forEach((fileDeck) => {
              if (fileDeck.id === deck) {
                foundDeck = true;
                if (operation === "minus" && fileDeck.played > 0) {
                  fileDeck.played = fileDeck.played - 1;
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
            fs.writeFile(
              `./files/${user}.json`,
              JSON.stringify(dataToUpdate),
              (err) => {
                if (err) console.error(err);
                return res.status(200).json(deckForUIUpdate);
              }
            );
          });
        }
      });
    } catch {
      return res.status(400).json({
        message:
          "Hubo un problema al cargar los mazos, verifica que el nombre de usuario sea el correcto.",
      });
    }
  }
);

module.exports = router;
