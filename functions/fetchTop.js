// const sdk = require("node-appwrite");
const { appwriteService } = require("../src/appwrite/appwriteConfig");

module.exports = async function (req, res) {
  try {
    // Ensure req is defined
    if (!req || !req.headers) {
      throw new Error("Request object is not defined or missing headers");
    }

    context.log(req.headers);
    res.json({ message: "Got the function data" });
  } catch (error) {
    context.error(error);
    res.status(500).json({ error: error.message });
  }
};
