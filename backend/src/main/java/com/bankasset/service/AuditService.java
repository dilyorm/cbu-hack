package com.bankasset.service;

import com.bankasset.dto.AuditLogResponse;
import com.bankasset.enums.AuditAction;
import com.bankasset.model.AuditLog;
import com.bankasset.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String entityType, Long entityId, AuditAction action,
                    String performedBy, Map<String, Object> details) {
        AuditLog log = AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .performedBy(performedBy)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }

    public Page<AuditLogResponse> getLogsForEntity(String entityType, Long entityId, Pageable pageable) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId, pageable)
                .map(this::toResponse);
    }

    public Page<AuditLogResponse> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable)
                .map(this::toResponse);
    }

    public Page<AuditLogResponse> getFilteredLogs(String action, String entityType, String performedBy,
                                                    LocalDateTime startDate, LocalDateTime endDate,
                                                    Pageable pageable) {
        Specification<AuditLog> spec = Specification.where(null);

        if (action != null && !action.isBlank()) {
            try {
                AuditAction auditAction = AuditAction.valueOf(action.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("action"), auditAction));
            } catch (IllegalArgumentException ignored) { }
        }
        if (entityType != null && !entityType.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(cb.upper(root.get("entityType")), entityType.toUpperCase()));
        }
        if (performedBy != null && !performedBy.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("performedBy")), "%" + performedBy.toLowerCase() + "%"));
        }
        if (startDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("timestamp"), startDate));
        }
        if (endDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("timestamp"), endDate));
        }

        return auditLogRepository.findAll(spec, pageable).map(this::toResponse);
    }

    public List<AuditLogResponse> getLogsBetween(LocalDateTime start, LocalDateTime end) {
        return auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(start, end)
                .stream().map(this::toResponse).toList();
    }

    public Page<AuditLogResponse> getLogsByUser(String performedBy, Pageable pageable) {
        return auditLogRepository.findByPerformedByOrderByTimestampDesc(performedBy, pageable)
                .map(this::toResponse);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .action(log.getAction())
                .performedBy(log.getPerformedBy())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .timestamp(log.getTimestamp())
                .build();
    }
}
