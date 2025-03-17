const express = require("express");
const router = express.Router();
const { db } = require("../config/db.js");
const authMiddleware = require("../middleware/auth.js");

// ✅ Get all modules assigned to a user based on their roles
router.get('/:userId',authMiddleware, async (req, res) => {
    try {
        const userId = req.params.userId;
        const query = `
            SELECT DISTINCT m.id, m.name, m.description 
            FROM user_roles ur
            JOIN role_modules rm ON ur.role_id = rm.role_id
            JOIN modules m ON rm.module_id = m.id
            WHERE ur.user_id = ?;
        `;

        const [rows] = await db.execute(query, [userId]);

        console.log("✅ Correct Modules API Response:", rows);
        res.json(rows);
    } catch (error) {
        console.error("❌ Error fetching user modules:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// ✅ Assign a module to a role (Admin only)
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { role_id, module_id, permission } = req.body;
        const userRole = req.user.role;

        if (userRole !== "admin") {
            return res.status(403).json({ message: "Forbidden: Only admin can assign modules" });
        }

        if (!role_id || !module_id || !permission) {
            return res.status(400).json({ message: "Role ID, Module ID, and Permission are required" });
        }

        await db.execute(
            `INSERT INTO role_modules (role_id, module_id, permission) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE permission = VALUES(permission)`,
            [role_id, module_id, permission]
        );

        res.json({ message: "Module assigned to role successfully" });
    } catch (error) {
        console.error("Error assigning module:", error);
        res.status(500).json({ message: "Error assigning module", error: error.message });
    }
});

// ✅ Remove a module from a role (Admin only)
router.delete("/", authMiddleware, async (req, res) => {
    try {
        const { role_id, module_id } = req.body;
        const userRole = req.user.role;

        if (userRole !== "admin") {
            return res.status(403).json({ message: "Forbidden: Only admin can remove modules from roles" });
        }

        const [result] = await db.execute(
            "DELETE FROM role_modules WHERE role_id = ? AND module_id = ?",
            [role_id, module_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Module not found or already removed from role" });
        }

        res.json({ message: "Module removed from role successfully" });
    } catch (error) {
        console.error("Error removing module:", error);
        res.status(500).json({ message: "Error removing module", error: error.message });
    }
});

module.exports = router;
