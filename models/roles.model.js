const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  description: {
    type: String,
    trim: true,
    maxlength: 500
  },

  permissions: {
    type: [String], 
    default: []
  },

  deleted: {
    type: Boolean,
    default: false
  },

  deletedAt: Date

}, {
  timestamps: true
});



roleSchema.index(
  { title: 1, deleted: 1 },
  { unique: true }
);


roleSchema.index({ deleted: 1, createdAt: -1 });

const Role = mongoose.model("Role", roleSchema, "roles");

module.exports = Role;