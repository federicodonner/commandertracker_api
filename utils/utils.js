import fetch from "node-fetch";

// Checks if the file exists in S3
// if it does, return the contents in JSON
// if not, return false
export async function checkIfFileExists(s3, fileName) {
  try {
    const theFile = await s3
      .getObject({ Bucket: "commandertracker", Key: fileName })
      .promise();
    return JSON.parse(theFile.Body.toString("utf-8"));
  } catch {
    return false;
  }
}

// Receives the Moxfield response array and returns only the processed relevant data
export function processDeckJSON(returnedJSON) {
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
        lastPlayed: 0,
      });
    });
    resolve(processedArray);
  });
}

// Accesses the API to return the decks
export async function accessAPI(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'",
    },
  });
  const data = await response.json();
  return data;
}
