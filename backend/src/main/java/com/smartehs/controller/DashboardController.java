package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.DashboardStatisticsResponse;
import com.smartehs.dto.response.EhsAlertResponse;
import com.smartehs.dto.response.EhsPlanResponse;
import com.smartehs.dto.response.EhsMessageResponse;
import com.smartehs.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard API for Home Screen")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/statistics")
    @Operation(summary = "Get activity statistics", description = "Get statistics for safety work, near miss, and risk assessment")
    public ResponseEntity<ApiResponse<DashboardStatisticsResponse>> getStatistics() {
        DashboardStatisticsResponse statistics = dashboardService.getStatistics();
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }

    @GetMapping("/plans/monthly")
    @Operation(summary = "Get monthly plans", description = "Get SHE plans for a specific month")
    public ResponseEntity<ApiResponse<List<EhsPlanResponse>>> getMonthlyPlans(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();
        List<EhsPlanResponse> plans = dashboardService.getMonthlyPlans(targetYear, targetMonth);
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @GetMapping("/alerts/recent")
    @Operation(summary = "Get recent alerts", description = "Get recent SHE alerts for dashboard")
    public ResponseEntity<ApiResponse<List<EhsAlertResponse>>> getRecentAlerts(
            @RequestParam(defaultValue = "5") int limit) {
        List<EhsAlertResponse> alerts = dashboardService.getRecentAlerts(limit);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @GetMapping("/messages/recent")
    @Operation(summary = "Get recent messages", description = "Get recent SHE messages for dashboard")
    public ResponseEntity<ApiResponse<List<EhsMessageResponse>>> getRecentMessages(
            @RequestParam(defaultValue = "5") int limit) {
        List<EhsMessageResponse> messages = dashboardService.getRecentMessages(limit);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }
}
