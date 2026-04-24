import React, { forwardRef } from "react";

/**
 * PrintLayout
 * A shared wrapper for all printable documents.
 * Wrap the printable content in this component and pass the ref to useReactToPrint.
 *
 * Props:
 *  - pageSize: "a4" | "legal" (default "a4")
 *  - orientation: "portrait" | "landscape" (default "portrait")
 *  - children: the document content
 */
const PrintLayout = forwardRef(function PrintLayout(
  { children, pageSize = "a4", orientation = "portrait" },
  ref
) {
  // Dimensions for preview and print enforcement
  const dims = {
    a4: {
      portrait: "210mm",
      landscape: "297mm",
    },
    legal: {
      portrait: "216mm",
      landscape: "356mm",
    },
  };

  const pageWidth = dims[pageSize]?.[orientation] || "210mm";

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: ${pageSize} ${orientation};
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0 !important;
            top: 0 !important;
            width: ${pageWidth} !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            break-after: page;
            page-break-after: always;
          }
        }

        /* Preview styles (non-print) */
        .preview-container {
          background-color: #f3f4f6;
          padding: 30px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          min-height: 400px;
          overflow-x: auto;
        }
        
        .print-area-preview {
          background: white;
          width: ${pageWidth};
          min-height: auto;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          margin-bottom: 30px;
          color: black;
          flex-shrink: 0;
        }

        .dark .preview-container {
          background-color: #111827;
        }
      `}</style>
      
      <div className="preview-container no-print">
        <div
          ref={ref}
          className="print-area print-area-preview font-sans"
          style={{ fontFamily: "'Roboto', Arial, sans-serif" }}
        >
          {children}
        </div>
      </div>
    </>
  );
});

export default PrintLayout;
