import { Client, Databases, Query } from "node-appwrite";

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Get paperId and type from query parameters
  const { paperId, type = "attain" } = req.query;

  if (!paperId) {
    return res.status(400).send("Missing paperId parameter");
  }

  let paperData = null;

  const endpoint = process.env.VITE_APPWRITE_ENDPOINT || "https://api.itimitra.in/v1";
  const projectId = process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest";
  const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
  const collectionId = process.env.VITE_QUESTIONPAPER_COLLECTION_ID || "667e8b800015a7ece741";
  const apiKey = process.env.VITE_APPWRITE_API_KEY;

  // Initialize Appwrite Client
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

  if (apiKey) {
    client.setKey(apiKey);
  }

  const databases = new Databases(client);

  // Try to find the mock test paper details
  try {
    // 1. Try to fetch as direct document ID
    try {
      paperData = await databases.getDocument(databaseId, collectionId, paperId);
    } catch (e) {
      // 2. If it fails, try to search by custom paperId field
      const listRes = await databases.listDocuments(databaseId, collectionId, [
        Query.equal("paperId", paperId),
        Query.limit(1)
      ]);
      if (listRes.total > 0) {
        paperData = listRes.documents[0];
      }
    }
  } catch (error) {
    console.error("Error fetching paper details:", error);
  }

  // Determine redirection URL
  let redirectPath = "/";
  if (type === "attain") {
    redirectPath = `/attain-test?paperid=${encodeURIComponent(paperId)}`;
  } else if (type === "start") {
    redirectPath = `/start-mock-test/${encodeURIComponent(paperId)}`;
  } else if (type === "show") {
    redirectPath = `/show-mock-test/${encodeURIComponent(paperId)}`;
  } else if (type === "result") {
    redirectPath = `/mock-test-result/${encodeURIComponent(paperId)}`;
  }

  // Set default fallbacks if paper is not found
  const title = paperData?.title || paperData?.tradeName || "ITI Mitra Mock Test";
  const trade = paperData?.tradeName || "All Trades";
  const year = paperData?.year ? `${paperData.year} Year` : "";
  const duration = paperData?.totalMinutes || "60";
  
  // Handle question count safely
  let questions = "50";
  if (paperData?.quesCount !== undefined && paperData?.quesCount !== null) {
    questions = String(paperData.quesCount);
  } else if (Array.isArray(paperData?.questions)) {
    questions = String(paperData.questions.length);
  }

  const host = req.headers.host || "itimitra.in";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const origin = `${protocol}://${host}`;

  // Construct dynamic OG image URL
  const ogImageUrl = `${origin}/api/og-image?title=${encodeURIComponent(title)}&trade=${encodeURIComponent(trade)}&year=${encodeURIComponent(year)}&duration=${encodeURIComponent(duration)}&questions=${encodeURIComponent(questions)}`;
  const escapedOgImageUrl = ogImageUrl.replace(/&/g, "&amp;");

  // Construct absolute redirect URL
  const redirectToUrl = `${origin}${redirectPath}`;

  // Description
  const description = `Attempt this mock test paper on ITI Mitra. Trade: ${trade}${year ? ` (${year})` : ''}, Duration: ${duration} minutes, Questions: ${questions}. Live exam and immediate result evaluation.`;

  // Render HTML response with OG tags and client-side redirect
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ITI Mitra Mock Test</title>
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${redirectToUrl}" />
  <meta property="og:title" content="${title} - ITI Mitra Mock Test" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${escapedOgImageUrl}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${redirectToUrl}" />
  <meta name="twitter:title" content="${title} - ITI Mitra Mock Test" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${escapedOgImageUrl}" />

  <!-- Pre-render fallback redirect -->
  <script type="text/javascript">
    window.location.href = "${redirectToUrl}";
  </script>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #334155;">
  <div style="text-align: center; padding: 2rem; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
    <h1 style="font-size: 1.5rem; font-weight: 700; color: #1e3a8a; margin-bottom: 0.5rem;">Redirecting to ITI Mitra</h1>
    <p style="margin-bottom: 1.5rem; color: #64748b;">If you are not automatically redirected, please click the button below.</p>
    <a href="${redirectToUrl}" style="display: inline-block; padding: 0.75rem 1.5rem; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 6px -1px rgb(37 99 235 / 0.2);">Go to Test</a>
  </div>
</body>
</html>`);
}
