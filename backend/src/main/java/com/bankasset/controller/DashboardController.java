package com.bankasset.controller;

import com.bankasset.dto.DashboardStats;
import com.bankasset.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final AssetService assetService;

    /**
     * Returns dashboard stats. ADMIN and MANAGER see all assets.
     * USER role sees only stats for their own assigned assets.
     */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats(@AuthenticationPrincipal UserDetails userDetails) {
        boolean isPrivileged = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER"));

        DashboardStats stats = isPrivileged
                ? assetService.getDashboardStats()
                : assetService.getMyDashboardStats(userDetails.getUsername());

        return ResponseEntity.ok(stats);
    }
}
