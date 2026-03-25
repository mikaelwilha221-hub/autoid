const path = require("path");

module.exports = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "change-this-secret",
  dbPath: path.join(process.cwd(), "data", "autoid.sqlite")
};
