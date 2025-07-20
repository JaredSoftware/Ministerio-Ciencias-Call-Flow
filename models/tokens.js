const mongoose = require("mongoose");

const tokens = new mongoose.Schema(
  {
    token: { type: String },
    name: { type: String },
    whenWasMaked:{type: Date},
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("tokens", tokens, "tokens");