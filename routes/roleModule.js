const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

//  Assign Modules to Role
router.post("/assign", authMiddleware, (req, res) => {
    const { role_id, module_ids, permission } = req.body;

    if (!role_id || !module_ids || module_ids.length === 0) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const values = module_ids.map((module_id) => [role_id, module_id, permission]);

    db.query(
        "INSERT INTO role_modules (role_id, module_id, permission) VALUES ? ON DUPLICATE KEY UPDATE permission=VALUES(permission)",
        [values],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({ message: "Modules assigned successfully", affectedRows: results.affectedRows });
        }
    );
});

// Remove a Module from a Role
router.post("/remove", authMiddleware, (req, res) => {
    const { role_id, module_id } = req.body;

    if (!role_id || !module_id) {
        return res.status(400).json({ message: "Invalid input" });
    }

    db.query("DELETE FROM role_modules WHERE role_id = ? AND module_id = ?", [role_id, module_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: "Module removed successfully", affectedRows: results.affectedRows });
    });
});

//  Get All Role-Module Assignments (Including Names)
router.get("/", authMiddleware, async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT rm.role_id, rm.module_id, rm.permission, r.name AS role_name, m.name AS module_name 
            FROM role_modules rm
            JOIN roles r ON rm.role_id = r.id
            JOIN modules m ON rm.module_id = m.id`
        );

        res.json(results);
    } catch (error) {
        console.error("Error fetching role-modules:", error.message);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
