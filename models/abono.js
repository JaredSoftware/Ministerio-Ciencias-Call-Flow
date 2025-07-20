const mongoose = require("mongoose");

const schemaAbono = new mongoose.Schema(
  {
    clienteFinal: { type: String },
    cantidadAbonada: { type: String },
    cartera: { type: String },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = schemaAbono;
