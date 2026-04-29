import React, { forwardRef, useState, useEffect, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

/**
 * PrintLayout - Print-ready wrapper for A4/Legal documents.
 *
 * Props:
 *  - pageSize: "a4" | "legal" (default "a4")
 *  - orientation: "portrait" | "landscape" (default "portrait")
 *  - children: one or more page elements (each should be sized to the page)
 *
 * The ref is passed to the inner wrapper div for useReactToPrint.
 * Each child is expected to be exactly one page in size.
 * In preview mode, pages are shown stacked vertically with a shadow.
 * In print mode, each child page gets a page-break-after.
 */
const PrintLayout = forwardRef(function PrintLayout(
  { children, pageSize = "a4", orientation = "portrait" },
  ref,
) {
  const [scale, setScale] = useState(null);
  const containerRef = useRef(null);

  const dims = {
    a4: {
      portrait: { width: "210mm", height: "297mm", targetWidth: 794 },
      landscape: { width: "297mm", height: "210mm", targetWidth: 1122 },
    },
    legal: {
      portrait: { width: "216mm", height: "356mm", targetWidth: 816 },
      landscape: { width: "356mm", height: "216mm", targetWidth: 1344 },
    },
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const targetWidth = dims[pageSize]?.[orientation]?.targetWidth || 1122;
      // 16px accounts for a small safe margin since container padding is removed
      setScale(Math.min(1, (width - 16) / targetWidth));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [pageSize, orientation]);

  const pageDims = dims[pageSize]?.[orientation] || dims.a4.portrait;

  return (
    <>
      <style>{`
        /* ── Print styles ── */
        @media print {
          @page {
            size: ${pageSize} ${orientation};
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: white;
          }
          body * {
            visibility: hidden;
          }
          .print-root,
          .print-root * {
            visibility: visible;
          }
          .print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            width: ${pageDims.width};
            height: ${pageDims.height};
            overflow: hidden;
            page-break-after: always;
            page-break-inside: avoid;
            box-sizing: border-box;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
          table {
            border-collapse: collapse;
          }
        }

        /* ── Preview styles (screen only) ── */
        @media screen {
          .preview-container {
            background-color: #e5e7eb;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            width: 100%;
            min-height: 200px;
            overflow-x: auto;
            box-sizing: border-box;
          }

          .dark .preview-container {
            background-color: #1f2937;
          }

          .print-page {
            background: white;
            color: black;
            width: ${pageDims.width};
            height: ${pageDims.height};
            box-shadow: 0 4px 24px rgba(0,0,0,0.18);
            flex-shrink: 0;
            overflow: hidden;
            box-sizing: border-box;
            position: relative;
          }

          .print-root {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: fit-content;
            gap: 20px;
            margin: 0 auto;
          }

          .dark .print-page {
            background: white;
            color: black;
          }
        }
      `}</style>

      {/* Preview wrapper (hidden during print via no-print) */}
      <div ref={containerRef} className="preview-container no-print">
        {scale !== null && (
          <TransformWrapper
            initialScale={1}
            minScale={0.1}
            maxScale={4}
            centerOnInit={true}
            centerZoomedOut={true}
            wheel={{ wheelDisabled: true }}
            pinch={{ step: 5 }}
            doubleClick={{ mode: "reset" }}
            panning={{ disabled: false, velocityDisabled: false }}
          >
            <TransformComponent wrapperClass="!w-full">
              {/* Scaling wrapper applied ONLY for preview. zoom natively scales document flow */}
              <div style={{ zoom: scale }}>
                {/* The ref is on the root element that useReactToPrint will capture. Unaffected by outer scaling. */}
                <div ref={ref} className="print-root">
                  {React.Children.map(children, (child, idx) =>
                    child ? (
                      <div key={idx} className="print-page">
                        {child}
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            </TransformComponent>
          </TransformWrapper>
        )}
      </div>
    </>
  );
});

export default PrintLayout;
