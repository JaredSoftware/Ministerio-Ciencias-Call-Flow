const mongoose = require("mongoose");

const users = new mongoose.Schema(
  {
    correo: { type: String },
    password: { type: String },
    name: { type: String },
    lastName: { type: String },
    Phone: { type: String },
    ID: { type: String },
    idAgent: { type: String, unique: true, sparse: true }, // Campo importante para identificar al agente
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'roles'
    },
    active: { type: Boolean }
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

module.exports = mongoose.model("users", users, "users");