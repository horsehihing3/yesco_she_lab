package com.smartehs.controller;

import com.smartehs.dto.request.CarbonEmissionRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.CarbonEmissionResponse;
import com.smartehs.service.CarbonEmissionService;
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
@RequestMapping("/carbon/emission")
@RequiredArgsConstructor
@Tag(name = "Carbon Emission", description = "탄소 배출량 관리 API")
public class CarbonEmissionController {

    private final CarbonEmissionService carbonEmissionService;

    @GetMapping
    @Operation(summary = "탄소 배출량 목록 조회")
    public ResponseEntity<ApiResponse<Page<CarbonEmissionResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(carbonEmissionService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "탄소 배출량 검색")
    public ResponseEntity<ApiResponse<Page<CarbonEmissionResponse>>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(carbonEmissionService.search(keyword, pageable)));
    }

    @GetMapping("/scope/{scope}")
    @Operation(summary = "Scope별 탄소 배출량 조회")
    public ResponseEntity<ApiResponse<Page<CarbonEmissionResponse>>> findByScope(
            @PathVariable int scope,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(carbonEmissionService.findByScope(scope, pageable)));
    }

    @GetMapping("/all")
    @Operation(summary = "탄소 배출량 전체 목록 (페이징 없음)")
    public ResponseEntity<ApiResponse<List<CarbonEmissionResponse>>> findAllList() {
        return ResponseEntity.ok(ApiResponse.success(carbonEmissionService.findAllList()));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "탄소 배출량 대시보드 통계")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        return ResponseEntity.ok(ApiResponse.success(carbonEmissionService.getDashboardStats()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "탄소 배출량 상세 조회")
    public ResponseEntity<ApiResponse<CarbonEmissionResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(carbonEmissionService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "탄소 배출량 등록")
    public ResponseEntity<ApiResponse<CarbonEmissionResponse>> create(
            @RequestBody CarbonEmissionRequest request, Authentication authentication) {
        String regUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Created successfully", carbonEmissionService.create(request, regUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "탄소 배출량 수정")
    public ResponseEntity<ApiResponse<CarbonEmissionResponse>> update(
            @PathVariable Long id, @RequestBody CarbonEmissionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", carbonEmissionService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "탄소 배출량 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        carbonEmissionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
