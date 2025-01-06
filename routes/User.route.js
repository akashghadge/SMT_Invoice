const { Router } = require("express");
const router = Router();
const jwt = require("jsonwebtoken");
const User = require('../models/user'); // Adjust path as per your folder structure

router.post("/in", async (req, res) => {
    const { username, password } = req.body;
    let payload = {
        username: username,
    }
    let accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 });
    if (username == 'admin' && password == 'password') {
        res.status(200).json({ "jwt": accessToken, isAdmin: true, user: payload })
    }
    else {
        const user = await User.findOne({ username: username, password: password });
        if (!user) {
            return res.status(400).json({ error: "User not found.", "jwt": null });
        }
        res.status(200).json({ "jwt": accessToken, isAdmin: false, user: user });
    }
})

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

module.exports = router;
