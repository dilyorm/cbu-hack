package com.bankasset.controller;

import com.bankasset.dto.AssetResponse;
import com.bankasset.service.AssetService;
import com.bankasset.service.PdfService;
import com.bankasset.service.QrCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicAssetController {

    private final AssetService assetService;
    private final PdfService pdfService;
    private final QrCodeService qrCodeService;

    /**
     * Public asset summary - accessible without authentication (for QR code scanning).
     */
    @GetMapping("/assets/{id}/summary")
    public ResponseEntity<AssetResponse> getPublicAssetSummary(@PathVariable Long id) {
        return ResponseEntity.ok(assetService.getById(id));
    }

    /**
     * Download asset summary as PDF - no authentication required.
     */
    @GetMapping("/assets/{id}/pdf")
    public ResponseEntity<byte[]> downloadAssetPdf(@PathVariable Long id) {
        byte[] pdfBytes = pdfService.generateAssetSummaryPdf(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "asset-" + id + "-summary.pdf");
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    /**
     * QR code image for an asset - no authentication required.
     */
    @GetMapping("/assets/{id}/qr")
    public ResponseEntity<byte[]> getQrCode(
            @PathVariable Long id,
            @RequestParam(defaultValue = "300") int size) {
        byte[] qrCode = qrCodeService.generateQrCode(id, size, size);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setContentLength(qrCode.length);
        return new ResponseEntity<>(qrCode, headers, HttpStatus.OK);
    }
}
