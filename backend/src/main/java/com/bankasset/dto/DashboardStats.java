package com.bankasset.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
public class DashboardStats {
    private long totalAssets;
    private long registeredCount;
    private long assignedCount;
    private long inRepairCount;
    private long lostCount;
    private long writtenOffCount;
    private BigDecimal totalAssetValue;
    private Map<String, Long> byCategory;
    private Map<String, Long> byStatus;
    private Map<String, Long> byDepartment;
    private long expiredWarrantyCount;
    private long agingAssetsCount;
}
