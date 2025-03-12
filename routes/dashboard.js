const express = require("express");
const router = express.Router();
const {db} = require("../config/db");
const authMiddleware = require("../middleware/auth.js");

// ✅ Get allowed modules for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let query, values;

        if (userRole === "admin") {
            // Admin sees all modules
            query = `
                SELECT DISTINCT m.id, m.name, rm.permission 
                FROM modules m
                LEFT JOIN role_modules rm ON m.id = rm.module_id`;
            values = [];
        } else {
            // Users see only modules assigned to their roles
            query = `
                SELECT DISTINCT m.id, m.name, rm.permission 
                FROM modules m
                JOIN role_modules rm ON m.id = rm.module_id
                JOIN user_roles ur ON rm.role_id = ur.role_id
                WHERE ur.user_id = ?`;
            values = [userId];
        }

        const [modules] = await db.execute(query, values);
        res.json(modules);
    } catch (error) {
        console.error("Error fetching dashboard modules:", error);
        res.status(500).json({ message: "Error fetching dashboard modules", error });
    }
});

module.exports = router;
