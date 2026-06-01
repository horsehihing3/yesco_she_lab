package com.smartehs.controller;

import com.smartehs.dto.request.WaterStandardRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.WaterStandardResponse;
import com.smartehs.service.WaterStandardService;
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
@RequestMapping("/environment/water-standard")
@RequiredArgsConstructor
@Tag(name = "Water Standard", description = "수질 배출기준 관리 API")
public class WaterStandardController {

    private final WaterStandardService waterStandardService;

    @GetMapping
    @Operation(summary = "배출기준 목록 조회 (페이징)")
    public ResponseEntity<ApiResponse<Page<WaterStandardResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(waterStandardService.findAll(pageable)));
    }

    @GetMapping("/all")
    @Operation(summary = "배출기준 전체 조회 (페이징 없음)")
    public ResponseEntity<ApiResponse<List<WaterStandardResponse>>> findAllList() {
        return ResponseEntity.ok(ApiResponse.success(waterStandardService.findAllList()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "배출기준 상세 조회")
    public ResponseEntity<ApiResponse<WaterStandardResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(waterStandardService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "배출기준 등록")
    public ResponseEntity<ApiResponse<WaterStandardResponse>> create(
            @RequestBody WaterStandardRequest request, Authentication authentication) {
        String regUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Created successfully", waterStandardService.create(request, regUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "배출기준 수정")
    public ResponseEntity<ApiResponse<WaterStandardResponse>> update(
            @PathVariable Long id, @RequestBody WaterStandardRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", waterStandardService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "배출기준 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        waterStandardService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
