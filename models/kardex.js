const mongoose = require("mongoose");

const kardex = new mongoose.Schema(
  {
    nombreClienteFinal: { type: String },
    deuda: { type: String },
    aFavor: { type: String },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

module.exports = kardex
