import React from "react";
import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Retrieve query parameters
    const title = searchParams.get("title") || "ITI Mitra Mock Test";
    const trade = searchParams.get("trade") || "All Trades";
    const year = searchParams.get("year") || "";
    const duration = searchParams.get("duration") || "60";
    const questions = searchParams.get("questions") || "50";

    // Clean strings for displaying
    const displayTitle = title.length > 60 ? title.substring(0, 57) + "..." : title;
    const displayTrade = trade.length > 40 ? trade.substring(0, 37) + "..." : trade;
    const displaySub = year ? `${displayTrade} • ${year}` : displayTrade;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundImage: "linear-gradient(135deg, #0b1528 0%, #1e293b 100%)",
            padding: "48px",
            boxSizing: "border-box",
            position: "relative",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Subtle Decorative Background Rings */}
          <div
            style={{
              position: "absolute",
              top: "-150px",
              right: "-150px",
              width: "500px",
              height: "500px",
              borderRadius: "500px",
              border: "1px solid rgba(59, 130, 246, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "400px",
                height: "400px",
                borderRadius: "400px",
                border: "1px solid rgba(59, 130, 246, 0.03)",
              }}
            />
          </div>

          {/* Top Row: Branding */}
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {/* Logo Symbol */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
                  marginRight: "16px",
                }}
              >
                <span
                  style={{
                    color: "white",
                    fontSize: "22px",
                    fontWeight: "800",
                    lineHeight: 1,
                  }}
                >
                  IM
                </span>
              </div>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#ffffff",
                  letterSpacing: "1px",
                }}
              >
                ITI MITRA
              </span>
            </div>

            {/* Portal Badge */}
            <div
              style={{
                display: "flex",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                padding: "6px 14px",
                borderRadius: "20px",
              }}
            >
              <span
                style={{
                  color: "#60a5fa",
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                }}
              >
                Online Examination
              </span>
            </div>
          </div>

          {/* Center Card (Glassmorphism layout) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              borderRadius: "24px",
              padding: "36px 40px",
              margin: "32px 0",
              boxSizing: "border-box",
              zIndex: 10,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            {/* Subject / Year Meta */}
            <span
              style={{
                fontSize: "15px",
                fontWeight: "700",
                color: "#f59e0b",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "12px",
              }}
            >
              {displaySub}
            </span>

            {/* Mock Test Title */}
            <h1
              style={{
                fontSize: "38px",
                fontWeight: "800",
                color: "#ffffff",
                lineHeight: "1.25",
                margin: "0 0 28px 0",
              }}
            >
              {displayTitle}
            </h1>

            {/* Details Badges */}
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              {/* Duration Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "10px 18px",
                  borderRadius: "14px",
                }}
              >
                {/* Clock icon placeholder */}
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "12px",
                    border: "2px solid #60a5fa",
                    marginRight: "10px",
                  }}
                />
                <span
                  style={{
                    color: "#94a3b8",
                    fontSize: "14px",
                    fontWeight: "500",
                    marginRight: "6px",
                  }}
                >
                  Duration:
                </span>
                <span
                  style={{
                    color: "#f8fafc",
                    fontSize: "14px",
                    fontWeight: "700",
                  }}
                >
                  {duration} Mins
                </span>
              </div>

              {/* Questions Count Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "10px 18px",
                  borderRadius: "14px",
                }}
              >
                {/* File icon placeholder */}
                <div
                  style={{
                    width: "10px",
                    height: "12px",
                    border: "2px solid #34d399",
                    borderRadius: "2px",
                    marginRight: "10px",
                  }}
                />
                <span
                  style={{
                    color: "#94a3b8",
                    fontSize: "14px",
                    fontWeight: "500",
                    marginRight: "6px",
                  }}
                >
                  Questions:
                </span>
                <span
                  style={{
                    color: "#f8fafc",
                    fontSize: "14px",
                    fontWeight: "700",
                  }}
                >
                  {questions} Nos.
                </span>
              </div>

              {/* Marks Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "10px 18px",
                  borderRadius: "14px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: "#a78bfa",
                    borderRadius: "3px",
                    transform: "rotate(45deg)",
                    marginRight: "10px",
                  }}
                />
                <span
                  style={{
                    color: "#94a3b8",
                    fontSize: "14px",
                    fontWeight: "500",
                    marginRight: "6px",
                  }}
                >
                  Marks:
                </span>
                <span
                  style={{
                    color: "#f8fafc",
                    fontSize: "14px",
                    fontWeight: "700",
                  }}
                >
                  {questions} Marks
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Footer Branding and CTA */}
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              paddingTop: "24px",
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontSize: "14px",
                color: "#64748b",
                fontWeight: "500",
              }}
            >
              Powered by itimitra.in
            </span>

            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  color: "#3b82f6",
                  fontSize: "15px",
                  fontWeight: "700",
                  marginRight: "8px",
                }}
              >
                Attempt Test Now
              </span>
              <span
                style={{
                  color: "#3b82f6",
                  fontSize: "16px",
                  fontWeight: "800",
                }}
              >
                ➔
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG Image generation failed:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
