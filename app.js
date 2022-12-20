import express from "express";
import cors from "cors";

const PORT = process.env.PORT || 3001;

const app = express();

// Middleware for cors
app.use(cors());

// Routes
import { deckRoutes } from "./routes/decks.js";
app.use("/decks", deckRoutes);

import { countRoutes } from "./routes/count.js";
app.use("/count", countRoutes);

app.listen(PORT, (error) => {
  if (!error)
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  else console.log("Error occurred, server can't start", error);
});
