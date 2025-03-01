const db = require("../config/db");

const checkModuleAccess = (moduleId) => {
    return (req, res, next) => {
        const { role } = req.user; // Extract role from JWT

        db.query(
            "SELECT module_id FROM role_modules WHERE role_id = (SELECT id FROM roles WHERE name = ?)",
            [role],
            (err, results) => {
                if (err) return res.status(500).json({ error: err.message });

                const allowedModules = results.map(row => row.module_id);

                if (!allowedModules.includes(parseInt(moduleId))) {
                    return res.status(403).json({ message: "Forbidden: Access denied" });
                }

                next();
            }
        );
    };
};

module.exports = checkModuleAccess;
