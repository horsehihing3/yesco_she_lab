package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.AuditCorrective;
import com.smartehs.service.AuditCorrectiveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/audit-corrective")
@RequiredArgsConstructor
@Tag(name = "Audit Corrective", description = "감사 시정 조치 관리")
public class AuditCorrectiveController {

    private final AuditCorrectiveService correctiveService;

    @GetMapping
    @Operation(summary = "시정 조치 전체 목록 조회")
    public ResponseEntity<ApiResponse<Page<AuditCorrective>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(correctiveService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "시정 조치 상세 조회")
    public ResponseEntity<ApiResponse<AuditCorrective>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(correctiveService.findById(id)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 시정 조치 조회")
    public ResponseEntity<ApiResponse<Page<AuditCorrective>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(correctiveService.findByStatus(status, pageable)));
    }

    @GetMapping("/audit/{auditId}")
    @Operation(summary = "감사별 시정 조치 조회")
    public ResponseEntity<ApiResponse<Page<AuditCorrective>>> findByAuditId(
            @PathVariable Long auditId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(correctiveService.findByAuditId(auditId, pageable)));
    }

    @PostMapping
    @Operation(summary = "시정 조치 등록")
    public ResponseEntity<ApiResponse<AuditCorrective>> create(@RequestBody AuditCorrective corrective) {
        return ResponseEntity.ok(ApiResponse.success(correctiveService.create(corrective)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "시정 조치 수정")
    public ResponseEntity<ApiResponse<AuditCorrective>> update(@PathVariable Long id, @RequestBody AuditCorrective corrective) {
        return ResponseEntity.ok(ApiResponse.success(correctiveService.update(id, corrective)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "시정 조치 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        correctiveService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
