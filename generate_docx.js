const {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, InternalHyperlink,
  Bookmark, ImageRun, HeadingLevel, PageBreak, AlignmentType, Header, Footer,
  PageNumber, BorderStyle, WidthType, ShadingType, Table, TableRow, TableCell,
  UnderlineType
} = require('docx');
const fs = require('fs');
const path = require('path');

const articlesPath = 'public/data/articles.json';
const imageMapPath = 'image_map.json';

if (!fs.existsSync(articlesPath)) {
  console.error('No articles.json found. Run auto_update.py first.');
  process.exit(1);
}

const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
const imageMapRaw = fs.existsSync(imageMapPath) ? JSON.parse(fs.readFileSync(imageMapPath, 'utf8')) : {};
const imageMap = {};
for (const [url, filePath] of Object.entries(imageMapRaw)) {
  imageMap[url] = path.resolve(filePath);
}

function detectImageType(buffer) {
  if (buffer.length < 4) return 'png';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'jpg';
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'gif';
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) return 'bmp';
  if (buffer.toString('ascii', 0, 4) === '<svg') return 'svg';
  if (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a') return 'gif';
  return 'png';
}

function parseInlineMarkdown(text) {
  const children = [];
  let remaining = text;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)$/);
    if (boldMatch) {
      if (boldMatch[1]) children.push(new TextRun({ text: boldMatch[1] }));
      children.push(new TextRun({ text: boldMatch[2], bold: true }));
      remaining = boldMatch[3];
      continue;
    }
    const italicMatch = remaining.match(/^(.*?)\*(?!\*)((?:[^*]|\*\*)+?)\*(?!\*)(.*)$/);
    if (italicMatch) {
      if (italicMatch[1]) children.push(new TextRun({ text: italicMatch[1] }));
      children.push(new TextRun({ text: italicMatch[2], italics: true }));
      remaining = italicMatch[3];
      continue;
    }
    const linkMatch = remaining.match(/^(.*?)\[(.+?)\]\((.+?)\)(.*)$/);
    if (linkMatch) {
      if (linkMatch[1]) children.push(new TextRun({ text: linkMatch[1] }));
      children.push(new ExternalHyperlink({
        children: [new TextRun({ text: linkMatch[2], style: "Hyperlink" })],
        link: linkMatch[3]
      }));
      remaining = linkMatch[4];
      continue;
    }
    const codeMatch = remaining.match(/^(.*?)`(.+?)`(.*)$/);
    if (codeMatch) {
      if (codeMatch[1]) children.push(new TextRun({ text: codeMatch[1] }));
      children.push(new TextRun({
        text: codeMatch[2],
        font: { name: 'Consolas' },
        size: 20,
        shading: { fill: 'F5F5F5', type: ShadingType.CLEAR }
      }));
      remaining = codeMatch[3];
      continue;
    }
    children.push(new TextRun({ text: remaining }));
    break;
  }
  return children;
}

function getImageDimensions(buffer) {
  try {
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      return { width: 875, height: 500 };
    }
    if (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a') {
      const width = buffer.readUInt16LE(6);
      const height = buffer.readUInt16LE(8);
      return { width, height };
    }
  } catch (e) {}
  return { width: 875, height: 500 };
}

function calculateDisplaySize(origWidth, origHeight, maxWidth = 500, maxHeight = 360) {
  const ratio = Math.min(maxWidth / origWidth, maxHeight / origHeight, 1);
  return {
    width: Math.round(origWidth * ratio),
    height: Math.round(origHeight * ratio)
  };
}

