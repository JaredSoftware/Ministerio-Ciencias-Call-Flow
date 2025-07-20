const mongoose = require("mongoose");

const users = new mongoose.Schema(
  {
    correo: { type: String },
    password: { type: String },
    name: { type: String },
    role:{type:  mongoose.Schema.Types.ObjectId},
    active:{type:Boolean}
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

module.exports = mongoose.model("users", users, "users");