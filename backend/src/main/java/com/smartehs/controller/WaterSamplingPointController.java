package com.smartehs.controller;

import com.smartehs.dto.request.WaterSamplingPointRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.WaterSamplingPointResponse;
import com.smartehs.service.WaterSamplingPointService;
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

@RestController
@RequestMapping("/environment/water-sampling-point")
@RequiredArgsConstructor
@Tag(name = "Water Sampling Point", description = "수질 측정지점 관리 API")
public class WaterSamplingPointController {

    private final WaterSamplingPointService waterSamplingPointService;

    @GetMapping
    @Operation(summary = "측정지점 목록 조회")
    public ResponseEntity<ApiResponse<Page<WaterSamplingPointResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(waterSamplingPointService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "측정지점 검색")
    public ResponseEntity<ApiResponse<Page<WaterSamplingPointResponse>>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(waterSamplingPointService.search(keyword, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "측정지점 상세 조회")
    public ResponseEntity<ApiResponse<WaterSamplingPointResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(waterSamplingPointService.findById(id)));
    }

    @GetMapping("/by-workplace/{workplaceId}")
    @Operation(summary = "사업장별 측정지점 조회")
    public ResponseEntity<ApiResponse<List<WaterSamplingPointResponse>>> findByWorkplaceId(@PathVariable Long workplaceId) {
        return ResponseEntity.ok(ApiResponse.success(waterSamplingPointService.findByWorkplaceId(workplaceId)));
    }

    @PostMapping
    @Operation(summary = "측정지점 등록")
    public ResponseEntity<ApiResponse<WaterSamplingPointResponse>> create(
            @RequestBody WaterSamplingPointRequest request, Authentication authentication) {
        String regUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Created successfully", waterSamplingPointService.create(request, regUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "측정지점 수정")
    public ResponseEntity<ApiResponse<WaterSamplingPointResponse>> update(
            @PathVariable Long id, @RequestBody WaterSamplingPointRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", waterSamplingPointService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "측정지점 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        waterSamplingPointService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
