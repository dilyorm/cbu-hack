package com.bankasset.enums;

public enum AssetStatus {
    REGISTERED,
    ASSIGNED,
    IN_REPAIR,
    LOST,
    WRITTEN_OFF;

    // Valid transitions map
    public boolean canTransitionTo(AssetStatus target) {
        return switch (this) {
            case REGISTERED -> target == ASSIGNED || target == IN_REPAIR || target == LOST || target == WRITTEN_OFF;
            case ASSIGNED -> target == REGISTERED || target == IN_REPAIR || target == LOST || target == WRITTEN_OFF;
            case IN_REPAIR -> target == REGISTERED || target == ASSIGNED || target == LOST || target == WRITTEN_OFF;
            case LOST -> target == REGISTERED; // LOST assets can only be recovered (found) back to REGISTERED
            case WRITTEN_OFF -> false; // Terminal state
        };
    }
}
