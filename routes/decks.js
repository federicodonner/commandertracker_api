import express from "express";
import { check } from "express-validator";
import AWS from "aws-sdk";
const router = express.Router();
import {
  checkIfFileExists,
  processDeckJSON,
  accessAPI,
} from "../utils/utils.js";

// Return the data for the user
router.get("/:user", check("user").escape(), async (req, res) => {
  console.log("estoy en /:user");
  // Configure AWS S3
  AWS.config.update({ region: process.env.AWS_REGION });
  const s3 = new AWS.S3({ apiVersion: process.env.AWS_API_VERSION });

  // Loads the data into variables to use
  const user = req.params.user;
  const url = `https://api2.moxfield.com/v2/users/${user}/decks?pageSize=100`;
  const fileName = `${user}.json`;
  let latestDate = 0;

  // moxfieldData has the details of the decks ready for return, missing number of times played
  try {
    console.log("estoy en el try");
    const moxfieldResponse = await accessAPI(url);
    console.log(moxfieldResponse);
    return;
    const moxfieldData = await processDeckJSON(moxfieldResponse);
    const fileData = await checkIfFileExists(s3, fileName);

    console.log(user, url, moxfieldData, fileData);

    // Checks if the file exists in the S3 bucket
    if (fileData) {
      // If the file exists in S3, execute this code
      let returnArray = [];
      // Goes over the response array, adding the decks that were in the database
      // and the ones responded from Moxfield, for each, update the played count
      moxfieldData.forEach((moxfieldDeck) => {
        returnArray.push(moxfieldDeck);
      });
      fileData.forEach((fileDeck) => {
        let foundIt = false;
        returnArray.forEach((returnDeck) => {
          if (fileDeck.id === returnDeck.id) {
            returnDeck.played = fileDeck.played;
            returnDeck.lastPlayed = fileDeck.lastPlayed;
            foundIt = true;
          }
          if (fileDeck.lastPlayed > latestDate) {
            latestDate = fileDeck.lastPlayed;
          }
        });
        if (!foundIt) {
          // returnArray.push(fileDeck);
        }
      });

      // Once the decks list is done, upload it to S3
      // Create the file

      const uploadParams = {
        Bucket: "commandertracker",
        Body: JSON.stringify(returnArray),
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
          return res.status(200).json({ latestDate, decks: returnArray });
        }
      });
    } else {
      // If the file doesn't exist in S3, exeute this code
      const uploadParams = {
        Bucket: "commandertracker",
        Body: JSON.stringify(moxfieldData),
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
          return res.status(200).json({ latestDate, decks: returnArray });
        }
      });
    }
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      message:
        "Hubo un problema al cargar los mazos, verifica que el nombre de usuario sea el correcto.",
    });
  }
});

export { router as deckRoutes };
