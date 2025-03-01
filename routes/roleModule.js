const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// ✅ Assign Modules to Role
router.post("/assign", authMiddleware, (req, res) => {
    const { role_id, module_ids } = req.body;

    if (!role_id || !module_ids || module_ids.length === 0) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const values = module_ids.map((module_id) => [role_id, module_id]);

    db.query("INSERT IGNORE INTO role_modules (role_id, module_id) VALUES ?", [values], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: "Modules assigned successfully", affectedRows: results.affectedRows });
    });
});

// ✅ Remove a Module from a Role
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

// ✅ Get All Modules Assigned to a Role
router.get("/:role_id", authMiddleware, (req, res) => {
    const { role_id } = req.params;

    db.query("SELECT module_id FROM role_modules WHERE role_id = ?", [role_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ role_id, modules: results.map(row => row.module_id) });
    });
});

module.exports = router;
