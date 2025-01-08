const { Router } = require("express");
const router = Router();
const jwt = require("jsonwebtoken");
const User = require('../models/user'); // Adjust path as per your folder structure
const Admin = require('../models/admin'); // Adjust path as per your folder structure

router.post("/in", async (req, res) => {
    const { username, password } = req.body;

    // Prepare payload for JWT
    let payload = {
        username: username,
    };
    let accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 });

    try {
        // Check in Admin table first
        const admin = await Admin.findOne({ username: username, password: password }).select('-password');

        if (admin) {
            return res.status(200).json({
                jwt: accessToken,
                isAdmin: true,
                user: { username: admin.username, role: "admin", data: admin },
            });
        }

        // If not found in Admin, check in User table
        const user = await User.findOne({ username: username, password: password }).select('-password');
        if (user) {
            return res.status(200).json({
                jwt: accessToken,
                isAdmin: false,
                user: { username: user.username, role: "user", data: user },
            });
        }

        // If not found in either table
        return res.status(400).json({ error: "Invalid credentials.", jwt: null });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

router.post('/create/employee', async (req, res) => {
    const { name, username, phone, email, password } = req.body;
    try {
        // Create a new record object (ID will be auto-incremented)
        let newUser = new User({
            name, username, phone, email, password
        });
        // Save the record to the database
        let data = await newUser.save();

        // Log the saved data
        console.log(data);
        // Respond with the saved data
        res.status(200).json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/create/admin', async (req, res) => {
    const { name, username, phone, email, password } = req.body;

    try {
        // Create a new admin object
        let newAdmin = new Admin({
            name,
            username,
            phone,
            email,
            password
        });

        // Save the admin to the database
        let data = await newAdmin.save();

        // Log the saved data
        console.log(data);

        // Respond with the saved data
        res.status(200).json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.post('/all', async (req, res) => {
    try {
        // Fetch only usernames from the User collection
        const users = await User.find({}, 'name'); // Fetch only the 'username' field
        const usernames = users.map(user => user.name); // Extract usernames

        res.status(200).json({ usernames });
    } catch (err) {
        console.error('Error fetching usernames:', err);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/all-admin', async (req, res) => {
    try {
        // Fetch only usernames from the User collection
        const users = await Admin.find({}, 'name'); // Fetch only the 'username' field
        const usernames = users.map(user => user.name); // Extract usernames

        res.status(200).json({ usernames });
    } catch (err) {
        console.error('Error fetching usernames:', err);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
