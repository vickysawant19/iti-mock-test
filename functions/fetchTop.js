// const sdk = require("node-appwrite");
// const { appwriteService } = require("../src/appwrite/appwriteConfig");

module.exports = async function (req, res) {
  //   const database = appwriteService.getDatabases();

  try {
    return res.json({ message: "Got the function data" });
  } catch (error) {
    console.log(error);
  }
};
