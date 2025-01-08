const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    username: {
        type: String,
    },
    phone: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
}, {
    timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
