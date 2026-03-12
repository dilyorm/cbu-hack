package com.bankasset.controller;

import com.bankasset.dto.*;
import com.bankasset.enums.AssetStatus;
import com.bankasset.model.AssetCategory;
import com.bankasset.service.AssetService;
import com.bankasset.service.QrCodeService;
import com.bankasset.service.S3Service;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;
    private final QrCodeService qrCodeService;
    private final S3Service s3Service;

    @Value("${app.asset-images.directory:./asset-images}")
    private String imageDirectory;

    // ===== CRUD =====

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<AssetResponse> create(@Valid @RequestBody AssetCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assetService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(assetService.getById(id));
    }

    @GetMapping("/serial/{serialNumber}")
    public ResponseEntity<AssetResponse> getBySerialNumber(@PathVariable String serialNumber) {
        return ResponseEntity.ok(assetService.getBySerialNumber(serialNumber));
    }

    @GetMapping
    public ResponseEntity<Page<AssetResponse>> getAll(
            @RequestParam(required = false) AssetStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long branchId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(assetService.getFiltered(status, categoryId, type, departmentId, branchId, pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<AssetResponse>> search(
            @RequestParam String query,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(assetService.search(query, pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<AssetResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody AssetUpdateRequest request) {
        return ResponseEntity.ok(assetService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        assetService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ===== FILTERING =====

    @GetMapping("/status/{status}")
    public ResponseEntity<List<AssetResponse>> getByStatus(@PathVariable AssetStatus status) {
        return ResponseEntity.ok(assetService.getByStatus(status));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<AssetResponse>> getByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(assetService.getByCategory(categoryId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<AssetResponse>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(assetService.getByEmployee(employeeId));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<AssetResponse>> getByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(assetService.getByDepartment(departmentId));
    }

    // ===== LIFECYCLE =====

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<AssetResponse> changeStatus(@PathVariable Long id,
                                                       @Valid @RequestBody StatusChangeRequest request) {
        return ResponseEntity.ok(assetService.changeStatus(id, request));
    }

    // ===== ASSIGNMENT =====

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<AssetResponse> assign(@PathVariable Long id,
                                                 @Valid @RequestBody AssignmentRequest request) {
        return ResponseEntity.ok(assetService.assignAsset(id, request));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<AssetResponse> returnAsset(@PathVariable Long id,
                                                      @Valid @RequestBody ReturnRequest request) {
        return ResponseEntity.ok(assetService.returnAsset(id, request));
    }

    // ===== HISTORY =====

    @GetMapping("/{id}/assignments")
    public ResponseEntity<List<AssignmentHistoryResponse>> getAssignmentHistory(@PathVariable Long id) {
        return ResponseEntity.ok(assetService.getAssignmentHistory(id));
    }

    @GetMapping("/{id}/status-history")
    public ResponseEntity<List<StatusHistoryResponse>> getStatusHistory(@PathVariable Long id) {
        return ResponseEntity.ok(assetService.getStatusHistory(id));
    }

    // ===== QR CODE =====

    @GetMapping("/{id}/qr")
    public ResponseEntity<byte[]> generateQrCode(
            @PathVariable Long id,
            @RequestParam(defaultValue = "300") int size) {
        byte[] qrCode = qrCodeService.generateQrCode(id, size, size);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setContentLength(qrCode.length);
        return new ResponseEntity<>(qrCode, headers, HttpStatus.OK);
    }

    // ===== IMAGE UPLOAD =====

    @PostMapping("/{id}/image")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<AssetResponse> uploadImage(@PathVariable Long id,
                                                      @RequestParam("file") MultipartFile file) throws IOException {
        String imagePath;

        if (s3Service.isEnabled()) {
            // Upload to S3
            imagePath = s3Service.uploadFile(file, "assets");
        } else {
            // Fallback to local filesystem
            Path uploadDir = Paths.get(imageDirectory);
            Files.createDirectories(uploadDir);
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = uploadDir.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            imagePath = fileName;
        }

        return ResponseEntity.ok(assetService.updateImagePath(id, imagePath));
    }

    /**
     * Get a presigned URL for an asset image (when using S3).
     */
    @GetMapping("/{id}/image-url")
    public ResponseEntity<String> getImageUrl(@PathVariable Long id) {
        AssetResponse asset = assetService.getById(id);
        if (asset.getImagePath() == null) {
            return ResponseEntity.notFound().build();
        }

        if (s3Service.isEnabled()) {
            String url = s3Service.getPresignedUrl(asset.getImagePath());
            return ResponseEntity.ok(url);
        } else {
            return ResponseEntity.ok("/asset-images/" + asset.getImagePath());
        }
    }

    // ===== CATEGORIES =====

    @GetMapping("/categories")
    public ResponseEntity<List<AssetCategory>> getAllCategories() {
        return ResponseEntity.ok(assetService.getAllCategories());
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<AssetCategory> createCategory(@RequestParam String name,
                                                         @RequestParam(required = false) String description) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assetService.createCategory(name, description));
    }

    // ===== ANALYTICS =====

    @GetMapping("/analytics/expired-warranty")
    public ResponseEntity<List<AssetResponse>> getExpiredWarranty() {
        return ResponseEntity.ok(assetService.getExpiredWarrantyAssets());
    }

    @GetMapping("/analytics/aging")
    public ResponseEntity<List<AssetResponse>> getAgingAssets(
            @RequestParam(defaultValue = "5") int years) {
        return ResponseEntity.ok(assetService.getAgingAssets(years));
    }
}
