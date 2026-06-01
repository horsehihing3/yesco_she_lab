package com.smartehs.controller;

import com.smartehs.dto.request.AirEmissionStandardRequest;
import com.smartehs.dto.response.AirEmissionStandardResponse;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.service.AirEmissionStandardService;
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
@RequestMapping("/environment/air-emission-standard")
@RequiredArgsConstructor
@Tag(name = "Air Emission Standard", description = "대기배출 기준치 관리 API")
public class AirEmissionStandardController {

    private final AirEmissionStandardService airEmissionStandardService;

    @GetMapping
    @Operation(summary = "대기배출 기준치 목록 조회")
    public ResponseEntity<ApiResponse<Page<AirEmissionStandardResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(airEmissionStandardService.findAll(pageable)));
    }

    @GetMapping("/all")
    @Operation(summary = "대기배출 기준치 전체 목록 조회")
    public ResponseEntity<ApiResponse<List<AirEmissionStandardResponse>>> findAllList() {
        return ResponseEntity.ok(ApiResponse.success(airEmissionStandardService.findAllList()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "대기배출 기준치 상세 조회")
    public ResponseEntity<ApiResponse<AirEmissionStandardResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(airEmissionStandardService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "대기배출 기준치 등록")
    public ResponseEntity<ApiResponse<AirEmissionStandardResponse>> create(
            @RequestBody AirEmissionStandardRequest request, Authentication authentication) {
        String regUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Created successfully", airEmissionStandardService.create(request, regUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "대기배출 기준치 수정")
    public ResponseEntity<ApiResponse<AirEmissionStandardResponse>> update(
            @PathVariable Long id, @RequestBody AirEmissionStandardRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", airEmissionStandardService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "대기배출 기준치 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        airEmissionStandardService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
