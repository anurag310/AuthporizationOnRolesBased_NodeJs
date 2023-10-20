const { verifySignUp } = require("../middlewares");
const controller = require("../controllers/auth.controller");
var router = require('express').Router();
module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
});
  
  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted
    ],
    controller.signup
  );

  app.post("/api/auth/signin", controller.signin);

  app.post("/api/auth/forgetpassword",controller.forget_password);

  app.post("/api/resetpassword",controller.reset_password);
};