package com.smartehs.controller;

import com.smartehs.dto.request.WasteManageRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.WasteManageResponse;
import com.smartehs.service.WasteManageService;
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
@RequestMapping("/environment/waste")
@RequiredArgsConstructor
@Tag(name = "Waste Management", description = "폐기물 관리 API")
public class WasteManageController {

    private final WasteManageService wasteManageService;

    @GetMapping
    @Operation(summary = "폐기물 목록 조회")
    public ResponseEntity<ApiResponse<Page<WasteManageResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(wasteManageService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "폐기물 검색")
    public ResponseEntity<ApiResponse<Page<WasteManageResponse>>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(wasteManageService.search(keyword, pageable)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "폐기물 상태별 조회")
    public ResponseEntity<ApiResponse<Page<WasteManageResponse>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(wasteManageService.findByStatus(status, pageable)));
    }

    @GetMapping("/all")
    @Operation(summary = "폐기물 전체 목록 (페이징 없음)")
    public ResponseEntity<ApiResponse<List<WasteManageResponse>>> findAllList() {
        return ResponseEntity.ok(ApiResponse.success(wasteManageService.findAllList()));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "폐기물 대시보드 통계")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        return ResponseEntity.ok(ApiResponse.success(wasteManageService.getDashboardStats()));
    }

    @GetMapping("/generate-code")
    @Operation(summary = "폐기물 코드 자동 생성")
    public ResponseEntity<ApiResponse<String>> generateWasteCode() {
        return ResponseEntity.ok(ApiResponse.success(wasteManageService.generateWasteCode()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "폐기물 상세 조회")
    public ResponseEntity<ApiResponse<WasteManageResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(wasteManageService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "폐기물 등록")
    public ResponseEntity<ApiResponse<WasteManageResponse>> create(
            @RequestBody WasteManageRequest request, Authentication authentication) {
        String regUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Created successfully", wasteManageService.create(request, regUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "폐기물 수정")
    public ResponseEntity<ApiResponse<WasteManageResponse>> update(
            @PathVariable Long id, @RequestBody WasteManageRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", wasteManageService.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "폐기물 상태 변경")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id, @RequestParam String status) {
        wasteManageService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Status updated", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "폐기물 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        wasteManageService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
