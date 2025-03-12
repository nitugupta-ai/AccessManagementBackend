const express = require("express");
const router = express.Router();
const {db} = require("../config/db");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");

// ✅ Get All Modules
router.get("/", authMiddleware, async (req, res) => {
    try {
        const [modules] = await db.execute("SELECT * FROM modules");
        res.json(modules);
    } catch (error) {
        console.error("Error fetching modules:", error);
        res.status(500).json({ error: "Error fetching modules", details: error.message });
    }
});

// ✅ Create Module (Admin Only)
router.post("/", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    const { name, description } = req.body;

    try {
        await db.execute(
            "INSERT INTO modules (name, description) VALUES (?, ?)",
            [name, description || null]  // ✅ Allow NULL if description is missing
        );
        res.status(201).json({ message: "Module created successfully" });
    } catch (error) {
        console.error("Error creating module:", error);
        res.status(500).json({ error: "Error creating module", details: error.message });
    }
});

// ✅ Delete Module (Admin Only)
router.delete("/:id", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    const { id } = req.params;

    try {
        await db.execute("DELETE FROM modules WHERE id = ?", [id]);
        res.json({ message: "Module deleted successfully" });
    } catch (error) {
        console.error("Error deleting module:", error);
        res.status(500).json({ error: "Error deleting module", details: error.message });
    }
});

module.exports = router;
