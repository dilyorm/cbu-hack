package com.bankasset.controller;

import com.bankasset.dto.AuditLogResponse;
import com.bankasset.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<Page<AuditLogResponse>> getAllLogs(
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditService.getAllLogs(pageable));
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<Page<AuditLogResponse>> getEntityLogs(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(auditService.getLogsForEntity(entityType, entityId, pageable));
    }

    @GetMapping("/user/{performedBy}")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByUser(
            @PathVariable String performedBy,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(auditService.getLogsByUser(performedBy, pageable));
    }

    @GetMapping("/between")
    public ResponseEntity<List<AuditLogResponse>> getLogsBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(auditService.getLogsBetween(start, end));
    }
}
