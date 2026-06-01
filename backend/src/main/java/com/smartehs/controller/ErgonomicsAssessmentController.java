package com.smartehs.controller;

import com.smartehs.dto.request.ErgonomicsAssessmentRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.ErgonomicsAssessmentResponse;
import com.smartehs.service.ErgonomicsAssessmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ergonomics")
@RequiredArgsConstructor
@Tag(name = "Ergonomics", description = "근골격계 예방 관리")
public class ErgonomicsAssessmentController {

    private final ErgonomicsAssessmentService service;

    @GetMapping
    @Operation(summary = "근골격계 평가 전체 조회")
    public ResponseEntity<ApiResponse<Page<ErgonomicsAssessmentResponse>>> findAll(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "근골격계 평가 상세")
    public ResponseEntity<ApiResponse<ErgonomicsAssessmentResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/risk/{riskLevel}")
    @Operation(summary = "위험 수준별 조회")
    public ResponseEntity<ApiResponse<Page<ErgonomicsAssessmentResponse>>> findByRisk(
            @PathVariable String riskLevel, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByRiskLevel(riskLevel, pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "근골격계 평가 검색")
    public ResponseEntity<ApiResponse<Page<ErgonomicsAssessmentResponse>>> search(
            @RequestParam String keyword, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.search(keyword, pageable)));
    }

    @PostMapping
    @Operation(summary = "근골격계 평가 등록")
    public ResponseEntity<ApiResponse<ErgonomicsAssessmentResponse>> create(@Valid @RequestBody ErgonomicsAssessmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "근골격계 평가 수정")
    public ResponseEntity<ApiResponse<ErgonomicsAssessmentResponse>> update(@PathVariable Long id, @Valid @RequestBody ErgonomicsAssessmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "근골격계 평가 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id); return ResponseEntity.ok(ApiResponse.success(null));
    }
}
