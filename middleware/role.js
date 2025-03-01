module.exports = (role) => {
    return (req, res, next) => {
        console.log("Role Middleware: Checking role...");
        
        if (!req.user) {
            console.log("Unauthorized: No user found in request");
            return res.status(401).json({ message: "Unauthorized" });
        }

        console.log("User Role:", req.user.role, "| Required Role:", role);

        if (req.user.role !== role) {
            console.log("Forbidden: Insufficient permissions for", req.user.role);
            return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
        }

        console.log("Role check passed for:", req.user.role);
        next();
    };
};
