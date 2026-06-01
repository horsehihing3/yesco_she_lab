package com.smartehs.controller;

import com.smartehs.dto.request.AirEmissionRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.AirEmissionResponse;
import com.smartehs.service.AirEmissionService;
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
@RequestMapping("/environment/air-emission")
@RequiredArgsConstructor
@Tag(name = "Air Emission", description = "대기배출 관리 API")
public class AirEmissionController {

    private final AirEmissionService airEmissionService;

    @GetMapping
    @Operation(summary = "대기배출 목록 조회")
    public ResponseEntity<ApiResponse<Page<AirEmissionResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(airEmissionService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "대기배출 검색")
    public ResponseEntity<ApiResponse<Page<AirEmissionResponse>>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(airEmissionService.search(keyword, pageable)));
    }

    @GetMapping("/all")
    @Operation(summary = "대기배출 전체 목록 조회")
    public ResponseEntity<ApiResponse<List<AirEmissionResponse>>> findAllList() {
        return ResponseEntity.ok(ApiResponse.success(airEmissionService.findAllList()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "대기배출 상세 조회")
    public ResponseEntity<ApiResponse<AirEmissionResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(airEmissionService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "대기배출 등록")
    public ResponseEntity<ApiResponse<AirEmissionResponse>> create(
            @RequestBody AirEmissionRequest request, Authentication authentication) {
        String regUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Created successfully", airEmissionService.create(request, regUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "대기배출 수정")
    public ResponseEntity<ApiResponse<AirEmissionResponse>> update(
            @PathVariable Long id, @RequestBody AirEmissionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", airEmissionService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "대기배출 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        airEmissionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
