const mongoose = require("mongoose");

const schemaPlatano = new mongoose.Schema(
  {
    clienteFinal: { type: String },
    grueso: { type: String },
    precioGrueso: { type: String },
    segunda: { type: String },
    precioSegunda: { type: String },
    pica: { type: String },
    precioPica: { type: String },
    pago: { type: Boolean },
    identficacionDeViaje: { type: String },
    sumaPartida: { type: String },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = schemaPlatano;
