const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { Order, PrintSettings } = require('../models');
const CompanyService = require('./companyService');

class PDFService {
  
  static async generateOrderPDF(orderId, options = {}) {
    try {
      const order = await Order.findById(orderId)
        .populate('supplier')
        .populate('products.product')
        .populate('createdBy', 'firstName lastName email role')
        .populate('confirmedBy', 'firstName lastName email role');

      if (!order) {
        const error = new Error('Commande non trouvée');
        error.status = 404;
        throw error;
      }

      const settings = await this.getPrintSettings();
      const colors = this.getColors(settings);
      const currency = settings.company?.currency || 'DT';
      const baseFontSize = Math.max(Number(options.fontSize || settings.printOptions?.fontSize || 10), 9);
      const fontStyles = this.getFontStyles(options.fontFamily || settings.printOptions?.fontFamily || 'Helvetica');

      const doc = new PDFDocument({
        size: options.paperSize || settings.printOptions?.paperSize || 'A4',
        layout: options.orientation || settings.printOptions?.orientation || 'portrait',
        margins: { top: 36, bottom: 48, left: 42, right: 42 },
        bufferPages: true,
        info: {
          Title: `Bon de commande ${order.orderNumber}`,
          Author: settings.company?.name || 'Société',
          Subject: 'Bon de commande',
          Creator: settings.company?.name || 'ProdFlow'
        }
      });

      const fileName = `bon-commande-${order.orderNumber}.pdf`;
      const ordersDir = path.join(__dirname, '../uploads/orders');
      if (!fs.existsSync(ordersDir)) {
        fs.mkdirSync(ordersDir, { recursive: true });
      }
      const filePath = path.join(ordersDir, fileName);

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const logoSource = await this.resolveLogo(settings.company?.logo);

      let y = await this.drawHeader(doc, settings, order, logoSource, colors, fontStyles, baseFontSize, currency);
      y = this.drawParties(doc, settings, order, y, colors, fontStyles, baseFontSize);
      y = this.drawOrderMeta(doc, order, y, colors, fontStyles, baseFontSize);
      y = this.drawProductTable(doc, order, y, colors, fontStyles, baseFontSize, currency);
      y = this.drawTotals(doc, order, y, colors, fontStyles, baseFontSize, currency);
      y = this.drawNotesAndTerms(doc, settings, order, y, colors, fontStyles, baseFontSize);

      if (settings.printOptions?.showSignature !== false) {
        this.drawSignatures(doc, settings, order, y + 10, colors, fontStyles, baseFontSize);
      }

      if (settings.printOptions?.showFooter !== false) {
        this.drawFooter(doc, settings, order, colors, fontStyles);
      }

      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          resolve({
            fileName,
            filePath,
            url: `/uploads/orders/${fileName}`
          });
        });
        writeStream.on('error', reject);
      });
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      throw error;
    }
  }

  // ==========================================
  // COULEURS
  // ==========================================
  static getColors(settings) {
    return {
      primary: settings.printOptions?.primaryColor || '#0f172a',
      secondary: settings.printOptions?.secondaryColor || '#1e3a5f',
      accent: settings.printOptions?.accentColor || '#2563eb',
      text: settings.printOptions?.textColor || '#0f172a',
      muted: '#64748b',
      light: '#f1f5f9',
      border: '#e2e8f0',
      white: '#ffffff',
      rowAlt: '#f8fafc',
      soft: '#eff6ff'
    };
  }


  static async resolveLogo(logo) {
    if (!logo || typeof logo !== 'string') return null;

    try {
      // Base64
      if (logo.startsWith('data:image')) {
        const base64Data = logo.replace(/^data:image\/\w+;base64,/, '');
        return Buffer.from(base64Data, 'base64');
      }

      // URL distante
      if (logo.startsWith('http://') || logo.startsWith('https://')) {
        return await this.fetchImageBuffer(logo);
      }

      // Chemins locaux
      const root = path.join(__dirname, '..');
      const normalized = logo.replace(/^\//, '').replace(/\\/g, '/');
      const candidates = [
        logo,
        path.join(root, normalized),
        path.join(root, 'uploads', path.basename(logo)),
        path.join(root, 'uploads', 'logo', path.basename(logo)),
        path.join(root, 'uploads', 'company', path.basename(logo)),
        path.join(root, 'assets', path.basename(logo))
      ];

      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return candidate;
        }
      }
    } catch (error) {
      console.warn('Logo non résolu:', error.message);
    }

    return null;
  }

  static fetchImageBuffer(url) {
    return new Promise((resolve) => {
      const client = url.startsWith('https') ? https : http;
      const request = client.get(url, { timeout: 8000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          this.fetchImageBuffer(res.headers.location).then(resolve).catch(() => resolve(null));
          return;
        }
        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });
      request.on('error', () => resolve(null));
      request.on('timeout', () => {
        request.destroy();
        resolve(null);
      });
    });
  }


  static async drawHeader(doc, settings, order, logoSource, colors, fonts, fontSize, currency) {
    const company = settings.company || {};
    const pageWidth = doc.page.width;
    const left = 42;
    const right = pageWidth - 42;

    // Bande supérieure + accent
    doc.rect(0, 0, pageWidth, 5).fill(colors.primary);
    doc.rect(0, 5, pageWidth, 2).fill(colors.accent);

    let logoDrawn = false;
    const logoW = Math.min(Number(company.logoWidth) || 100, 120);
    const logoH = Math.min(Number(company.logoHeight) || 52, 64);
    let contentTop = 22;

    if (settings.printOptions?.showLogo !== false && logoSource) {
      try {
        doc.image(logoSource, left, contentTop, {
          fit: [logoW, logoH],
          align: 'left',
          valign: 'center'
        });
        logoDrawn = true;
      } catch (error) {
        console.warn('Impossible d\'afficher le logo:', error.message);
      }
    }

    const companyX = logoDrawn ? left + logoW + 14 : left;
    const companyMaxWidth = 230;

    doc.font(fonts.bold)
      .fontSize(Math.max(fontSize + 6, 16))
      .fillColor(colors.primary)
      .text(company.name || 'Société', companyX, contentTop, { width: companyMaxWidth });

    doc.font(fonts.regular)
      .fontSize(fontSize - 1)
      .fillColor(colors.muted);

    let infoY = contentTop + 22;
    const addressLine = [company.address, company.postalCode, company.city]
      .filter(Boolean)
      .join(', ');
    const infoLines = [
      addressLine,
      company.country,
      company.phone ? `Tél. ${company.phone}` : null,
      company.email || null,
      company.taxId ? `Matricule / TVA : ${company.taxId}` : null,
      company.website || null
    ].filter(Boolean);

    infoLines.forEach((line) => {
      doc.text(line, companyX, infoY, { width: companyMaxWidth });
      infoY += 11;
    });

    const titleBoxW = 196;
    const titleBoxH = 86;
    const titleBoxX = right - titleBoxW;
    const titleBoxY = 18;

    doc.roundedRect(titleBoxX, titleBoxY, titleBoxW, titleBoxH, 6)
      .fill(colors.soft);
    doc.roundedRect(titleBoxX, titleBoxY, titleBoxW, titleBoxH, 6)
      .lineWidth(1)
      .strokeColor(colors.border)
      .stroke();
    doc.rect(titleBoxX, titleBoxY, 4, titleBoxH).fill(colors.accent);

    doc.font(fonts.bold)
      .fontSize(Math.max(fontSize + 3, 13))
      .fillColor(colors.primary)
      .text('BON DE COMMANDE', titleBoxX + 12, titleBoxY + 12, {
        width: titleBoxW - 20,
        align: 'left'
      });

    doc.font(fonts.regular)
      .fontSize(fontSize - 1)
      .fillColor(colors.muted)
      .text('Purchase Order', titleBoxX + 12, titleBoxY + 30, {
        width: titleBoxW - 20
      });

    doc.font(fonts.bold)
      .fontSize(fontSize + 1)
      .fillColor(colors.accent)
      .text(order.orderNumber || '—', titleBoxX + 12, titleBoxY + 48, {
        width: titleBoxW - 20
      });

    doc.font(fonts.regular)
      .fontSize(fontSize - 1)
      .fillColor(colors.muted)
      .text(`Date : ${this.formatDate(order.createdAt)}`, titleBoxX + 12, titleBoxY + 66, {
        width: titleBoxW - 20
      });

    const headerBottom = Math.max(infoY, titleBoxY + titleBoxH) + 12;
    doc.moveTo(left, headerBottom)
      .lineTo(right, headerBottom)
      .strokeColor(colors.border)
      .lineWidth(1)
      .stroke();
    doc.moveTo(left, headerBottom)
      .lineTo(left + 64, headerBottom)
      .strokeColor(colors.accent)
      .lineWidth(2.5)
      .stroke();

    return headerBottom + 14;
  }

 
  static drawParties(doc, settings, order, startY, colors, fonts, fontSize) {
    const left = 42;
    const pageInner = doc.page.width - 84;
    const gap = 12;
    const boxWidth = (pageInner - gap) / 2;
    const company = settings.company || {};
    const supplier = order.supplier || {};

    const emitterLines = [
      company.name,
      company.designation && company.designation !== company.name ? company.designation : null,
      [company.address, company.city].filter(Boolean).join(', '),
      company.phone ? `Tél. ${company.phone}` : null,
      company.email || null,
      company.taxId ? `TVA : ${company.taxId}` : null
    ].filter(Boolean);

    const supplierAddress =
      typeof supplier.address === 'string'
        ? supplier.address
        : [supplier.address?.street, supplier.address?.city, supplier.address?.zipCode]
            .filter(Boolean)
            .join(', ');

    const supplierLines = [
      supplier.designation || supplier.name,
      supplier.reference || supplier.code
        ? `Réf. ${supplier.reference || supplier.code}`
        : null,
      supplierAddress,
      supplier.country || null,
      supplier.phone1 || supplier.phone
        ? `Tél. ${supplier.phone1 || supplier.phone}`
        : null,
      supplier.email || null
    ].filter(Boolean);

    const lineH = 12;
    const headerH = 22;
    const pad = 10;
    const boxHeight = Math.max(
      88,
      headerH + pad + Math.max(emitterLines.length, supplierLines.length) * lineH + 8
    );

    this.drawInfoBox(
      doc, left, startY, boxWidth, boxHeight, 'ÉMETTEUR',
      emitterLines, colors, fonts, fontSize, headerH, lineH, pad
    );

    this.drawInfoBox(
      doc, left + boxWidth + gap, startY, boxWidth, boxHeight, 'FOURNISSEUR',
      supplierLines, colors, fonts, fontSize, headerH, lineH, pad
    );

    return startY + boxHeight + 12;
  }

  static drawInfoBox(doc, x, y, w, h, title, lines, colors, fonts, fontSize, headerH = 22, lineH = 12, pad = 10) {
    doc.roundedRect(x, y, w, h, 5)
      .fillAndStroke(colors.white, colors.border);

    doc.roundedRect(x, y, w, headerH, 5).fill(colors.primary);
    doc.rect(x, y + headerH - 5, w, 5).fill(colors.primary);

    doc.font(fonts.bold)
      .fontSize(fontSize - 0.5)
      .fillColor(colors.white)
      .text(title, x + 10, y + 6, { width: w - 20, characterSpacing: 0.6 });

    let lineY = y + headerH + 8;
    lines.forEach((line, index) => {
      if (!line) return;
      doc.font(index === 0 ? fonts.bold : fonts.regular)
        .fontSize(index === 0 ? fontSize : fontSize - 1)
        .fillColor(index === 0 ? colors.text : colors.muted)
        .text(String(line), x + pad, lineY, {
          width: w - pad * 2,
          ellipsis: true,
          lineBreak: false
        });
      lineY += lineH;
    });
  }


  static drawOrderMeta(doc, order, startY, colors, fonts, fontSize) {
    const left = 42;
    const width = doc.page.width - 84;
    const boxH = 42;

    doc.roundedRect(left, startY, width, boxH, 5)
      .fillAndStroke(colors.light, colors.border);

    const createdBy = order.createdBy
      ? `${order.createdBy.firstName || ''} ${order.createdBy.lastName || ''}`.trim()
      : '—';

    const colW = width / 4;
    const cols = [
      { label: 'Statut', value: this.getStatusLabel(order.status) },
      {
        label: 'Livraison prévue',
        value: order.deliveryDate ? this.formatDate(order.deliveryDate) : '—'
      },
      { label: 'Créé par', value: createdBy || '—' },
      {
        label: 'Confirmé le',
        value: order.confirmedAt ? this.formatDate(order.confirmedAt) : '—'
      }
    ];

    cols.forEach((col, i) => {
      const x = left + i * colW + 12;
      if (i > 0) {
        doc.moveTo(left + i * colW, startY + 8)
          .lineTo(left + i * colW, startY + boxH - 8)
          .strokeColor(colors.border)
          .lineWidth(0.7)
          .stroke();
      }
      doc.font(fonts.regular)
        .fontSize(fontSize - 2)
        .fillColor(colors.muted)
        .text(col.label.toUpperCase(), x, startY + 8, { width: colW - 20 });
      doc.font(fonts.bold)
        .fontSize(fontSize - 0.5)
        .fillColor(colors.text)
        .text(col.value, x, startY + 22, { width: colW - 20, ellipsis: true });
    });

    return startY + boxH + 14;
  }

 
  static drawProductTable(doc, order, startY, colors, fonts, fontSize, currency) {
    const left = 42;
    const tableWidth = doc.page.width - 84;
    const rowH = 24;
    const headerH = 26;

    const columns = [
      { key: 'ref', label: 'Réf.', x: left, width: 68 },
      { key: 'name', label: 'Désignation', x: left + 68, width: 190 },
      { key: 'unit', label: 'Unité', x: left + 258, width: 42, align: 'center' },
      { key: 'qty', label: 'Qté', x: left + 300, width: 42, align: 'center' },
      { key: 'price', label: 'P.U. HT', x: left + 342, width: 72, align: 'right' },
      { key: 'total', label: 'Total HT', x: left + 414, width: 76, align: 'right' },
      { key: 'rest', label: 'Rest.', x: left + 490, width: tableWidth - 490, align: 'center' }
    ];

    let y = startY;

    const drawTableHeader = () => {
      doc.roundedRect(left, y, tableWidth, headerH, 4).fill(colors.primary);
      doc.rect(left, y + headerH - 4, tableWidth, 4).fill(colors.primary);
      doc.font(fonts.bold).fontSize(fontSize - 1).fillColor(colors.white);
      columns.forEach((col) => {
        doc.text(col.label, col.x + 5, y + 8, {
          width: col.width - 10,
          align: col.align || 'left'
        });
      });
      y += headerH;
    };

    drawTableHeader();

    const products = order.products || [];
    if (products.length === 0) {
      doc.rect(left, y, tableWidth, rowH).fillAndStroke(colors.rowAlt, colors.border);
      doc.font(fonts.italic || fonts.regular)
        .fontSize(fontSize - 1)
        .fillColor(colors.muted)
        .text('Aucun produit sur cette commande', left + 8, y + 7, { width: tableWidth - 16 });
      y += rowH;
    }

    products.forEach((item, index) => {
      if (y > doc.page.height - 150) {
        doc.addPage();
        y = 42;
        drawTableHeader();
      }

      if (index % 2 === 0) {
        doc.rect(left, y, tableWidth, rowH).fill(colors.rowAlt);
      } else {
        doc.rect(left, y, tableWidth, rowH).fill(colors.white);
      }
      doc.rect(left, y, tableWidth, rowH)
        .lineWidth(0.4)
        .strokeColor(colors.border)
        .stroke();

      const product = item.product || {};
      const lineTotal = item.total != null
        ? Number(item.total)
        : (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

      const values = {
        ref: product.reference || '—',
        name: product.designation || product.name || '—',
        unit: product.unitOfMeasure || 'u',
        qty: String(item.quantity || 0),
        price: this.formatMoney(item.unitPrice || 0, currency),
        total: this.formatMoney(lineTotal, currency),
        rest: String(item.remainingQuantity ?? item.quantity ?? 0)
      };

      columns.forEach((col) => {
        const isEmph = col.key === 'total' || col.key === 'name';
        doc.font(isEmph ? fonts.bold : fonts.regular)
          .fontSize(fontSize - 1)
          .fillColor(colors.text)
          .text(values[col.key], col.x + 5, y + 7, {
            width: col.width - 10,
            align: col.align || 'left',
            ellipsis: true,
            lineBreak: false
          });
      });

      y += rowH;
    });

    doc.moveTo(left, y)
      .lineTo(left + tableWidth, y)
      .strokeColor(colors.primary)
      .lineWidth(1.2)
      .stroke();

    return y + 14;
  }

 
  static drawTotals(doc, order, startY, colors, fonts, fontSize, currency) {
    let y = startY;
    if (y > doc.page.height - 170) {
      doc.addPage();
      y = 42;
    }

    const totalHT = Number(order.totalAmount) || 0;
    let vatRate = 19;
    const products = order.products || [];
    if (products.length > 0) {
      const rates = products
        .map((p) => Number(p.product?.tva ?? p.tva))
        .filter((r) => !Number.isNaN(r) && r != null);
      if (rates.length > 0) {
        vatRate = rates.reduce((a, b) => a + b, 0) / rates.length;
      }
    }
    const vatAmount = totalHT * (vatRate / 100);
    const totalTTC = totalHT + vatAmount;

    const boxW = 240;
    const boxH = 96;
    const boxX = doc.page.width - 42 - boxW;

    doc.roundedRect(boxX, y, boxW, boxH, 6)
      .fillAndStroke(colors.white, colors.border);
    doc.rect(boxX, y, 4, boxH).fill(colors.accent);

    const rows = [
      { label: 'Sous-total HT', value: this.formatMoney(totalHT, currency), bold: false },
      { label: `TVA (${vatRate.toFixed(0)} %)`, value: this.formatMoney(vatAmount, currency), bold: false },
      { label: 'TOTAL TTC', value: this.formatMoney(totalTTC, currency), bold: true }
    ];

    rows.forEach((row, i) => {
      const rowY = y + 12 + i * 26;
      if (row.bold) {
        doc.roundedRect(boxX + 8, rowY - 4, boxW - 16, 22, 4).fill(colors.soft);
      }
      doc.font(row.bold ? fonts.bold : fonts.regular)
        .fontSize(row.bold ? fontSize + 1 : fontSize)
        .fillColor(row.bold ? colors.primary : colors.muted)
        .text(row.label, boxX + 14, rowY, { width: 110 });
      doc.font(row.bold ? fonts.bold : fonts.regular)
        .fillColor(row.bold ? colors.accent : colors.text)
        .text(row.value, boxX + 120, rowY, { width: 106, align: 'right' });
    });

    doc.font(fonts.regular)
      .fontSize(fontSize - 1)
      .fillColor(colors.muted)
      .text('Arrêté le présent bon de commande à la somme de :', 42, y + 6, { width: boxX - 56 });

    doc.font(fonts.bold)
      .fontSize(fontSize)
      .fillColor(colors.primary)
      .text(this.numberToWords(totalTTC, currency), 42, y + 26, { width: boxX - 56 });

    return y + boxH + 16;
  }

 
  static drawNotesAndTerms(doc, settings, order, startY, colors, fonts, fontSize) {
    let y = startY;
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = 42;
    }

    const left = 42;
    const width = doc.page.width - 84;
    const terms = settings.defaultTerms || {};
    const company = settings.company || {};

    const termLines = [
      `Paiement : ${terms.payment || 'Selon accord'}`,
      `Livraison : ${terms.delivery || 'À définir'}`,
      `Garantie : ${terms.warranty || '—'}`,
      company.bankIban ? `IBAN : ${company.bankIban}` : null,
      company.bankName ? `Banque : ${company.bankName}` : null,
      order.notes ? `Notes : ${order.notes}` : (terms.notes ? `Notes : ${terms.notes}` : null)
    ].filter(Boolean);

    const headerH = 22;
    const boxH = Math.max(72, headerH + 12 + termLines.length * 12);

    doc.roundedRect(left, y, width, boxH, 5)
      .fillAndStroke(colors.white, colors.border);
    doc.roundedRect(left, y, width, headerH, 5).fill(colors.secondary);
    doc.rect(left, y + headerH - 4, width, 4).fill(colors.secondary);

    doc.font(fonts.bold)
      .fontSize(fontSize - 0.5)
      .fillColor(colors.white)
      .text('CONDITIONS & NOTES', left + 12, y + 6);

    doc.font(fonts.regular)
      .fontSize(fontSize - 1)
      .fillColor(colors.text);

    let lineY = y + headerH + 10;
    termLines.forEach((line) => {
      doc.text(line, left + 12, lineY, { width: width - 24, ellipsis: true });
      lineY += 12;
    });

    return y + boxH + 14;
  }

  static drawSignatures(doc, settings, order, startY, colors, fonts, fontSize) {
    let y = startY;
    if (y > doc.page.height - 130) {
      doc.addPage();
      y = 42;
    }

    const left = 42;
    const gap = 16;
    const boxW = (doc.page.width - 84 - gap) / 2;
    const boxH = 92;

    const drawSignBox = (x, title, subtitle) => {
      doc.roundedRect(x, y, boxW, boxH, 5)
        .fillAndStroke(colors.white, colors.border);
      doc.font(fonts.bold)
        .fontSize(fontSize)
        .fillColor(colors.primary)
        .text(title, x + 10, y + 10, { width: boxW - 20, align: 'center' });
      doc.font(fonts.regular)
        .fontSize(fontSize - 2)
        .fillColor(colors.muted)
        .text(subtitle, x + 10, y + 26, { width: boxW - 20, align: 'center' });
      doc.moveTo(x + 28, y + boxH - 18)
        .lineTo(x + boxW - 28, y + boxH - 18)
        .strokeColor(colors.border)
        .lineWidth(0.8)
        .stroke();
      doc.font(fonts.regular)
        .fontSize(7)
        .fillColor(colors.muted)
        .text('Signature / Cachet', x + 10, y + boxH - 14, {
          width: boxW - 20,
          align: 'center'
        });
    };

    drawSignBox(left, 'Le Fournisseur', 'Bon pour accord');
    drawSignBox(left + boxW + gap, settings.company?.name || 'La Société', 'Bon pour commande');

    const city = settings.company?.city || '—';
    doc.font(fonts.italic || fonts.regular)
      .fontSize(fontSize - 1)
      .fillColor(colors.muted)
      .text(
        `Fait à ${city}, le ${this.formatDate(new Date())}`,
        left,
        y + boxH + 10,
        { width: doc.page.width - 84, align: 'center' }
      );
  }

 =
  static drawFooter(doc, settings, order, colors, fonts) {
    const range = doc.bufferedPageRange();
    const company = settings.company || {};

    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const pageHeight = doc.page.height;
      const pageWidth = doc.page.width;

      doc.rect(0, pageHeight - 40, pageWidth, 40).fill(colors.light);
      doc.moveTo(42, pageHeight - 40)
        .lineTo(pageWidth - 42, pageHeight - 40)
        .strokeColor(colors.accent)
        .lineWidth(1.5)
        .stroke();

      doc.font(fonts.regular)
        .fontSize(7)
        .fillColor(colors.muted);

      const footerLeft = [
        company.name,
        company.phone,
        company.email
      ].filter(Boolean).join('  ·  ');

      doc.text(footerLeft || '', 42, pageHeight - 28, { width: 250 });
      doc.text(order.orderNumber || '', 0, pageHeight - 28, {
        width: pageWidth,
        align: 'center'
      });
      doc.text(`Page ${i + 1} / ${range.count}`, 0, pageHeight - 28, {
        width: pageWidth - 42,
        align: 'right'
      });

      doc.fontSize(6)
        .fillColor('#94a3b8')
        .text(
          `Document généré le ${this.formatDateTime(new Date())}`,
          42,
          pageHeight - 16,
          { width: pageWidth - 84, align: 'center' }
        );
    }
  }


  static async getPrintSettings() {
    const [{ company: companyInfo, defaultTerms }, printSettings] = await Promise.all([
      CompanyService.getPrintPayload(),
      PrintSettings.findOne()
    ]);

    let settings = printSettings;

    if (!settings) {
      settings = await PrintSettings.create({
        company: companyInfo,
        printOptions: {
          paperSize: 'A4',
          orientation: 'portrait',
          fontFamily: 'Helvetica',
          fontSize: 10,
          primaryColor: '#0f172a',
          secondaryColor: '#1e3a5f',
          accentColor: '#2563eb',
          textColor: '#0f172a',
          showLogo: true,
          showHeader: true,
          showFooter: true,
          showSignature: true,
          language: 'fr'
        },
        defaultTerms
      });
    }

   
    settings.company = {
      ...(settings.company?.toObject?.() || settings.company || {}),
      ...companyInfo
    };

    settings.defaultTerms = {
      ...(settings.defaultTerms?.toObject?.() || settings.defaultTerms || {}),
      ...defaultTerms
    };

    return settings;
  }


  static getFontStyles(fontFamily = 'Helvetica') {
    const normalized = String(fontFamily || 'Helvetica').toLowerCase().trim();
    if (normalized.includes('times') || normalized.includes('georgia')) {
      return {
        regular: 'Times-Roman',
        bold: 'Times-Bold',
        italic: 'Times-Italic'
      };
    }
    if (normalized.includes('courier')) {
      return {
        regular: 'Courier',
        bold: 'Courier-Bold',
        italic: 'Courier-Oblique'
      };
    }
    return {
      regular: 'Helvetica',
      bold: 'Helvetica-Bold',
      italic: 'Helvetica-Oblique'
    };
  }

  static getStatusLabel(status) {
    const labels = {
      en_attente_verification: 'En attente de vérification',
      confirme: 'Confirmé'
    };
    return labels[status] || status || '—';
  }

  static formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  static formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  }

  static formatMoney(amount, currency = 'DT') {
    const value = Number(amount) || 0;
    return `${value.toFixed(3)} ${currency}`;
  }

  static numberToWords(number, currency = 'DT') {
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = [
      'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
      'dix-sept', 'dix-huit', 'dix-neuf'
    ];
    const tens = [
      '', 'dix', 'vingt', 'trente', 'quarante', 'cinquante',
      'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'
    ];

    const convertBelowHundred = (n) => {
      if (n < 10) return units[n];
      if (n < 20) return teens[n - 10];
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      if (ten === 7 || ten === 9) {
        return `${tens[ten]}-${teens[unit]}`.replace(/-$/, '');
      }
      if (unit === 0) return tens[ten] + (ten === 8 ? 's' : '');
      if (unit === 1 && ten !== 8) return `${tens[ten]}-et-un`;
      return `${tens[ten]}-${units[unit]}`;
    };

    const convert = (n) => {
      if (n === 0) return 'zéro';
      if (n < 100) return convertBelowHundred(n);
      if (n < 1000) {
        const hundred = Math.floor(n / 100);
        const rest = n % 100;
        const hundredWord = hundred === 1 ? 'cent' : `${units[hundred]} cent${rest === 0 && hundred > 1 ? 's' : ''}`;
        return rest ? `${hundredWord} ${convertBelowHundred(rest)}` : hundredWord;
      }
      if (n < 1000000) {
        const thousand = Math.floor(n / 1000);
        const rest = n % 1000;
        const thousandWord = thousand === 1 ? 'mille' : `${convert(thousand)} mille`;
        return rest ? `${thousandWord} ${convert(rest)}` : thousandWord;
      }
      return String(n);
    };

    const euro = Math.floor(Math.abs(number));
    const cents = Math.round((Math.abs(number) - euro) * 1000); 
    let words = convert(euro);

    if (cents > 0) {
      words += ` ${currency} et ${cents} millimes`;
    } else {
      words += ` ${currency}`;
    }

    return words.charAt(0).toUpperCase() + words.slice(1);
  }
}

module.exports = PDFService;
