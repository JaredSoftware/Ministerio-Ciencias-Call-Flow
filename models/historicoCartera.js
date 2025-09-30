const mongoose = require("mongoose");

const tokens = new mongoose.Schema(
  {
    valor: { type: String },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = tokens;

