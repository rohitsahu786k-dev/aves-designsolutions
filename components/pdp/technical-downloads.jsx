import { Box, Download, ExternalLink, FileCode, FileSpreadsheet, FileText, Image as ImageIcon, Sparkles } from "lucide-react";

export function TechnicalDownloads({ acf = {} }) {
  const downloads = [];

  if (acf.technicalDatasheetPdf) {
    downloads.push({
      title: "Technical Datasheet",
      type: "PDF Document",
      desc: "Mechanical properties, torque ratings & tolerances",
      icon: FileText,
      url: acf.technicalDatasheetPdf,
      action: "View PDF",
      isDownload: false,
    });
  }

  if (acf.cadStepFile) {
    downloads.push({
      title: "CAD / 3D STEP Model",
      type: "3D CAD File (.stp/.step)",
      desc: "Parametric 3D solid model for engineering assembly",
      icon: Box,
      url: acf.cadStepFile,
      action: "Download STEP",
      isDownload: true,
    });
  }

  if (acf.certificateDocument) {
    downloads.push({
      title: "Compliance & Test Certificate",
      type: "MTC / CoC PDF",
      desc: "Chemical analysis & mechanical mill test report",
      icon: FileSpreadsheet,
      url: acf.certificateDocument,
      action: "View Certificate",
      isDownload: false,
    });
  }

  if (acf.dimensionDrawing) {
    downloads.push({
      title: "Dimensional Line Drawing",
      type: "Engineering Blueprint",
      desc: "Detailed geometric dimensions & head profiles",
      icon: ImageIcon,
      url: acf.dimensionDrawing,
      action: "View Drawing",
      isDownload: false,
    });
  }

  if (downloads.length === 0) {
    return null;
  }

  return (
    <section className="pdp-section pdp-downloads-section" id="technical-downloads">
      <div className="pdp-section-header">
        <div className="pdp-section-icon downloads">
          <Download size={20} />
        </div>
        <div>
          <h2>Engineering Downloads & CAD Files</h2>
          <p>Technical datasheets, 3D STEP models, line drawings and compliance documents.</p>
        </div>
      </div>

      <div className="technical-downloads-grid">
        {downloads.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div className="download-resource-card" key={idx}>
              <div className="resource-card-icon">
                <Icon size={24} />
              </div>
              <div className="resource-card-body">
                <span className="resource-type-pill">{item.type}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
              <div className="resource-card-action">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  download={item.isDownload ? true : undefined}
                  className="button button-outline resource-download-btn"
                  aria-label={`${item.action} for ${item.title}`}
                >
                  {item.isDownload ? <Download size={15} /> : <ExternalLink size={15} />}
                  <span>{item.action}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
