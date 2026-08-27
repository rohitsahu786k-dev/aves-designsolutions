import { AlertCircle, Box, CheckSquare, Hammer, HardHat, HeartHandshake, HelpCircle, Shield, Wrench } from "lucide-react";

export function ApplicationsSection({ acf = {} }) {
  const blocks = [];

  if (acf.applicationsContent) {
    blocks.push({
      id: "applications",
      title: "Applications & Recommended Uses",
      icon: HardHat,
      html: acf.applicationsContent,
    });
  }

  if (acf.installationToolNotes) {
    blocks.push({
      id: "installation",
      title: "Installation & Tooling Guidance",
      icon: Wrench,
      html: acf.installationToolNotes,
    });
  }

  if (acf.compatibilityContent) {
    blocks.push({
      id: "compatibility",
      title: "Compatibility & Mating Hardware",
      icon: CheckSquare,
      html: acf.compatibilityContent,
    });
  }

  if (acf.whatsInThePack) {
    blocks.push({
      id: "pack",
      title: "What's in the Pack",
      icon: Box,
      text: acf.whatsInThePack,
    });
  }

  if (acf.storageCareNotes) {
    blocks.push({
      id: "storage",
      title: "Storage & Corrosion Protection",
      icon: Shield,
      text: acf.storageCareNotes,
    });
  }

  if (acf.warrantyText) {
    blocks.push({
      id: "warranty",
      title: "Quality Assurance & Defect Guarantee",
      icon: HeartHandshake,
      text: acf.warrantyText,
    });
  }

  if (blocks.length === 0) {
    return null;
  }

  return (
    <section className="pdp-section pdp-applications-section" id="applications-guide">
      <div className="pdp-section-header">
        <div className="pdp-section-icon applications">
          <HardHat size={20} />
        </div>
        <div>
          <h2>Applications, Installation & Handling</h2>
          <p>Practical engineering instructions, driver tooling advice, and care recommendations.</p>
        </div>
      </div>

      <div className="applications-card-grid">
        {blocks.map((block) => {
          const Icon = block.icon;
          return (
            <div className="application-info-card" key={block.id}>
              <div className="card-header-bar">
                <Icon size={18} className="text-black" />
                <h3>{block.title}</h3>
              </div>
              <div className="card-content-body">
                {block.html ? (
                  <div className="wysiwyg-prose" dangerouslySetInnerHTML={{ __html: block.html }} />
                ) : (
                  <p>{block.text}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