function parseMarkdownToDocx(markdown, imageMap) {
  const lines = markdown.split('\n');
  const elements = [];
  let currentPara = '';
  let inList = false;
  let listItems = [];

  function flushPara() {
    if (currentPara.trim()) {
      elements.push(new Paragraph({
        children: parseInlineMarkdown(currentPara.trim()),
        spacing: { after: 200, line: 360, lineRule: 'auto' },
        indent: { firstLine: 0 }
      }));
      currentPara = '';
    }
  }

  function flushList() {
    if (listItems.length > 0) {
      for (const item of listItems) {
        elements.push(new Paragraph({
          children: [
            new TextRun({ text: '\u2022  ', bold: true, color: '2E75B6' }),
            ...parseInlineMarkdown(item)
          ],
          spacing: { after: 120, line: 320, lineRule: 'auto' },
          indent: { left: 720, hanging: 360 }
        }));
      }
      listItems = [];
      inList = false;
    }
  }

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (inList) {
        flushList();
      } else {
        flushPara();
      }
      continue;
    }
    if (line.includes('min read') && line.includes('day ago')) continue;
    if (line === 'Follow' && line.length < 10) continue;
    if (line.startsWith('Press enter or click to view image')) continue;
    if (line.includes('![') && line.includes('miro.medium.com') && line.includes('resize:fill:40')) continue;

    if (line.match(/^[-=_]{3,}$/)) {
      flushPara();
      flushList();
      elements.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E0E0E0', space: 1 } },
        spacing: { before: 240, after: 240 }
      }));
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushPara();
      flushList();
      const level = headingMatch[1].length;
      let headingLevel;
      let size = 36;
      let spaceBefore = 400;
      let spaceAfter = 240;

      if (level === 1) {
        headingLevel = HeadingLevel.HEADING_1;
        size = 36;
        spaceBefore = 400;
        spaceAfter = 240;
      } else if (level === 2) {
        headingLevel = HeadingLevel.HEADING_2;
        size = 30;
        spaceBefore = 320;
        spaceAfter = 200;
      } else if (level === 3) {
        headingLevel = HeadingLevel.HEADING_3;
        size = 26;
        spaceBefore = 280;
        spaceAfter = 160;
      } else {
        headingLevel = HeadingLevel.HEADING_4;
        size = 24;
        spaceBefore = 240;
        spaceAfter = 120;
      }

      elements.push(new Paragraph({
        heading: headingLevel,
        children: parseInlineMarkdown(headingMatch[2]),
        spacing: { before: spaceBefore, after: spaceAfter, line: 360, lineRule: 'auto' }
      }));
      continue;
    }

    const listItemMatch = line.match(/^-\s+(.+)$/);
    if (listItemMatch) {
      flushPara();
      inList = true;
      listItems.push(listItemMatch[1]);
      continue;
    }

    const imgMatch = line.match(/^!\[(.*?)\]\((.+?)\)$/);
    if (imgMatch) {
      flushPara();
      flushList();
      const imgUrl = imgMatch[2];
      const imgFile = imageMap[imgUrl];
      if (imgFile && fs.existsSync(imgFile)) {
        try {
          const imgBuffer = fs.readFileSync(imgFile);
          const imgType = detectImageType(imgBuffer);
          if (imgBuffer.length > 200) {
            const dims = getImageDimensions(imgBuffer);
            const display = calculateDisplaySize(dims.width, dims.height);
            elements.push(new Paragraph({
              children: [new ImageRun({
                type: imgType,
                data: imgBuffer,
                transformation: display
              })],
              spacing: { before: 240, after: 240 },
              alignment: AlignmentType.CENTER
            }));
          }
        } catch (e) {
          elements.push(new Paragraph({
            children: [new TextRun({ text: `[Image: ${imgMatch[1] || 'Image'}]`, italics: true, color: '999999' })],
            spacing: { before: 160, after: 160 }
          }));
        }
      } else {
        elements.push(new Paragraph({
          children: [
            new TextRun({ text: 'Image: ', italics: true, color: '999999' }),
            new ExternalHyperlink({
              children: [new TextRun({ text: imgMatch[1] || 'View Image', style: 'Hyperlink' })],
              link: imgUrl
            })
          ],
          spacing: { before: 160, after: 160 }
        }));
      }
      continue;
    }

    if (line.includes('![')) {
      flushPara();
      flushList();
      const parts = line.split(/(!\[.*?\]\(.*?\))/g);
      for (const part of parts) {
        const m = part.match(/^!\[(.*?)\]\((.+?)\)$/);
        if (m) {
          const imgUrl = m[2];
          const imgFile = imageMap[imgUrl];
          if (imgFile && fs.existsSync(imgFile)) {
            try {
              const imgBuffer = fs.readFileSync(imgFile);
              const imgType = detectImageType(imgBuffer);
              if (imgBuffer.length > 200) {
                const dims = getImageDimensions(imgBuffer);
                const display = calculateDisplaySize(dims.width, dims.height);
                elements.push(new Paragraph({
                  children: [new ImageRun({
                    type: imgType,
                    data: imgBuffer,
                    transformation: display
                  })],
                  spacing: { before: 240, after: 240 },
                  alignment: AlignmentType.CENTER
                }));
              }
            } catch (e) {
              elements.push(new Paragraph({
                children: [new TextRun({ text: `[Image: ${m[1] || 'Image'}]`, italics: true, color: '999999' })],
                spacing: { before: 160, after: 160 }
              }));
            }
          } else {
            elements.push(new Paragraph({
              children: [
                new TextRun({ text: 'Image: ', italics: true, color: '999999' }),
                new ExternalHyperlink({
                  children: [new TextRun({ text: m[1] || 'View Image', style: 'Hyperlink' })],
                  link: imgUrl
                })
              ],
              spacing: { before: 160, after: 160 }
            }));
          }
        } else if (part.trim()) {
          elements.push(new Paragraph({
            children: parseInlineMarkdown(part.trim()),
            spacing: { after: 200, line: 360, lineRule: 'auto' }
          }));
        }
      }
      continue;
    }

    const linkMatch = line.match(/^\[(.+?)\]\((.+?)\)$/);
    if (linkMatch) {
      flushPara();
      flushList();
      elements.push(new Paragraph({
        children: [
          new ExternalHyperlink({
            children: [new TextRun({ text: linkMatch[1], style: "Hyperlink" })],
            link: linkMatch[2]
          })
        ],
        spacing: { after: 200, line: 360, lineRule: 'auto' }
      }));
      continue;
    }

    if (line.startsWith('> ')) {
      flushPara();
      flushList();
      elements.push(new Paragraph({
        children: [
          new TextRun({ text: '"', italics: true, color: '2E75B6', size: 28 }),
          ...parseInlineMarkdown(line.substring(2)),
          new TextRun({ text: '"', italics: true, color: '2E75B6', size: 28 })
        ],
        spacing: { before: 200, after: 200, line: 360, lineRule: 'auto' },
        indent: { left: 720, right: 720 },
        border: {
          left: { style: BorderStyle.SINGLE, size: 24, color: '2E75B6', space: 12 }
        }
      }));
      continue;
    }

    if (currentPara) currentPara += ' ';
    currentPara += line;
  }

  flushPara();
  flushList();
  return elements;
}

