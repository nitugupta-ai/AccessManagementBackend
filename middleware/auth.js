const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
    const token = req.header("Authorization");
    console.log("Received token:", token); // 🔍 Debug log

    if (!token) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        console.log("Decoded token:", decoded); // 🔍 Debug log

        req.user = decoded;
        next(); // Proceed to the next middleware/route
    } catch (error) {
        console.error("JWT verification error:", error.message);
        res.status(401).json({ message: "Invalid token." });
    }
};
