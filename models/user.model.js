const mongoose = require('mongoose');
const generateHelper = require("../helpers/generate");

const UserSchema = new mongoose.Schema(
    {
        fullName: String,
        email: String,
        password: String,

        googleId: String,

        loginType: {
            type: String,
            enum: ["local", "google"],
            default: "local"
        },

        tokenUser: {
            type: String,
            default: generateHelper.generateRandomString(20),
        },

        phone: String,
        address: String,
        provinceCode: String,
        provinceName: String,
        districtCode: String,
        districtName: String,
        wardCode: String,
        wardName: String,
        city: String,
        zipCode: String,
        country: String,
        avatar: String,
        status: {
            type: String,
            default: "active"
        },

        products_favorite: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            }
        ],

        deleted: {
            type: Boolean,
            default: false
        },
        deletedAt: Date,
    },
    {
        timestamps: true,
    }
);

// Indexing for performance
UserSchema.index({ email: 1, deleted: 1 }, { unique: true });
UserSchema.index({ tokenUser: 1 });
UserSchema.index({ deleted: 1, status: 1 });
UserSchema.index({ fullName: "text", email: "text" });

const User = mongoose.model("User", UserSchema, "users");

module.exports = User;