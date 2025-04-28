// api/sitemap.xml.js
export default function handler(req, res) {
    res
      .status(200)
      .setHeader("Content-Type", "application/xml")
      .send(`<?xml version="1.0" encoding="UTF-8"?>
  <urlset
        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
   
    <!-- Homepage -->
    <url>
      <loc>https://itimocktest.vercel.app/</loc>
      <lastmod>2025-04-28</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
   
    <!-- Add your other URLs here (replace placeholders) -->
    <!-- ... -->
   
  </urlset>`);
  }
  