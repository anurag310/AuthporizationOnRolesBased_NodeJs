const db = require("../models");
const ROLES = db.ROLES;
const User = db.user;

const checkDuplicateUsernameOrEmail = (req, res, next) => {

  console.log("Request",req.body);
  // Check if the username is already in use
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (user) {
        return res.status(400).json({ message: "Username is already taken." });
      }

      // Check if the email is already in use
      User.findOne({ email: req.body.email })
        .then((user) => {
          if (user) {
            return res.status(400).json({ message: "Email is already registered." });
          }

          next();
        })
        .catch((error) => {
          return res.status(500).json({ message: error.message });
        });
    })
    .catch((error) => {
      return res.status(500).json({ message: error.message });
    });
};
const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: `Failed! Role ${req.body.roles[i]} does not exist!`
        });
        return;
      }
    }
  }

  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted
};

module.exports = verifySignUp;