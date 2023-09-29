const express = require("express");
const cors = require("cors");
const dbConfig = require("./app/config/db.config");
const db = require("./app/models");
const Role = db.role;
var bodyParser = require('body-parser')
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
db.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to MongoDB.");
    initial();
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });

// Simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to your application." });
});

// Routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

// Port configuration
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

// Initialize roles if not exist
async function initial() {
  try {
    const count = await Role.estimatedDocumentCount();
    if (count === 0) {
       await new Role({
        name: "user",
      }).save();

       await new Role({
        name: "moderator",
      }).save();

      await new Role({
        name: "admin",
      }).save();

      console.log("Roles added to the roles collection");
    }
  } catch (err) {
    console.error("Error initializing roles:", err);
  }
}
