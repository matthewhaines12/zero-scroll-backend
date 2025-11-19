const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./config/db");
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const sessiosnRouter = require("./routes/sessions");

const PORT = 3001;

connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/sessions", sessiosnRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
