const express = require("express");
const cors = require("cors");

const PORT = process.env.port || 3001;

const app = express();

// Middleware for cors
app.use(cors());

// Routes

app.listen(PORT, (error) => {
  if (!error)
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  else console.log("Error occurred, server can't start", error);
});
