import 'dotenv/config';

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || "https://auth.itimitra.in/v1";
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest";
const API_KEY = process.env.VITE_APPWRITE_API_KEY || "";
const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const COL_ID = "batch_game_settings";

async function main() {
  try {
    // 1. Get current collection attributes
    const getRes = await fetch(`${ENDPOINT}/databases/${DB_ID}/collections/${COL_ID}`, {
      headers: {
        "X-Appwrite-Project": PROJECT_ID,
        "X-Appwrite-Key": API_KEY,
      },
    });
    const colData = await getRes.json();
    console.log("Collection Attributes:", colData.attributes);

    const attr = colData.attributes?.find((a) => a.key === "selectedModuleName");
    console.log("Current selectedModuleName attribute:", attr);

    // 2. Update string attribute size to 4096 (or 10000)
    console.log("Updating attribute selectedModuleName size to 4096...");
    const putRes = await fetch(`${ENDPOINT}/databases/${DB_ID}/collections/${COL_ID}/attributes/string/selectedModuleName`, {
      method: "PUT",
      headers: {
        "X-Appwrite-Project": PROJECT_ID,
        "X-Appwrite-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        required: attr ? attr.required : false,
        default: attr?.default || null,
        size: 4096,
      }),
    });

    const updateData = await putRes.json();
    console.log("Response:", putRes.status, updateData);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
