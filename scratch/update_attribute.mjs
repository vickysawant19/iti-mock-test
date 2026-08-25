const ENDPOINT = "https://api.itimitra.in/v1";
const PROJECT_ID = "itimocktest";
const API_KEY = "standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125";
const DB_ID = "itimocktest";
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
