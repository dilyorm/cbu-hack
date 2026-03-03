package com.bankasset.dto;

import com.bankasset.enums.AuditAction;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class AuditLogResponse {
    private Long id;
    private String entityType;
    private Long entityId;
    private AuditAction action;
    private String performedBy;
    private Map<String, Object> details;
    private String ipAddress;
    private LocalDateTime timestamp;
}
