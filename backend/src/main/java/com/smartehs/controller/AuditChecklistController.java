package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.AuditChecklistItem;
import com.smartehs.model.AuditChecklistResult;
import com.smartehs.model.AuditChecklistTemplate;
import com.smartehs.service.AuditChecklistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/audit-checklist")
@RequiredArgsConstructor
@Tag(name = "Audit Checklist", description = "감사 체크리스트 관리")
public class AuditChecklistController {

    private final AuditChecklistService checklistService;

    // ===== Template endpoints =====

    @GetMapping("/template")
    @Operation(summary = "체크리스트 양식 전체 조회")
    public ResponseEntity<ApiResponse<Page<AuditChecklistTemplate>>> findAllTemplates(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.findAllTemplates(pageable)));
    }

    @GetMapping("/template/{id}")
    @Operation(summary = "체크리스트 양식 상세 조회 (항목 포함)")
    public ResponseEntity<ApiResponse<AuditChecklistTemplate>> findTemplateById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.findTemplateById(id)));
    }

    @GetMapping("/template/audit-type/{auditType}")
    @Operation(summary = "감사 유형별 체크리스트 양식 조회")
    public ResponseEntity<ApiResponse<List<AuditChecklistTemplate>>> findTemplatesByAuditType(
            @PathVariable String auditType) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.findTemplatesByAuditType(auditType)));
    }

    @PostMapping("/template")
    @Operation(summary = "체크리스트 양식 등록")
    public ResponseEntity<ApiResponse<AuditChecklistTemplate>> createTemplate(
            @RequestBody AuditChecklistTemplate template) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.createTemplate(template)));
    }

    @PutMapping("/template/{id}")
    @Operation(summary = "체크리스트 양식 수정")
    public ResponseEntity<ApiResponse<AuditChecklistTemplate>> updateTemplate(
            @PathVariable Long id, @RequestBody AuditChecklistTemplate template) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.updateTemplate(id, template)));
    }

    @DeleteMapping("/template/{id}")
    @Operation(summary = "체크리스트 양식 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable Long id) {
        checklistService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ===== Item endpoints =====

    @GetMapping("/item/template/{templateId}")
    @Operation(summary = "양식별 체크리스트 항목 조회")
    public ResponseEntity<ApiResponse<List<AuditChecklistItem>>> findItemsByTemplateId(
            @PathVariable Long templateId) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.findItemsByTemplateId(templateId)));
    }

    @PostMapping("/item")
    @Operation(summary = "체크리스트 항목 등록")
    public ResponseEntity<ApiResponse<AuditChecklistItem>> createItem(@RequestBody AuditChecklistItem item) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.createItem(item)));
    }

    @PutMapping("/item/{id}")
    @Operation(summary = "체크리스트 항목 수정")
    public ResponseEntity<ApiResponse<AuditChecklistItem>> updateItem(
            @PathVariable Long id, @RequestBody AuditChecklistItem item) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.updateItem(id, item)));
    }

    @DeleteMapping("/item/{id}")
    @Operation(summary = "체크리스트 항목 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable Long id) {
        checklistService.deleteItem(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ===== Result endpoints =====

    @PostMapping("/result/init")
    @Operation(summary = "감사별 체크리스트 결과 초기화")
    public ResponseEntity<ApiResponse<Void>> initResults(
            @RequestParam Long auditId, @RequestParam Long templateId) {
        checklistService.initResults(auditId, templateId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/result/audit/{auditId}")
    @Operation(summary = "감사별 체크리스트 결과 조회")
    public ResponseEntity<ApiResponse<List<AuditChecklistResult>>> findResultsByAuditId(
            @PathVariable Long auditId) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.findResultsByAuditId(auditId)));
    }

    @PutMapping("/result/{id}")
    @Operation(summary = "체크리스트 결과 수정")
    public ResponseEntity<ApiResponse<AuditChecklistResult>> updateResult(
            @PathVariable Long id, @RequestBody AuditChecklistResult result) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.updateResult(id, result)));
    }
}
