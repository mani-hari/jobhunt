import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  LevelFormat,
  convertInchesToTwip,
} from "docx";

// ATS formatting rules (§6 of requirements):
// - Calibri 11pt body, 14pt headings
// - Proper Word heading styles
// - No tables, text boxes, graphics
// - No headers/footers
// - Black text only
// - Single column
// - 1 inch margins
// - 1.15 line spacing

const FONT = "Calibri";
const BODY_SIZE = 22;       // half-points (11pt)
const HEADING_SIZE = 28;    // half-points (14pt)
const MARGIN = convertInchesToTwip(1);

type Section = { heading: string; content: string[] };

function parseMarkdown(md: string): { contact: string; sections: Section[] } {
  const lines = md.split("\n").map((l) => l.trim());
  const sections: Section[] = [];
  let contact = "";
  let current: Section | null = null;

  for (const line of lines) {
    if (!line) continue;

    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { heading: line.replace(/^## /, ""), content: [] };
    } else if (line.startsWith("# ")) {
      // Top-level heading = contact/name line — collect subsequent lines until first ##
      contact = line.replace(/^# /, "");
    } else if (current) {
      current.content.push(line);
    } else {
      // Lines before first ## are contact info
      contact += (contact ? "\n" : "") + line;
    }
  }
  if (current) sections.push(current);
  return { contact, sections };
}

function makeNumberingConfig() {
  return {
    config: [
      {
        reference: "bullet-list",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.25) } },
              run: { font: "Symbol" },
            },
          },
        ],
      },
    ],
  };
}

function contactParagraphs(contact: string): Paragraph[] {
  const lines = contact.split("\n").filter(Boolean);
  const paras: Paragraph[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: i === 0 ? 120 : 60 },
        children: [
          new TextRun({
            text: line,
            font: FONT,
            bold: i === 0,
            size: i === 0 ? HEADING_SIZE + 4 : BODY_SIZE,
            color: "000000",
          }),
        ],
      })
    );
  }
  return paras;
}

function contentParagraphs(content: string[]): Paragraph[] {
  const paras: Paragraph[] = [];

  for (const line of content) {
    if (!line.trim()) continue;

    const isBullet = line.startsWith("- ") || line.startsWith("* ");
    const text = isBullet ? line.replace(/^[-*] /, "") : line;
    const isBold = /^\*\*.+\*\*/.test(text);
    const cleanText = text.replace(/\*\*/g, "");

    if (isBullet) {
      paras.push(
        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          spacing: { after: 60, line: 276 },
          children: [
            new TextRun({
              text: cleanText,
              font: FONT,
              size: BODY_SIZE,
              color: "000000",
            }),
          ],
        })
      );
    } else {
      paras.push(
        new Paragraph({
          spacing: { after: 60, line: 276 },
          children: [
            new TextRun({
              text: cleanText,
              font: FONT,
              size: BODY_SIZE,
              bold: isBold,
              color: "000000",
            }),
          ],
        })
      );
    }
  }
  return paras;
}

export async function buildDocx(markdownResume: string, fileName: string): Promise<Buffer> {
  const { contact, sections } = parseMarkdown(markdownResume);

  const children: Paragraph[] = [
    ...contactParagraphs(contact),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
  ];

  for (const section of sections) {
    // Section heading
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: section.heading.toUpperCase(),
            font: FONT,
            bold: true,
            size: HEADING_SIZE,
            color: "000000",
            allCaps: true,
          }),
        ],
      })
    );
    children.push(...contentParagraphs(section.content));
  }

  const doc = new Document({
    numbering: makeNumberingConfig(),
    sections: [
      {
        properties: {
          page: {
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children,
      },
    ],
    styles: {
      default: {
        document: {
          run: { font: FONT, size: BODY_SIZE, color: "000000" },
          paragraph: { spacing: { line: 276 } }, // 1.15 line spacing
        },
      },
    },
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

export function makeDocxFileName(
  firstName: string | null,
  lastName: string | null,
  company: string
): string {
  const first = firstName ?? "Archana";
  const last = lastName ?? "Hariharan";
  const co = company.replace(/[^a-zA-Z0-9]/g, "");
  return `${first}_${last}_Resume_${co}.docx`;
}
