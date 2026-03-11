package com.bankasset.service;

import com.bankasset.model.Asset;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class PdfService {

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(30, 41, 59));
    private static final Font HEADER_FONT = new Font(Font.HELVETICA, 12, Font.BOLD, new Color(55, 65, 81));
    private static final Font NORMAL_FONT = new Font(Font.HELVETICA, 11, Font.NORMAL, new Color(75, 85, 99));
    private static final Font LABEL_FONT = new Font(Font.HELVETICA, 10, Font.BOLD, new Color(107, 114, 128));
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final AssetService assetService;

    public byte[] generateAssetSummaryPdf(Long assetId) {
        Asset asset = assetService.findById(assetId);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter.getInstance(document, baos);
            document.open();

            // Title
            Paragraph title = new Paragraph("Bank Asset Summary Report", TITLE_FONT);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Divider line
            Paragraph divider = new Paragraph("_______________________________________________________");
            divider.setAlignment(Element.ALIGN_CENTER);
            divider.setSpacingAfter(15);
            document.add(divider);

            // Asset Information Table
            document.add(new Paragraph("Asset Information", HEADER_FONT));
            document.add(Chunk.NEWLINE);

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{35, 65});

            addRow(table, "Asset ID", String.valueOf(asset.getId()));
            addRow(table, "Name", asset.getName());
            addRow(table, "Serial Number", asset.getSerialNumber());
            addRow(table, "Type", asset.getType());
            addRow(table, "Category", asset.getCategory().getName());
            addRow(table, "Status", asset.getStatus().name());

            if (asset.getDescription() != null) {
                addRow(table, "Description", asset.getDescription());
            }

            if (asset.getPurchaseDate() != null) {
                addRow(table, "Purchase Date", asset.getPurchaseDate().format(DATE_FMT));
            }

            if (asset.getPurchaseCost() != null) {
                addRow(table, "Purchase Cost", String.format("$%.2f", asset.getPurchaseCost()));
            }

            if (asset.getWarrantyExpiryDate() != null) {
                String warranty = asset.getWarrantyExpiryDate().format(DATE_FMT);
                if (asset.isWarrantyExpired()) {
                    warranty += " (EXPIRED)";
                }
                addRow(table, "Warranty Expiry", warranty);
            }

            document.add(table);
            document.add(Chunk.NEWLINE);

            // Current Assignment
            if (asset.getCurrentEmployee() != null || asset.getCurrentDepartment() != null) {
                document.add(new Paragraph("Current Assignment", HEADER_FONT));
                document.add(Chunk.NEWLINE);

                PdfPTable assignTable = new PdfPTable(2);
                assignTable.setWidthPercentage(100);
                assignTable.setWidths(new float[]{35, 65});

                if (asset.getCurrentEmployee() != null) {
                    addRow(assignTable, "Assigned To", asset.getCurrentEmployee().getFullName());
                    addRow(assignTable, "Employee Code", asset.getCurrentEmployee().getEmployeeCode());
                }
                if (asset.getCurrentDepartment() != null) {
                    addRow(assignTable, "Department", asset.getCurrentDepartment().getName());
                }
                if (asset.getCurrentBranch() != null) {
                    addRow(assignTable, "Branch", asset.getCurrentBranch().getName());
                }

                document.add(assignTable);
                document.add(Chunk.NEWLINE);
            }

            // Timestamps
            document.add(new Paragraph("Record Information", HEADER_FONT));
            document.add(Chunk.NEWLINE);

            PdfPTable timestampTable = new PdfPTable(2);
            timestampTable.setWidthPercentage(100);
            timestampTable.setWidths(new float[]{35, 65});

            addRow(timestampTable, "Created At", asset.getCreatedAt().format(DATETIME_FMT));
            addRow(timestampTable, "Updated At", asset.getUpdatedAt().format(DATETIME_FMT));

            document.add(timestampTable);

            // Footer
            document.add(Chunk.NEWLINE);
            Paragraph footer = new Paragraph(
                    "This document was automatically generated by Bank Asset Management System.",
                    new Font(Font.HELVETICA, 9, Font.ITALIC, new Color(156, 163, 175)));
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    private void addRow(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, LABEL_FONT));
        labelCell.setBorder(0);
        labelCell.setPadding(6);
        labelCell.setBackgroundColor(new Color(249, 250, 251));

        PdfPCell valueCell = new PdfPCell(new Phrase(value, NORMAL_FONT));
        valueCell.setBorder(0);
        valueCell.setPadding(6);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }
}
