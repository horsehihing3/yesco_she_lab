package com.smartehs.controller;

import com.smartehs.dto.request.WaterQualityRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.WaterQualityResponse;
import com.smartehs.service.WaterQualityService;
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

@RestController
@RequestMapping("/environment/water-quality")
@RequiredArgsConstructor
@Tag(name = "Water Quality", description = "수질 관리 API")
public class WaterQualityController {

    private final WaterQualityService waterQualityService;

    @GetMapping
    @Operation(summary = "수질 목록 조회")
    public ResponseEntity<ApiResponse<Page<WaterQualityResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(waterQualityService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "수질 검색")
    public ResponseEntity<ApiResponse<Page<WaterQualityResponse>>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(waterQualityService.search(keyword, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "수질 상세 조회")
    public ResponseEntity<ApiResponse<WaterQualityResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(waterQualityService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "수질 등록")
    public ResponseEntity<ApiResponse<WaterQualityResponse>> create(
            @RequestBody WaterQualityRequest request, Authentication authentication) {
        String regUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Created successfully", waterQualityService.create(request, regUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "수질 수정")
    public ResponseEntity<ApiResponse<WaterQualityResponse>> update(
            @PathVariable Long id, @RequestBody WaterQualityRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", waterQualityService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "수질 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        waterQualityService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
