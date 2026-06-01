package com.smartehs.controller;

import com.smartehs.dto.request.PrePlacementExamRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PrePlacementExamResponse;
import com.smartehs.service.PrePlacementExamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pre-placement-exam")
@RequiredArgsConstructor
@Tag(name = "Pre-placement Exam", description = "배치전 건강진단 관리 API")
public class PrePlacementExamController {

    private final PrePlacementExamService examService;

    @GetMapping
    @Operation(summary = "배치전 건강진단 목록 조회")
    public ResponseEntity<ApiResponse<Page<PrePlacementExamResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PrePlacementExamResponse> result = examService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "배치전 건강진단 상세 조회")
    public ResponseEntity<ApiResponse<PrePlacementExamResponse>> findById(@PathVariable Long id) {
        PrePlacementExamResponse result = examService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "직원별 배치전 건강진단 조회")
    public ResponseEntity<ApiResponse<Page<PrePlacementExamResponse>>> findByEmployee(
            @PathVariable String employeeId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PrePlacementExamResponse> result = examService.findByEmployee(employeeId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/year/{year}")
    @Operation(summary = "연도별 배치전 건강진단 조회")
    public ResponseEntity<ApiResponse<Page<PrePlacementExamResponse>>> findByYear(
            @PathVariable int year,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PrePlacementExamResponse> result = examService.findByYear(year, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 배치전 건강진단 조회")
    public ResponseEntity<ApiResponse<Page<PrePlacementExamResponse>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PrePlacementExamResponse> result = examService.findByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "배치전 건강진단 검색")
    public ResponseEntity<ApiResponse<Page<PrePlacementExamResponse>>> search(
            @RequestParam String name,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PrePlacementExamResponse> result = examService.searchByName(name, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "배치전 건강진단 등록")
    public ResponseEntity<ApiResponse<PrePlacementExamResponse>> create(
            @Valid @RequestBody PrePlacementExamRequest request) {
        PrePlacementExamResponse result = examService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Pre-placement exam created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "배치전 건강진단 수정")
    public ResponseEntity<ApiResponse<PrePlacementExamResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PrePlacementExamRequest request) {
        PrePlacementExamResponse result = examService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Pre-placement exam updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "배치전 건강진단 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        examService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Pre-placement exam deleted successfully", null));
    }
}
