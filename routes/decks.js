const express = require("express");
const router = express.Router();
const { check, validationResult, escape } = require("express-validator");
const fetch = require("node-fetch");
const fs = require("fs");

// Receives the Moxfield response array and returns only the processed relevant data
function processDeckJSON(returnedJSON) {
  return new Promise((resolve) => {
    let processedArray = [];
    returnedJSON.data.forEach((deck) => {
      if (deck.format !== "commander") {
        return;
      }
      processedArray.push({
        id: deck.id,
        name: deck.name,
        publicUrl: deck.publicUrl,
        mainCardImage: `https://assets.moxfield.net/cards/card-${deck.mainCardId}-art_crop.webp`,
        played: 0,
        lastPlayed: 000,
      });
    });
    resolve(processedArray);
  });
}

// Accesses the API to return the decks
async function accessAPI(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Return the data for the user
router.get("/:user", check("page").escape(), async (req, res) => {
  // Validates that the parameters are correct
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If one of them isn't, returns an error
    return res.status(400).json({ message: messages.PARAMETERS_ERROR });
  }
  // Loads the data into variables to use
  const user = req.params.user;
  const url = `https://api2.moxfield.com/v2/users/${user}/decks?pageSize=100`;

  // moxfieldData has the details of the decks ready for return, missing number of times played
  const moxfieldData = await processDeckJSON(await accessAPI(url));

  // Checks if the file exists
  // If it doesn't creates it and writes in the array
  // If it does, returns the content
  // async function verifyFile(filename, dataToWrite) {
  fs.open(`./files/${user}.json`, "r", function (fileDoesntExist, file) {
    // If the file doesn't exist, create it
    if (fileDoesntExist) {
      fs.writeFile(
        `./files/${user}.json`,
        JSON.stringify(moxfieldData),
        (err) => {
          if (err) console.error(err);
          return res.status(200).json(moxfieldData);
        }
      );
    } else {
      // If the file already exists
      // return the data to be updated later
      fs.readFile(`./files/${user}.json`, "utf8", function (err, fileData) {
        let returnArray = [];
        // Goes over the response array, adding the decks that were in the database
        // and the ones responded from Moxfield, for each, update the played count
        moxfieldData.forEach((moxfieldDeck) => {
          returnArray.push(moxfieldDeck);
        });
        JSON.parse(fileData).forEach((fileDeck) => {
          let foundIt = false;
          returnArray.forEach((returnDeck) => {
            if (fileDeck.id === returnDeck.id) {
              returnDeck.played = fileDeck.played;
              returnDeck.lastPlayed = fileDeck.lastPlayed;
              foundIt = true;
            }
          });
          if (!foundIt) {
            returnArray.push(fileDeck);
          }
        });

        return res.status(200).json(returnArray);
      });
    }
  });
});

module.exports = router;