function getTipsNumber(title) {
  const match = title.match(/SFMC Tips #(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function sortByDate(articles) {
  return articles.sort((a, b) => {
    const aDate = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const bDate = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    const aNum = getTipsNumber(a.title || '');
    const bNum = getTipsNumber(b.title || '');
    return (aDate || aNum || 0) - (bDate || bNum || 0);
  });
}

// Sort by publication date (articles with pubDate first, then by tips number for older ones)
const sortedArticles = sortByDate([...articles]);
const allChildren = [];

// ===== COVER PAGE =====
allChildren.push(new Paragraph({
  children: [new TextRun({ text: 'SFMC Tips', bold: true, size: 80, font: 'Arial', color: '000000' })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 2800, after: 160 }
}));
allChildren.push(new Paragraph({
  children: [new TextRun({ text: 'Marketing Cloud Next', bold: true, size: 52, font: 'Arial', color: '2E75B6' })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 600 }
}));
allChildren.push(new Paragraph({
  children: [new TextRun({ text: `Complete Collection of ${sortedArticles.length} Articles`, size: 36, font: 'Arial', color: '666666' })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 320 }
}));
allChildren.push(new Paragraph({
  children: [new TextRun({ text: 'by Nobuyuki Watanabe', size: 32, font: 'Arial', italics: true, color: '666666' })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 160 }
}));
allChildren.push(new Paragraph({
  children: [new TextRun({ text: 'Medium: @marketingcloudtips', size: 26, font: 'Arial', color: '666666' })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 600 }
}));

const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: '2E75B6' };
allChildren.push(new Table({
  width: { size: 6000, type: WidthType.DXA },
  alignment: AlignmentType.CENTER,
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          shading: { fill: '2E75B6', type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 240, right: 240 },
          children: [new Paragraph({
            children: [new TextRun({ text: 'Articles', bold: true, size: 24, color: 'FFFFFF' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 }
          }), new Paragraph({
            children: [new TextRun({ text: String(sortedArticles.length), bold: true, size: 40, color: 'FFFFFF' })],
            alignment: AlignmentType.CENTER
          })]
        }),
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          shading: { fill: '2E75B6', type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 240, right: 240 },
          children: [new Paragraph({
            children: [new TextRun({ text: 'Images', bold: true, size: 24, color: 'FFFFFF' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 }
          }), new Paragraph({
            children: [new TextRun({ text: '2,000+', bold: true, size: 40, color: 'FFFFFF' })],
            alignment: AlignmentType.CENTER
          })]
        })
      ]
    })
  ]
}));

