package com.smartehs.controller;

import com.smartehs.dto.request.EmergencyResponseRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.EmergencyResponseResponse;
import com.smartehs.service.EmergencyResponseService;
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
@RequestMapping("/emergency-response")
@RequiredArgsConstructor
@Tag(name = "Emergency Response", description = "비상대응 관리")
public class EmergencyResponseController {

    private final EmergencyResponseService service;

    @GetMapping
    @Operation(summary = "비상대응 전체 조회")
    public ResponseEntity<ApiResponse<Page<EmergencyResponseResponse>>> findAll(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "비상대응 상세 조회")
    public ResponseEntity<ApiResponse<EmergencyResponseResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 비상대응 조회")
    public ResponseEntity<ApiResponse<Page<EmergencyResponseResponse>>> findByStatus(
            @PathVariable String status, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByStatus(status, pageable)));
    }

    @GetMapping("/type/{emergencyType}")
    @Operation(summary = "유형별 비상대응 조회")
    public ResponseEntity<ApiResponse<Page<EmergencyResponseResponse>>> findByType(
            @PathVariable String emergencyType, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByType(emergencyType, pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "비상대응 검색")
    public ResponseEntity<ApiResponse<Page<EmergencyResponseResponse>>> search(
            @RequestParam String title, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.searchByTitle(title, pageable)));
    }

    @PostMapping
    @Operation(summary = "비상대응 등록")
    public ResponseEntity<ApiResponse<EmergencyResponseResponse>> create(@Valid @RequestBody EmergencyResponseRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "비상대응 수정")
    public ResponseEntity<ApiResponse<EmergencyResponseResponse>> update(
            @PathVariable Long id, @Valid @RequestBody EmergencyResponseRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "비상대응 상태 변경")
    public ResponseEntity<ApiResponse<EmergencyResponseResponse>> updateStatus(
            @PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.success(service.updateStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "비상대응 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
