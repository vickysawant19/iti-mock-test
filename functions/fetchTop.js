import { Client, Account, Databases } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    // Ensure req is defined
    if (!req || !req.headers) {
      throw new Error("Request object is not defined or missing headers");
    }
    return req.json({
      appwrite_url: process.env.APPWRITE_URL,
    });

    log(req.headers);
    return res.json({ message: "Got the function data" });
  } catch (error) {
    error(error);
    res.status(500).json({ error: error.message });
  }
};
