const path = require("path");

const renderDiskMountPath = process.env.RENDER_DISK_MOUNT_PATH || "";
const envDbPath = process.env.DB_PATH || "";

module.exports = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "change-this-secret",
  dbPath: envDbPath
    ? envDbPath
    : renderDiskMountPath
      ? path.join(renderDiskMountPath, "autoid.sqlite")
      : path.join(process.cwd(), "data", "autoid.sqlite")
};
