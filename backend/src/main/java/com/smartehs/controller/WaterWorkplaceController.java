package com.smartehs.controller;

import com.smartehs.dto.request.WaterWorkplaceRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.WaterWorkplaceResponse;
import com.smartehs.service.WaterWorkplaceService;
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
@RequestMapping("/environment/water-workplace")
@RequiredArgsConstructor
@Tag(name = "Water Workplace", description = "수질 사업장 관리 API")
public class WaterWorkplaceController {

    private final WaterWorkplaceService waterWorkplaceService;

    @GetMapping
    @Operation(summary = "사업장 목록 조회")
    public ResponseEntity<ApiResponse<Page<WaterWorkplaceResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(waterWorkplaceService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "사업장 검색")
    public ResponseEntity<ApiResponse<Page<WaterWorkplaceResponse>>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(waterWorkplaceService.search(keyword, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "사업장 상세 조회")
    public ResponseEntity<ApiResponse<WaterWorkplaceResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(waterWorkplaceService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "사업장 등록")
    public ResponseEntity<ApiResponse<WaterWorkplaceResponse>> create(
            @RequestBody WaterWorkplaceRequest request, Authentication authentication) {
        String regUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Created successfully", waterWorkplaceService.create(request, regUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "사업장 수정")
    public ResponseEntity<ApiResponse<WaterWorkplaceResponse>> update(
            @PathVariable Long id, @RequestBody WaterWorkplaceRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", waterWorkplaceService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "사업장 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        waterWorkplaceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
