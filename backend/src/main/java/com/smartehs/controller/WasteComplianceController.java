package com.smartehs.controller;

import com.smartehs.dto.request.WasteComplianceRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.WasteComplianceResponse;
import com.smartehs.service.WasteComplianceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/environment/waste-compliance")
@RequiredArgsConstructor
@Tag(name = "Waste Compliance", description = "법규 준수 관리 API")
public class WasteComplianceController {

    private final WasteComplianceService wasteComplianceService;

    @GetMapping
    @Operation(summary = "법규 준수 목록 조회")
    public ResponseEntity<ApiResponse<Page<WasteComplianceResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(wasteComplianceService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "법규 준수 검색")
    public ResponseEntity<ApiResponse<Page<WasteComplianceResponse>>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(wasteComplianceService.search(keyword, pageable)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 법규 준수 조회")
    public ResponseEntity<ApiResponse<List<WasteComplianceResponse>>> findByStatus(@PathVariable String status) {
        return ResponseEntity.ok(ApiResponse.success(wasteComplianceService.findByStatus(status)));
    }

    @GetMapping("/stats")
    @Operation(summary = "법규 준수 통계")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getComplianceStats() {
        return ResponseEntity.ok(ApiResponse.success(wasteComplianceService.getComplianceStats()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "법규 준수 상세 조회")
    public ResponseEntity<ApiResponse<WasteComplianceResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(wasteComplianceService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "법규 준수 등록")
    public ResponseEntity<ApiResponse<WasteComplianceResponse>> create(
            @RequestBody WasteComplianceRequest request, Authentication authentication) {
        String regUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Created successfully", wasteComplianceService.create(request, regUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "법규 준수 수정")
    public ResponseEntity<ApiResponse<WasteComplianceResponse>> update(
            @PathVariable Long id, @RequestBody WasteComplianceRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", wasteComplianceService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "법규 준수 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        wasteComplianceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
