const mongoose = require("mongoose");

const clientes = new mongoose.Schema(
  {
    name: { type: String },
    deuda: { type: String },
    activo:{  type:Boolean  }
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

module.exports = mongoose.model("clientes", clientes, "clientes");
