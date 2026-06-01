package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.EmergencyDrill;
import com.smartehs.model.DrillLog;
import com.smartehs.model.DrillLogItem;
import com.smartehs.mapper.DrillLogMapper;
import com.smartehs.service.EmergencyDrillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/emergency-drill")
@RequiredArgsConstructor
@Tag(name = "Emergency Drill", description = "비상 훈련 관리")
public class EmergencyDrillController {

    private final EmergencyDrillService emergencyDrillService;
    private final DrillLogMapper drillLogMapper;

    @GetMapping
    @Operation(summary = "비상 훈련 전체 목록 조회")
    public ResponseEntity<ApiResponse<Page<EmergencyDrill>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emergencyDrillService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "비상 훈련 상세 조회")
    public ResponseEntity<ApiResponse<EmergencyDrill>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(emergencyDrillService.findById(id)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 비상 훈련 조회")
    public ResponseEntity<ApiResponse<Page<EmergencyDrill>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emergencyDrillService.findByStatus(status, pageable)));
    }

    @GetMapping("/type/{drillType}")
    @Operation(summary = "유형별 비상 훈련 조회")
    public ResponseEntity<ApiResponse<Page<EmergencyDrill>>> findByDrillType(
            @PathVariable String drillType,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emergencyDrillService.findByDrillType(drillType, pageable)));
    }

    @PostMapping
    @Operation(summary = "비상 훈련 등록")
    public ResponseEntity<ApiResponse<EmergencyDrill>> create(@RequestBody EmergencyDrill emergencyDrill) {
        return ResponseEntity.ok(ApiResponse.success(emergencyDrillService.create(emergencyDrill)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "비상 훈련 수정")
    public ResponseEntity<ApiResponse<EmergencyDrill>> update(@PathVariable Long id, @RequestBody EmergencyDrill emergencyDrill, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        emergencyDrill.setModifiedBy(username);
        return ResponseEntity.ok(ApiResponse.success(emergencyDrillService.update(id, emergencyDrill)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "비상 훈련 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        emergencyDrillService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{id}/logs")
    @Operation(summary = "비상 훈련 변경 이력 조회")
    public ResponseEntity<ApiResponse<java.util.List<DrillLog>>> getLogs(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(drillLogMapper.findByDrillId(id)));
    }

    @GetMapping("/logs/{logId}/items")
    @Operation(summary = "비상 훈련 변경 이력 항목 상세 조회")
    public ResponseEntity<ApiResponse<java.util.List<DrillLogItem>>> getLogItems(@PathVariable Long logId) {
        return ResponseEntity.ok(ApiResponse.success(drillLogMapper.findItemsByLogId(logId)));
    }
}
