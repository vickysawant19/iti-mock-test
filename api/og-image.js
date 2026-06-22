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
            backgroundImage: "linear-gradient(135deg, #0b1528 0%, #1e293b 100%)",
            padding: "48px",
            boxSizing: "border-box",
            position: "relative",
            fontFamily: "system-ui, -apple-system, sans-serif",
          },
          children: [
            // Subtle Decorative Background Rings
            {
              type: "div",
              props: {
                style: {
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
                },
                children: {
                  type: "div",
                  props: {
                    style: {
                      width: "400px",
                      height: "400px",
                      borderRadius: "400px",
                      border: "1px solid rgba(59, 130, 246, 0.03)",
                    }
                  }
                }
              }
            },

            // Top Row: Branding
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                  zIndex: 10,
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: { display: "flex", alignItems: "center" },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              width: "40px",
                              height: "40px",
                              borderRadius: "10px",
                              backgroundColor: "#3b82f6",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: "16px",
                            },
                            children: {
                              type: "span",
                              props: {
                                style: {
                                  color: "white",
                                  fontSize: "22px",
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
                              letterSpacing: "1px",
                            },
                            children: "ITI MITRA"
                          }
                        }
                      ]
                    }
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        border: "1px solid rgba(59, 130, 246, 0.2)",
                        padding: "6px 14px",
                        borderRadius: "20px",
                      },
                      children: {
                        type: "span",
                        props: {
                          style: {
                            color: "#60a5fa",
                            fontSize: "11px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "1.5px",
                          },
                          children: "Online Examination"
                        }
                      }
                    }
                  }
                ]
              }
            },

            // Center Card (Glassmorphism layout)
            {
              type: "div",
              props: {
                style: {
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
                },
                children: [
                  {
                    type: "span",
                    props: {
                      style: {
                        fontSize: "15px",
                        fontWeight: "700",
                        color: "#f59e0b",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "12px",
                      },
                      children: displaySub
                    }
                  },
                  {
                    type: "h1",
                    props: {
                      style: {
                        fontSize: "38px",
                        fontWeight: "800",
                        color: "#ffffff",
                        lineHeight: "1.25",
                        margin: "0 0 28px 0",
                      },
                      children: displayTitle
                    }
                  },
                  {
                    type: "div",
                    props: {
                      style: { display: "flex", gap: "20px", alignItems: "center" },
                      children: [
                        // Duration Badge
                        {
                          type: "div",
                          props: {
                            style: {
                              display: "flex",
                              alignItems: "center",
                              backgroundColor: "rgba(255, 255, 255, 0.03)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              padding: "10px 18px",
                              borderRadius: "14px",
                            },
                            children: [
                              {
                                type: "div",
                                props: {
                                  style: {
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "12px",
                                    border: "2px solid #60a5fa",
                                    marginRight: "10px",
                                  }
                                }
                              },
                              {
                                type: "span",
                                props: {
                                  style: {
                                    color: "#94a3b8",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    marginRight: "6px",
                                  },
                                  children: "Duration:"
                                }
                              },
                              {
                                type: "span",
                                props: {
                                  style: {
                                    color: "#f8fafc",
                                    fontSize: "14px",
                                    fontWeight: "700",
                                  },
                                  children: `${duration} Mins`
                                }
                              }
                            ]
                          }
                        },

                        // Questions Count Badge
                        {
                          type: "div",
                          props: {
                            style: {
                              display: "flex",
                              alignItems: "center",
                              backgroundColor: "rgba(255, 255, 255, 0.03)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              padding: "10px 18px",
                              borderRadius: "14px",
                            },
                            children: [
                              {
                                type: "div",
                                props: {
                                  style: {
                                    width: "10px",
                                    height: "12px",
                                    border: "2px solid #34d399",
                                    borderRadius: "2px",
                                    marginRight: "10px",
                                  }
                                }
                              },
                              {
                                type: "span",
                                props: {
                                  style: {
                                    color: "#94a3b8",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    marginRight: "6px",
                                  },
                                  children: "Questions:"
                                }
                              },
                              {
                                type: "span",
                                props: {
                                  style: {
                                    color: "#f8fafc",
                                    fontSize: "14px",
                                    fontWeight: "700",
                                  },
                                  children: `${questions} Nos.`
                                }
                              }
                            ]
                          }
                        },

                        // Marks Badge
                        {
                          type: "div",
                          props: {
                            style: {
                              display: "flex",
                              alignItems: "center",
                              backgroundColor: "rgba(255, 255, 255, 0.03)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              padding: "10px 18px",
                              borderRadius: "14px",
                            },
                            children: [
                              {
                                type: "div",
                                props: {
                                  style: {
                                    width: "12px",
                                    height: "12px",
                                    backgroundColor: "#a78bfa",
                                    borderRadius: "3px",
                                    transform: "rotate(45deg)",
                                    marginRight: "10px",
                                  }
                                }
                              },
                              {
                                type: "span",
                                props: {
                                  style: {
                                    color: "#94a3b8",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    marginRight: "6px",
                                  },
                                  children: "Marks:"
                                }
                              },
                              {
                                type: "span",
                                props: {
                                  style: {
                                    color: "#f8fafc",
                                    fontSize: "14px",
                                    fontWeight: "700",
                                  },
                                  children: `${questions} Marks`
                                }
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            },

            // Bottom Row: Footer Branding and CTA
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  paddingTop: "24px",
                  zIndex: 10,
                },
                children: [
                  {
                    type: "span",
                    props: {
                      style: {
                        fontSize: "14px",
                        color: "#64748b",
                        fontWeight: "500",
                      },
                      children: "Powered by itimitra.in"
                    }
                  },
                  {
                    type: "div",
                    props: {
                      style: { display: "flex", alignItems: "center" },
                      children: [
                        {
                          type: "span",
                          props: {
                            style: {
                              color: "#3b82f6",
                              fontSize: "15px",
                              fontWeight: "700",
                              marginRight: "8px",
                            },
                            children: "Attempt Test Now"
                          }
                        },
                        {
                          type: "span",
                          props: {
                            style: {
                              color: "#3b82f6",
                              fontSize: "16px",
                              fontWeight: "800",
                            },
                            children: "➔"
                          }
                        }
                      ]
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
      }
    );
  } catch (error) {
    console.error("OG Image generation failed:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
