package com.bankasset.service;

import com.bankasset.enums.AuditAction;
import com.bankasset.model.Asset;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QrCodeService {

    private final AssetService assetService;
    private final AuditService auditService;

    @Value("${app.public-url:http://localhost:3000}")
    private String publicUrl;

    public byte[] generateQrCode(Long assetId, int width, int height) {
        Asset asset = assetService.findById(assetId);

        // QR code now contains a URL pointing to the public asset summary page
        String qrContent = publicUrl + "/public/assets/" + assetId;

        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(qrContent, BarcodeFormat.QR_CODE, width, height);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

            auditService.log("ASSET", assetId, AuditAction.QR_GENERATED, "SYSTEM",
                    Map.of("serialNumber", asset.getSerialNumber(), "qrUrl", qrContent));

            return outputStream.toByteArray();
        } catch (WriterException | IOException e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }
}
