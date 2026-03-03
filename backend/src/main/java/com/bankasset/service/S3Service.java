package com.bankasset.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;
import java.util.UUID;

@Service
@Slf4j
public class S3Service {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucketName;
    private final boolean enabled;
    private final String endpoint;

    public S3Service(
            @Value("${app.s3.access-key:}") String accessKey,
            @Value("${app.s3.secret-key:}") String secretKey,
            @Value("${app.s3.bucket:}") String bucketName,
            @Value("${app.s3.region:us-east-1}") String region,
            @Value("${app.s3.endpoint:}") String endpoint,
            @Value("${app.s3.enabled:false}") boolean enabled) {

        this.bucketName = bucketName;
        this.endpoint = endpoint;
        this.enabled = enabled && accessKey != null && !accessKey.isBlank()
                && bucketName != null && !bucketName.isBlank();

        if (this.enabled) {
            var credentialsProvider = StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKey, secretKey));

            var s3Builder = S3Client.builder()
                    .credentialsProvider(credentialsProvider)
                    .region(Region.of(region));

            var presignerBuilder = S3Presigner.builder()
                    .credentialsProvider(credentialsProvider)
                    .region(Region.of(region));

            if (endpoint != null && !endpoint.isBlank()) {
                s3Builder.endpointOverride(URI.create(endpoint))
                        .forcePathStyle(true);
                presignerBuilder.endpointOverride(URI.create(endpoint));
            }

            this.s3Client = s3Builder.build();
            this.s3Presigner = presignerBuilder.build();
            log.info("S3 service initialized with bucket: {}", bucketName);
        } else {
            this.s3Client = null;
            this.s3Presigner = null;
            log.info("S3 service is disabled (missing configuration)");
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Uploads a file to S3 and returns the S3 object key.
     */
    public String uploadFile(MultipartFile file, String prefix) throws IOException {
        if (!enabled) {
            throw new IllegalStateException("S3 service is not enabled");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String key = prefix + "/" + UUID.randomUUID() + extension;

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.getContentType())
                .contentLength(file.getSize())
                .build();

        s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        log.info("Uploaded file to S3: {}", key);
        return key;
    }

    /**
     * Generates a presigned URL for reading an S3 object. Valid for 1 hour.
     */
    public String getPresignedUrl(String key) {
        if (!enabled || key == null || key.isBlank()) {
            return null;
        }

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofHours(1))
                .getObjectRequest(b -> b.bucket(bucketName).key(key))
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    /**
     * Deletes a file from S3.
     */
    public void deleteFile(String key) {
        if (!enabled || key == null || key.isBlank()) return;

        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            s3Client.deleteObject(deleteRequest);
            log.info("Deleted file from S3: {}", key);
        } catch (Exception e) {
            log.warn("Failed to delete S3 file {}: {}", key, e.getMessage());
        }
    }
}
