const mongoose = require("mongoose");

const roles = new mongoose.Schema(
	{
		nombre: { type: String },
		permissions: {type:Array}
	},
	{
		versionKey: false,
		timestamps: false,
	}
);

module.exports = mongoose.model("roles", roles, "roles");