allChildren.push(new Paragraph({
  children: [new TextRun({ text: `Generated: ${new Date().toISOString().split('T')[0]}`, size: 24, font: 'Arial', color: '999999' })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 600, after: 320 }
}));
allChildren.push(new Paragraph({ children: [new PageBreak()] }));

// ===== TABLE OF CONTENTS =====
allChildren.push(new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text: 'Table of Contents' })],
  spacing: { before: 320, after: 600, line: 360, lineRule: 'auto' }
}));

for (let i = 0; i < sortedArticles.length; i++) {
  const a = sortedArticles[i];
  const title = a.title || `Article ${i + 1}`;
  const tipsNum = getTipsNumber(title);
  const displayNum = tipsNum ? `SFMC Tips #${tipsNum}` : title;
  const bookmarkId = `article_${i}`;
  allChildren.push(new Paragraph({
    children: [
      new TextRun({ text: `${i + 1}. ${displayNum}: `, bold: true, size: 24 }),
      new InternalHyperlink({
        children: [new TextRun({ text: title, size: 24 })],
        anchor: bookmarkId
      })
    ],
    spacing: { after: 120, line: 320, lineRule: 'auto' }
  }));
}
allChildren.push(new Paragraph({ children: [new PageBreak()] }));

// ===== ARTICLES =====
for (let i = 0; i < sortedArticles.length; i++) {
  const a = sortedArticles[i];
  const title = a.title || `Article ${i + 1}`;
  const bookmarkId = `article_${i}`;
  console.log(`Processing ${i + 1}/${sortedArticles.length}: ${title}`);

  // Article heading with bookmark (full title)
  allChildren.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [
      new Bookmark({
        id: bookmarkId,
        children: [new TextRun({ text: title, bold: true, size: 40, color: '2E75B6' })]
      })
    ],
    spacing: { before: 600, after: 360, line: 400, lineRule: 'auto' },
    pageBreakBefore: true
  }));

  // Metadata line (author + date)
  const metaParts = [];
  if (a.byline) {
    metaParts.push(new TextRun({ text: `By ${a.byline}`, italics: true, size: 22, color: '666666' }));
  }
  if (a.pubDate) {
    try {
      const d = new Date(a.pubDate);
      const formatted = d.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
      });
      if (metaParts.length > 0) {
        metaParts.push(new TextRun({ text: '  |  ', size: 22, color: '999999' }));
      }
      metaParts.push(new TextRun({
        text: `Published: ${formatted}`,
        italics: true, size: 22, color: '666666'
      }));
    } catch (e) {
      // Skip if date parsing fails
    }
  }
  allChildren.push(new Paragraph({
    children: metaParts.length > 0 ? metaParts : [new TextRun({ text: ' ', size: 22 })],
    spacing: { after: 160 }
  }));

  // External link to original article
  allChildren.push(new Paragraph({
    children: [
      new TextRun({ text: 'Original article: ', size: 22, color: '666666' }),
      new ExternalHyperlink({
        children: [new TextRun({ text: a.url, style: 'Hyperlink', size: 22 })],
        link: a.url
      })
    ],
    spacing: { after: 400 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E0E0E0', space: 12 } }
  }));

  // Content
  const contentElements = parseMarkdownToDocx(a.markdown || '', imageMap);
  allChildren.push(...contentElements);

  // Article separator
  allChildren.push(new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 8, color: '2E75B6', space: 12 } },
    spacing: { before: 600, after: 320 }
  }));
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Arial', size: 24 }
      }
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 40, bold: true, font: 'Arial', color: '2E75B6' },
        paragraph: { spacing: { before: 480, after: 280, line: 400, lineRule: 'auto' }, outlineLevel: 0 }
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: '333333' },
        paragraph: { spacing: { before: 360, after: 240, line: 360, lineRule: 'auto' }, outlineLevel: 1 }
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: '444444' },
        paragraph: { spacing: { before: 320, after: 200, line: 360, lineRule: 'auto' }, outlineLevel: 2 }
      },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: {
          top: 1800,
          right: 1800,
          bottom: 1800,
          left: 1800
        }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [new TextRun({ text: 'SFMC Tips — Marketing Cloud Next', italics: true, size: 20, color: 'AAAAAA' })],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 0 }
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: 'Page ', size: 20, color: 'AAAAAA' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 20, color: 'AAAAAA' })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 }
        })]
      })
    },
    children: allChildren
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('Marketing_Cloud_Next_Public.docx', buffer);
  console.log('DOCX saved: Marketing_Cloud_Next_Public.docx');
  console.log('Size:', (buffer.length / 1024 / 1024).toFixed(2), 'MB');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
