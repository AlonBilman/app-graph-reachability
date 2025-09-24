import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = process.env.PORT;
app.use(express.json());

app.get("/ping", (_req, res) => {
  res.status(200).send("pong");
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

// works with postman
