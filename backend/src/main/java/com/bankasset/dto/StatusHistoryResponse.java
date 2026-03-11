package com.bankasset.dto;

import com.bankasset.enums.AssetStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class StatusHistoryResponse {
    private Long id;
    private Long assetId;
    private AssetStatus oldStatus;
    private AssetStatus newStatus;
    private String changedBy;
    private String reason;
    private LocalDateTime changedAt;
}
