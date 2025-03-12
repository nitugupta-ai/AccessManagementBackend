const express = require("express");
const {db} = require("../config/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/assign", authMiddleware, (req, res) => {
    console.log("Received request body:", req.body); 

    let { role_id, module_ids, permission } = req.body;

    if (!role_id || !module_ids || !Array.isArray(module_ids) || module_ids.length === 0) {
        console.error("Invalid input:", req.body);
        return res.status(400).json({ message: "Invalid input" });
    }

    // Convert role_id and module_ids to numbers
    role_id = Number(role_id);
    module_ids = module_ids.map(id => Number(id));

    const values = module_ids.map(module_id => [role_id, module_id, permission]);

    db.query(
        "INSERT INTO role_modules (role_id, module_id, permission) VALUES ? ON DUPLICATE KEY UPDATE permission=VALUES(permission)",
        [values],
        (err, results) => {
            if (err) {
                console.error("Database error:", err.message);
                return res.status(500).json({ error: err.message });
            }

            res.json({ message: "Modules assigned successfully", affectedRows: results.affectedRows });
        }
    );
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

// ✅ Get All Role-Module Assignments
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

// ✅ Get Modules Assigned to a Specific Role
router.get("/:role_id", authMiddleware, async (req, res) => {
    const { role_id } = req.params;

    try {
        const [modules] = await db.query(
            `SELECT m.name AS module_name, rm.permission 
            FROM role_modules rm
            JOIN modules m ON rm.module_id = m.id
            WHERE rm.role_id = ?`,
            [role_id]
        );

        if (modules.length === 0) {
            return res.status(404).json({ message: "No modules assigned to this role" });
        }

        res.json(modules);
    } catch (error) {
        console.error("Error fetching role modules:", error.message);
        res.status(500).json({ error: "Failed to fetch role modules", details: error.message });
    }
});

// ✅ Get Modules for Logged-in User
router.get("/user", authMiddleware, async (req, res) => {
    const { role_id } = req.user; // Ensure role_id is attached to `req.user`

    if (!role_id) {
        return res.status(400).json({ message: "User role not found" });
    }

    try {
        const [modules] = await db.query(
            `SELECT m.name AS module_name, rm.permission 
            FROM role_modules rm
            JOIN modules m ON rm.module_id = m.id
            WHERE rm.role_id = ?`,
            [role_id]
        );

        if (modules.length === 0) {
            return res.status(404).json({ message: "No modules assigned to this role" });
        }

        res.json(modules);
    } catch (error) {
        console.error("Error fetching user role modules:", error.message);
        res.status(500).json({ error: "Failed to fetch role modules" });
    }
});

router.get("/user", authMiddleware, async (req, res) => {
    const { role_id } = req.user;

    if (!role_id) {
        return res.status(404).json({ message: "User role not found or no modules assigned" });
    }

    try {
        const [modules] = await db.query(
            `SELECT m.name AS module_name, rm.permission 
            FROM role_modules rm
            JOIN modules m ON rm.module_id = m.id
            WHERE rm.role_id = ?`,
            [role_id]
        );

        if (modules.length === 0) {
            return res.status(404).json({ message: "No modules assigned to this role" });
        }

        res.json(modules);
    } catch (error) {
        console.error("Error fetching user role modules:", error.message);
        res.status(500).json({ error: "Failed to fetch role modules" });
    }
});



module.exports = router;
