import type { Chapter } from "../types/book";
import type { PdfExportOptions } from "../types/export";
import { DEFAULT_PDF_OPTIONS } from "../types/export";

/**
 * Converte tamanho de página amigável para regras de CSS @page
 */
function getPageCssDimensions(pageSize: string, orientation: string): string {
  let sizeVal = "A5";
  if (pageSize === "A4") sizeVal = "A4";
  else if (pageSize === "A5") sizeVal = "A5";
  else if (pageSize === "Letter") sizeVal = "letter";
  else if (pageSize === "Pocket") sizeVal = "125mm 180mm";

  return `${sizeVal} ${orientation}`;
}

/**
 * Exporta um único capítulo em PDF com formatação personalizada e medidas de página ajustáveis
 */
export function exportChapterToPdf(
  title: string,
  contentHtml: string,
  options: PdfExportOptions = DEFAULT_PDF_OPTIONS
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const pageDimensions = getPageCssDimensions(options.pageSize, options.orientation);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page {
          size: ${pageDimensions};
          margin-top: ${options.marginTopMm}mm;
          margin-right: ${options.marginRightMm}mm;
          margin-bottom: ${options.marginBottomMm}mm;
          margin-left: ${options.marginLeftMm}mm;
          @bottom-center {
            content: ${options.showPageNumbers ? "counter(page)" : "''"};
            font-family: sans-serif;
            font-size: 9pt;
            color: #666;
          }
        }

        *, *:before, *:after {
          box-sizing: border-box;
        }

        body {
          font-family: "Figtree", system-ui, -apple-system, sans-serif;
          font-size: ${options.fontSizePt}pt;
          line-height: ${options.lineHeight};
          color: #111;
          margin: 0;
          padding: 0;
          background: #fff;
        }

        /* Preservação completa das formatações do Tiptap */
        .tiptap-export {
          width: 100%;
        }

        .tiptap-export h1 {
          font-size: 2em;
          margin-top: 1.2em;
          margin-bottom: 0.6em;
          font-weight: 700;
          line-height: 1.25;
        }

        .tiptap-export h2 {
          font-size: 1.5em;
          margin-top: 1em;
          margin-bottom: 0.5em;
          font-weight: 600;
          line-height: 1.3;
        }

        .tiptap-export h3 {
          font-size: 1.2em;
          margin-top: 0.8em;
          margin-bottom: 0.4em;
          font-weight: 600;
        }

        .tiptap-export p {
          margin-top: 0;
          margin-bottom: 0.8em;
          text-align: inherit;
        }

        .tiptap-export blockquote {
          border-left: 3px solid #ccc;
          margin-left: 0;
          padding-left: 1rem;
          font-style: italic;
          color: #444;
        }

        .tiptap-export ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.8em;
        }

        .tiptap-export ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.8em;
        }

        .chapter-header {
          text-align: center;
          margin-bottom: 2.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .chapter-header h1 {
          margin: 0;
          font-size: 2.2em;
        }

        @media print {
          body {
            background: none;
          }
          .page-break {
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="chapter-header">
        <h1>${title}</h1>
      </div>

      <div class="tiptap-export">
        ${contentHtml || "<p>Capítulo sem conteúdo.</p>"}
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Exporta um único capítulo em formato DOCX
 */
export function exportChapterToDocx(title: string, contentHtml: string) {
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Georgia', serif; font-size: 12pt; line-height: 1.5; color: #111; }
        h1 { text-align: center; font-size: 20pt; font-family: sans-serif; margin-bottom: 24pt; }
        p { text-indent: 1em; margin-bottom: 6pt; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div>${contentHtml || "<p>Capítulo sem conteúdo.</p>"}</div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + header], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta todo o livro (todos os capítulos) para PDF com medidas personalizadas
 */
export function exportBookToPdf(
  bookTitle: string,
  chapters: Chapter[],
  options: PdfExportOptions = DEFAULT_PDF_OPTIONS
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const pageDimensions = getPageCssDimensions(options.pageSize, options.orientation);

  const chaptersHtml = chapters
    .map(
      (ch, idx) => `
      <section class="chapter-page">
        <div class="chapter-header">
          <h2>Capítulo ${idx + 1}: ${ch.title}</h2>
        </div>
        <div class="tiptap-export">
          ${ch.content || "<p>Sem conteúdo.</p>"}
        </div>
      </section>
    `
    )
    .join("<div class='page-break'></div>");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${bookTitle} - Livro Completo</title>
      <style>
        @page {
          size: ${pageDimensions};
          margin-top: ${options.marginTopMm}mm;
          margin-right: ${options.marginRightMm}mm;
          margin-bottom: ${options.marginBottomMm}mm;
          margin-left: ${options.marginLeftMm}mm;
          @bottom-center {
            content: ${options.showPageNumbers ? "counter(page)" : "''"};
            font-family: sans-serif;
            font-size: 9pt;
            color: #666;
          }
        }

        *, *:before, *:after {
          box-sizing: border-box;
        }

        body {
          font-family: "Figtree", system-ui, -apple-system, sans-serif;
          font-size: ${options.fontSizePt}pt;
          line-height: ${options.lineHeight};
          color: #111;
          margin: 0;
          padding: 0;
          background: #fff;
        }

        .book-cover {
          text-align: center;
          padding-top: 30%;
          padding-bottom: 30%;
          page-break-after: always;
        }

        .book-cover h1 {
          font-size: 2.8em;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .chapter-header {
          margin-top: 1.5rem;
          margin-bottom: 2rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .chapter-header h2 {
          font-size: 1.8em;
          margin: 0;
        }

        /* Preservação completa de formatações do Tiptap */
        .tiptap-export p {
          margin-top: 0;
          margin-bottom: 0.8em;
          text-align: inherit;
        }

        .tiptap-export h1 { font-size: 2em; margin-top: 1em; margin-bottom: 0.5em; }
        .tiptap-export h2 { font-size: 1.5em; margin-top: 0.8em; margin-bottom: 0.4em; }
        .tiptap-export h3 { font-size: 1.2em; margin-top: 0.6em; margin-bottom: 0.3em; }

        .tiptap-export blockquote {
          border-left: 3px solid #ccc;
          margin-left: 0;
          padding-left: 1rem;
          font-style: italic;
        }

        .tiptap-export ul { list-style-type: disc; padding-left: 1.5rem; }
        .tiptap-export ol { list-style-type: decimal; padding-left: 1.5rem; }

        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="book-cover">
        <h1>${bookTitle}</h1>
      </div>

      ${chaptersHtml}

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Exporta todo o livro para DOCX
 */
export function exportBookToDocx(bookTitle: string, chapters: Chapter[]) {
  const chaptersHtml = chapters
    .map(
      (ch, idx) => `
      <h2>Capítulo ${idx + 1}: ${ch.title}</h2>
      <div>${ch.content || "<p>Sem conteúdo.</p>"}</div>
      <br style="page-break-before:always" />
    `
    )
    .join("");

  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${bookTitle}</title>
      <style>
        body { font-family: 'Georgia', serif; font-size: 12pt; line-height: 1.5; color: #111; }
        h1 { text-align: center; font-size: 26pt; font-family: sans-serif; margin-bottom: 40pt; }
        h2 { font-size: 18pt; font-family: sans-serif; margin-top: 24pt; border-bottom: 1px solid #ddd; }
        p { text-indent: 1em; margin-bottom: 6pt; }
      </style>
    </head>
    <body>
      <h1>${bookTitle}</h1>
      ${chaptersHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + header], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${bookTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_completo.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
