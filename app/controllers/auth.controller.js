const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");


const nodemailer = require('nodemailer');
const randomstring = require('randomstring')

const res = require('express/lib/response')

exports.signup = async (req, res) => {
  console.log("Password", req.body.password);

  try {
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8)
    });

    await user.save();

    if (req.body.roles) {
      const roles = await Role.find({
        name: { $in: req.body.roles }
      });

      user.roles = roles.map(role => role._id);
      await user.save();
    } else {
      const role = await Role.findOne({ name: "user" });

      user.roles = [role._id];
      await user.save();
    }

    res.send({ message: "User was registered successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username })
      .populate("roles", "-__v")
      .exec();

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
    }

    const token = jwt.sign(
      { id: user.id },
      config.secret,
      {
        algorithm: 'HS256',
        allowInsecureKeySizes: true,
        expiresIn: 86400, // 24 hours
      }
    );

    const authorities = user.roles.map(role => `ROLE_${role.name.toUpperCase()}`);

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      roles: authorities,
      accessToken: token
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const sendResetPasswordMail = async (username, email, token, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465, // Use port 465 for SSL
      secure: true,
      auth: {
        user: config.emailUser, // Replace with your email
        pass: config.emailPassword, // Use the App Password generated for your email
      },
    });

    const mailOptions = {
      from: config.emailUser, // Replace with your email
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Hi ${username},</p><p>Please copy the link to reset your password: <a href="http://localhost:4200/api/resetpassword?token=${token}">Reset Password</a></p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(400).send({ success: false, msg: error.message });
      } else {
        console.log('Mail has been sent:', info.response);
        res.status(200).send({ success: true, msg: 'Email sent successfully' });
      }
    });
  } catch (error) {
    res.status(500).send({ success: false, msg: error.message });
  }
};

exports.forget_password = async (req, res) => {
  try {
    const userData = await User.findOne({ email: req.body.email });

    if (userData) {
      const randomString = randomstring.generate();
      const data = await User.updateOne({ email: req.body.email }, { $set: { token: randomString } });
      sendResetPasswordMail(userData.username, userData.email, randomString, res);
    } else {
      res.status(200).send({ success: true, msg: 'This email does not exist' });
    }
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

// exports.reset_password = async(req,res)=>{
//   console.log("Request Body",req.body);
//   try{
//     const token = req.query.token;
//     const data = await User.findOne({token:token});
//     if(data){
//       const password = req.body.password;
//       const hashedPassword = bcrypt.hashSync(password, 8);
//       const updateData=await User.findByIdAndUpdate({_id:data._id},{$set:{password:hashedPassword,token:''}},{new:true});

//       res.status(200).json({success:true,updatedData:updateData});


//     }
//     else{
//       res.status(200).send({ success: false, msg: "This link has been expired" });
//     }

//   }catch(error){
//     res.status(400).send({ success: false, msg: error.message });
//   }
// }


exports.reset_password = async (req, res) => {
  console.log("Request Body", req.body);
  try {
    const token = req.query.token;
    const data = await User.findOne({ token: token });

    if (data) {
      if (!req.body.password) {
        return res.status(400).send({ success: false, msg: "Password is required in the request body" });
      }

      const password = req.body.password;
      const hashedPassword = bcrypt.hashSync(password, 8);
      const updateData = await User.findByIdAndUpdate(
        { _id: data._id },
        { $set: { password: hashedPassword, token: '' } },
        { new: true }
      );

      res.status(200).json({ success: true, updatedData: updateData });
    } else {
      res.status(200).send({ success: false, msg: "This link has been expired" });
    }
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};
