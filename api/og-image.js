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
    const paperId = searchParams.get("paperId") || "";
    const difficulty = searchParams.get("difficulty") || "mixed";

    // Clean strings for displaying
    const displayTitle = title.length > 60 ? title.substring(0, 57) + "..." : title;
    const displayTrade = trade.length > 40 ? trade.substring(0, 37) + "..." : trade;
    const displaySub = year ? `${displayTrade} • ${year}` : displayTrade;
    const displayPaperId = paperId ? (paperId.length > 25 ? paperId.substring(0, 22) + "..." : paperId) : "";
    const displayDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

    // Determine which trade visual illustration to render
    const lowercaseTrade = trade.toLowerCase();
    let visualHero = null;

    if (lowercaseTrade.includes("electronics")) {
      // Electronics illustration (Oscilloscope, MCU board, etc.)
      visualHero = {
        type: "svg",
        props: {
          width: "360",
          height: "320",
          viewBox: "0 0 360 320",
          fill: "none",
          children: [
            // Grid lines for oscilloscope look
            { type: "line", props: { x1: "0", y1: "60", x2: "360", y2: "60", stroke: "rgba(6, 182, 212, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "0", y1: "130", x2: "360", y2: "130", stroke: "rgba(6, 182, 212, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "0", y1: "200", x2: "360", y2: "200", stroke: "rgba(6, 182, 212, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "80", y1: "0", x2: "80", y2: "320", stroke: "rgba(6, 182, 212, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "180", y1: "0", x2: "180", y2: "320", stroke: "rgba(6, 182, 212, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "280", y1: "0", x2: "280", y2: "320", stroke: "rgba(6, 182, 212, 0.04)", strokeWidth: "1" } },

            // Oscilloscope panel
            {
              type: "rect",
              props: {
                x: "10",
                y: "10",
                width: "340",
                height: "120",
                rx: "10",
                fill: "rgba(6, 182, 212, 0.02)",
                stroke: "rgba(6, 182, 212, 0.15)",
                strokeWidth: "1"
              }
            },
            // Waveform path (glowing blue)
            {
              type: "path",
              props: {
                d: "M 20,70 C 60,10 90,130 130,70 C 170,10 200,130 240,70 C 280,10 310,70 340,70",
                stroke: "#22D3EE",
                strokeWidth: "3.5",
                strokeLinecap: "round"
              }
            },

            // Microcontroller chip circuit
            {
              type: "rect",
              props: {
                x: "90",
                y: "165",
                width: "180",
                height: "115",
                rx: "14",
                fill: "rgba(37, 99, 235, 0.04)",
                stroke: "rgba(37, 99, 235, 0.25)",
                strokeWidth: "2"
              }
            },
            // Core CPU chip
            {
              type: "rect",
              props: {
                x: "145",
                y: "197",
                width: "70",
                height: "50",
                rx: "6",
                fill: "#0B1020",
                stroke: "#2563EB",
                strokeWidth: "2"
              }
            },
            // Chip branding text
            {
              type: "text",
              props: {
                x: "155",
                y: "228",
                fill: "#06B6D4",
                fontSize: "12",
                fontWeight: "800",
                style: { fontFamily: "monospace" },
                children: "ITI-MCU"
              }
            },
            // Chip pins
            { type: "line", props: { x1: "135", y1: "207", x2: "145", y2: "207", stroke: "#60A5FA", strokeWidth: "2" } },
            { type: "line", props: { x1: "135", y1: "222", x2: "145", y2: "222", stroke: "#60A5FA", strokeWidth: "2" } },
            { type: "line", props: { x1: "135", y1: "237", x2: "145", y2: "237", stroke: "#60A5FA", strokeWidth: "2" } },
            { type: "line", props: { x1: "215", y1: "207", x2: "225", y2: "207", stroke: "#60A5FA", strokeWidth: "2" } },
            { type: "line", props: { x1: "215", y1: "222", x2: "225", y2: "222", stroke: "#60A5FA", strokeWidth: "2" } },
            { type: "line", props: { x1: "215", y1: "237", x2: "225", y2: "237", stroke: "#60A5FA", strokeWidth: "2" } },

            // Circuit pads and paths
            { type: "circle", props: { cx: "50", cy: "222", r: "5", fill: "#06B6D4" } },
            { type: "path", props: { d: "M 55,222 L 135,222", stroke: "#06B6D4", strokeWidth: "2", strokeDasharray: "4 2" } },
            { type: "circle", props: { cx: "310", cy: "222", r: "5", fill: "#10B981" } },
            { type: "path", props: { d: "M 225,222 L 305,222", stroke: "#10B981", strokeWidth: "2" } }
          ]
        }
      };
    } else if (lowercaseTrade.includes("electrician")) {
      // Electrician illustration (wiring, control panel, electrical symbols)
      visualHero = {
        type: "svg",
        props: {
          width: "360",
          height: "320",
          viewBox: "0 0 360 320",
          fill: "none",
          children: [
            // Grid lines
            { type: "line", props: { x1: "0", y1: "60", x2: "360", y2: "60", stroke: "rgba(251, 191, 36, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "0", y1: "130", x2: "360", y2: "130", stroke: "rgba(251, 191, 36, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "0", y1: "200", x2: "360", y2: "200", stroke: "rgba(251, 191, 36, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "80", y1: "0", x2: "80", y2: "320", stroke: "rgba(251, 191, 36, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "180", y1: "0", x2: "180", y2: "320", stroke: "rgba(251, 191, 36, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "280", y1: "0", x2: "280", y2: "320", stroke: "rgba(251, 191, 36, 0.04)", strokeWidth: "1" } },

            // Control panel border
            {
              type: "rect",
              props: {
                x: "20",
                y: "20",
                width: "320",
                height: "260",
                rx: "16",
                fill: "rgba(251, 191, 36, 0.02)",
                stroke: "rgba(251, 191, 36, 0.2)",
                strokeWidth: "2"
              }
            },

            // Voltmeter dial
            {
              type: "circle",
              props: {
                cx: "90",
                cy: "90",
                r: "45",
                fill: "#0B1020",
                stroke: "#fbbf24",
                strokeWidth: "2"
              }
            },
            { type: "path", props: { d: "M 65,80 A 30,30 0 0,1 115,80", stroke: "#fbbf24", strokeWidth: "1.5", strokeDasharray: "2 2" } },
            { type: "line", props: { x1: "90", y1: "90", x2: "115", y2: "65", stroke: "#ef4444", strokeWidth: "3", strokeLinecap: "round" } },
            {
              type: "text",
              props: {
                x: "85",
                y: "115",
                fill: "rgba(255, 255, 255, 0.4)",
                fontSize: "12",
                fontWeight: "bold",
                children: "V"
              }
            },

            // High Voltage Lightning Bolt
            {
              type: "rect",
              props: {
                x: "190",
                y: "45",
                width: "120",
                height: "90",
                rx: "10",
                fill: "rgba(239, 68, 68, 0.05)",
                stroke: "rgba(239, 68, 68, 0.25)",
                strokeWidth: "1.5"
              }
            },
            {
              type: "path",
              props: {
                d: "M 255,55 L 235,95 L 260,95 L 240,125",
                stroke: "#ef4444",
                strokeWidth: "4",
                strokeLinecap: "round",
                strokeLinejoin: "round"
              }
            },

            // Breaker switch schematic
            {
              type: "rect",
              props: {
                x: "60",
                y: "175",
                width: "240",
                height: "75",
                rx: "12",
                fill: "#0B1020",
                stroke: "rgba(251, 191, 36, 0.15)",
                strokeWidth: "2"
              }
            },
            { type: "circle", props: { cx: "90", cy: "212", r: "6", fill: "#fbbf24" } },
            { type: "circle", props: { cx: "270", cy: "212", r: "6", fill: "#fbbf24" } },
            {
              type: "line",
              props: {
                x1: "90",
                y1: "212",
                x2: "200",
                y2: "190",
                stroke: "#fbbf24",
                strokeWidth: "4",
                strokeLinecap: "round"
              }
            },
            {
              type: "text",
              props: {
                x: "220",
                y: "220",
                fill: "#10B981",
                fontSize: "12",
                fontWeight: "bold",
                children: "CONNECTED"
              }
            }
          ]
        }
      };
    } else if (lowercaseTrade.includes("copa")) {
      // COPA illustration (laptop, code editor, digital dashboard)
      visualHero = {
        type: "svg",
        props: {
          width: "360",
          height: "320",
          viewBox: "0 0 360 320",
          fill: "none",
          children: [
            // Grid lines
            { type: "line", props: { x1: "0", y1: "60", x2: "360", y2: "60", stroke: "rgba(16, 185, 129, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "0", y1: "130", x2: "360", y2: "130", stroke: "rgba(16, 185, 129, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "0", y1: "200", x2: "360", y2: "200", stroke: "rgba(16, 185, 129, 0.04)", strokeWidth: "1" } },

            // Laptop base
            {
              type: "path",
              props: {
                d: "M 20,240 L 340,240 L 320,260 L 40,260 Z",
                fill: "#1E293B",
                stroke: "rgba(16, 185, 129, 0.3)",
                strokeWidth: "2"
              }
            },
            // Touchpad
            {
              type: "rect",
              props: {
                x: "150",
                y: "244",
                width: "60",
                height: "12",
                rx: "2",
                fill: "#0F172A",
                stroke: "rgba(16, 185, 129, 0.15)",
                strokeWidth: "1"
              }
            },
            // Laptop screen bezel
            {
              type: "rect",
              props: {
                x: "40",
                y: "30",
                width: "280",
                height: "200",
                rx: "10",
                fill: "#0B1020",
                stroke: "rgba(16, 185, 129, 0.25)",
                strokeWidth: "2"
              }
            },
            // Screen display area
            {
              type: "rect",
              props: {
                x: "50",
                y: "40",
                width: "260",
                height: "180",
                rx: "6",
                fill: "#020617"
              }
            },

            // IDE lines
            { type: "line", props: { x1: "65", y1: "55", x2: "130", y2: "55", stroke: "#3b82f6", strokeWidth: "4", strokeLinecap: "round" } },
            { type: "line", props: { x1: "65", y1: "70", x2: "160", y2: "70", stroke: "#10b981", strokeWidth: "4", strokeLinecap: "round" } },
            { type: "line", props: { x1: "80", y1: "85", x2: "180", y2: "85", stroke: "#fbbf24", strokeWidth: "4", strokeLinecap: "round" } },
            { type: "line", props: { x1: "80", y1: "100", x2: "140", y2: "100", stroke: "#a78bfa", strokeWidth: "4", strokeLinecap: "round" } },
            { type: "line", props: { x1: "65", y1: "115", x2: "110", y2: "115", stroke: "#ef4444", strokeWidth: "4", strokeLinecap: "round" } },

            // HTML tags text
            {
              type: "text",
              props: {
                x: "65",
                y: "165",
                fill: "rgba(16, 185, 129, 0.4)",
                fontSize: "24",
                fontWeight: "800",
                style: { fontFamily: "monospace" },
                children: "</>"
              }
            },

            // Digital dashboard graphs
            {
              type: "rect",
              props: {
                x: "195",
                y: "55",
                width: "100",
                height: "75",
                rx: "4",
                fill: "rgba(16, 185, 129, 0.02)",
                stroke: "rgba(16, 185, 129, 0.15)",
                strokeWidth: "1"
              }
            },
            {
              type: "polyline",
              props: {
                points: "205,115 220,85 235,95 250,70 265,100 280,65",
                stroke: "#10B981",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round"
              }
            },
            { type: "line", props: { x1: "210", y1: "145", x2: "210", y2: "185", stroke: "#3b82f6", strokeWidth: "6", strokeLinecap: "round" } },
            { type: "line", props: { x1: "225", y1: "155", x2: "225", y2: "185", stroke: "#a78bfa", strokeWidth: "6", strokeLinecap: "round" } },
            { type: "line", props: { x1: "240", y1: "135", x2: "240", y2: "185", stroke: "#fbbf24", strokeWidth: "6", strokeLinecap: "round" } },
            { type: "line", props: { x1: "255", y1: "165", x2: "255", y2: "185", stroke: "#10b981", strokeWidth: "6", strokeLinecap: "round" } }
          ]
        }
      };
    } else {
      // Default general tech layout
      visualHero = {
        type: "svg",
        props: {
          width: "360",
          height: "320",
          viewBox: "0 0 360 320",
          fill: "none",
          children: [
            // Grid lines
            { type: "line", props: { x1: "0", y1: "60", x2: "360", y2: "60", stroke: "rgba(96, 165, 250, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "0", y1: "130", x2: "360", y2: "130", stroke: "rgba(96, 165, 250, 0.04)", strokeWidth: "1" } },
            { type: "line", props: { x1: "0", y1: "200", x2: "360", y2: "200", stroke: "rgba(96, 165, 250, 0.04)", strokeWidth: "1" } },

            // Outer dial
            {
              type: "circle",
              props: {
                cx: "180",
                cy: "150",
                r: "90",
                fill: "rgba(96, 165, 250, 0.01)",
                stroke: "rgba(96, 165, 250, 0.15)",
                strokeWidth: "1.5",
                strokeDasharray: "6 4"
              }
            },
            // Progress arc
            {
              type: "circle",
              props: {
                cx: "180",
                cy: "150",
                r: "75",
                stroke: "#3b82f6",
                strokeWidth: "4.5",
                strokeDasharray: "350 150",
                strokeLinecap: "round"
              }
            },
            // Shield
            {
              type: "path",
              props: {
                d: "M 180,115 L 210,130 L 210,165 C 210,185 180,200 180,200 C 180,200 150,185 150,165 L 150,130 Z",
                fill: "rgba(96, 165, 250, 0.05)",
                stroke: "#60A5FA",
                strokeWidth: "3.5",
                strokeLinejoin: "round"
              }
            },
            // Star
            {
              type: "path",
              props: {
                d: "M 180,135 L 185,147 L 197,147 L 187,155 L 191,167 L 180,159 L 169,167 L 173,155 L 163,147 L 175,147 Z",
                fill: "#fbbf24"
              }
            },
            { type: "circle", props: { cx: "75", cy: "70", r: "3", fill: "#3b82f6" } },
            { type: "line", props: { x1: "75", y1: "70", x2: "120", y2: "70", stroke: "rgba(96, 165, 250, 0.2)", strokeWidth: "1" } },
            { type: "circle", props: { cx: "285", cy: "230", r: "3", fill: "#10b981" } },
            { type: "line", props: { x1: "240", y1: "230", x2: "285", y2: "230", stroke: "rgba(16, 185, 129, 0.2)", strokeWidth: "1" } }
          ]
        }
      };
    }

    return new ImageResponse(
      {
        type: "div",
        props: {
          style: {
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #0B1020 0%, #151B33 100%)",
            backgroundImage: "linear-gradient(135deg, #0B1020 0%, #151B33 100%)",
            padding: "48px 64px",
            boxSizing: "border-box",
            position: "relative",
            fontFamily: "system-ui, -apple-system, sans-serif",
          },
          children: [
            // Soft Background Glowing Particles / Hologram Rings
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  top: "-100px",
                  left: "-100px",
                  width: "400px",
                  height: "400px",
                  borderRadius: "400px",
                  background: "radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(0, 0, 0, 0) 70%)",
                  pointerEvents: "none",
                }
              }
            },
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  bottom: "-100px",
                  right: "-100px",
                  width: "450px",
                  height: "450px",
                  borderRadius: "450px",
                  background: "radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(0, 0, 0, 0) 70%)",
                  pointerEvents: "none",
                }
              }
            },

            // Top Header Row: Logo and Badges
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                  zIndex: 10,
                  marginBottom: "16px",
                },
                children: [
                  // Logo Area
                  {
                    type: "div",
                    props: {
                      style: { display: "flex", alignItems: "center" },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              width: "36px",
                              height: "36px",
                              borderRadius: "8px",
                              backgroundColor: "#06B6D4",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: "12px",
                              boxShadow: "0 0 12px rgba(6, 182, 212, 0.4)",
                            },
                            children: {
                              type: "span",
                              props: {
                                style: {
                                  color: "#0B1020",
                                  fontSize: "18px",
                                  fontWeight: "800",
                                },
                                children: "IM"
                              }
                            }
                          }
                        },
                        {
                          type: "span",
                          props: {
                            style: {
                              fontSize: "20px",
                              fontWeight: "800",
                              color: "#ffffff",
                              letterSpacing: "1.5px",
                              textShadow: "0 0 8px rgba(6, 182, 212, 0.3)",
                            },
                            children: "ITI MITRA"
                          }
                        }
                      ]
                    }
                  },
                  // Action Badges
                  {
                    type: "div",
                    props: {
                      style: { display: "flex", flexDirection: "row", alignItems: "center" },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              backgroundColor: "rgba(16, 185, 129, 0.12)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              color: "#10B981",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "800",
                              letterSpacing: "1.5px",
                              marginRight: "10px",
                              display: "flex",
                              alignItems: "center",
                            },
                            children: [
                              {
                                type: "div",
                                props: {
                                  style: {
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "6px",
                                    backgroundColor: "#10B981",
                                    marginRight: "6px",
                                  }
                                }
                              },
                              "EXAM READY"
                            ]
                          }
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              backgroundColor: "rgba(6, 182, 212, 0.15)",
                              border: "1px solid rgba(6, 182, 212, 0.3)",
                              color: "#22D3EE",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "800",
                              letterSpacing: "1px",
                            },
                            children: `⚡ ${duration} MIN CHALLENGE`
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            },

            // Full-Width Glassmorphic Panel with Large, High-Contrast Typography
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  backgroundColor: "rgba(11, 16, 32, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "24px",
                  padding: "36px 44px",
                  boxSizing: "border-box",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
                  flexGrow: 1,
                  zIndex: 10,
                },
                children: [
                  // Subtitle
                  {
                    type: "span",
                    props: {
                      style: {
                        fontSize: "16px",
                        fontWeight: "800",
                        color: "#22D3EE",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        marginBottom: "10px",
                      },
                      children: "ONLINE MOCK TEST"
                    }
                  },
                  // Headline (Huge Typography for Mobile Readability)
                  {
                    type: "h1",
                    props: {
                      style: {
                        fontSize: "52px",
                        fontWeight: "900",
                        color: "#ffffff",
                        margin: "0 0 24px 0",
                        lineHeight: "1.2",
                        letterSpacing: "-0.5px",
                      },
                      children: displayTitle
                    }
                  },

                  // Trust Factors Checkmarks
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        flexDirection: "row",
                        marginBottom: "28px",
                      },
                      children: [
                        {
                          type: "span",
                          props: {
                            style: { color: "#10B981", fontSize: "14px", marginRight: "24px", fontWeight: "700" },
                            children: "✓ Industry Aligned"
                          }
                        },
                        {
                          type: "span",
                          props: {
                            style: { color: "#10B981", fontSize: "14px", marginRight: "24px", fontWeight: "700" },
                            children: "✓ Instant Results"
                          }
                        },
                        {
                          type: "span",
                          props: {
                            style: { color: "#10B981", fontSize: "14px", fontWeight: "700" },
                            children: "✓ Skill Assessment"
                          }
                        }
                      ]
                    }
                  },

                  // Horizontal Badges Row (Large & Clean)
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: "32px",
                      },
                      children: [
                        // Badge 1: Paper ID
                        {
                          type: "div",
                          props: {
                            style: {
                              display: "flex",
                              alignItems: "center",
                              backgroundColor: "rgba(255, 255, 255, 0.03)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              padding: "12px 20px",
                              borderRadius: "14px",
                              marginRight: "20px",
                            },
                            children: [
                              {
                                type: "span",
                                props: {
                                  style: { color: "rgba(255, 255, 255, 0.4)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginRight: "8px" },
                                  children: "Paper ID"
                                }
                              },
                              {
                                type: "span",
                                props: {
                                  style: { color: "#ffffff", fontSize: "15px", fontWeight: "700", fontFamily: "monospace" },
                                  children: displayPaperId || "N/A"
                                }
                              }
                            ]
                          }
                        },
                        // Badge 2: Questions
                        {
                          type: "div",
                          props: {
                            style: {
                              display: "flex",
                              alignItems: "center",
                              backgroundColor: "rgba(255, 255, 255, 0.03)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              padding: "12px 20px",
                              borderRadius: "14px",
                              marginRight: "20px",
                            },
                            children: [
                              {
                                type: "span",
                                props: {
                                  style: { color: "rgba(255, 255, 255, 0.4)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginRight: "8px" },
                                  children: "Questions"
                                }
                              },
                              {
                                type: "span",
                                props: {
                                  style: { color: "#10B981", fontSize: "15px", fontWeight: "800" },
                                  children: `${questions} MCQs`
                                }
                              }
                            ]
                          }
                        },
                        // Badge 3: Duration
                        {
                          type: "div",
                          props: {
                            style: {
                              display: "flex",
                              alignItems: "center",
                              backgroundColor: "rgba(255, 255, 255, 0.03)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              padding: "12px 20px",
                              borderRadius: "14px",
                              marginRight: "20px",
                            },
                            children: [
                              {
                                type: "span",
                                props: {
                                  style: { color: "rgba(255, 255, 255, 0.4)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginRight: "8px" },
                                  children: "Duration"
                                }
                              },
                              {
                                type: "span",
                                props: {
                                  style: { color: "#22D3EE", fontSize: "15px", fontWeight: "800" },
                                  children: `${duration} Minutes`
                                }
                              }
                            ]
                          }
                        },
                        // Badge 4: Difficulty
                        {
                          type: "div",
                          props: {
                            style: {
                              display: "flex",
                              alignItems: "center",
                              backgroundColor: "rgba(255, 255, 255, 0.03)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              padding: "12px 20px",
                              borderRadius: "14px",
                            },
                            children: [
                              {
                                type: "span",
                                props: {
                                  style: { color: "rgba(255, 255, 255, 0.4)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginRight: "8px" },
                                  children: "Difficulty"
                                }
                              },
                              {
                                type: "span",
                                props: {
                                  style: { color: "#fbbf24", fontSize: "15px", fontWeight: "800" },
                                  children: `${displayDifficulty} Difficulty`
                                }
                              }
                            ]
                          }
                        }
                      ]
                    }
                  },

                  // Large Glowing CTA Button
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)",
                        padding: "16px 32px",
                        borderRadius: "14px",
                        width: "100%",
                        boxShadow: "0 0 24px rgba(34, 211, 238, 0.4)",
                      },
                      children: {
                        type: "span",
                        props: {
                          style: {
                            color: "#0B1020",
                            fontSize: "22px",
                            fontWeight: "900",
                            letterSpacing: "1px",
                          },
                          children: "START EXAM →"
                        }
                      }
                    }
                  }
                ]
              }
            },

            // Bottom Footer Row
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                  paddingTop: "16px",
                  zIndex: 10,
                  marginTop: "16px",
                },
                children: [
                  {
                    type: "span",
                    props: {
                      style: {
                        fontSize: "12px",
                        color: "#22D3EE",
                        fontWeight: "800",
                        letterSpacing: "0.5px",
                      },
                      children: "🚀 Practice • Learn • Succeed"
                    }
                  },
                  {
                    type: "span",
                    props: {
                      style: {
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.35)",
                        fontWeight: "600",
                      },
                      children: "Thousands of ITI Students Practicing Daily"
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=31536000, s-maxage=31536000, no-transform",
        }
      }
    );
  } catch (error) {
    console.error("OG Image generation failed:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
