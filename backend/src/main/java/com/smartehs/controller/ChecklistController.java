package com.smartehs.controller;

import com.smartehs.dto.request.*;
import com.smartehs.dto.response.*;
import com.smartehs.model.ChecklistTemplate;
import com.smartehs.service.ChecklistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/checklist")
@RequiredArgsConstructor
@Tag(name = "Safety Checklist", description = "안전보건 체크리스트 API")
public class ChecklistController {

    private final ChecklistService checklistService;

    // ===== Template =====
    @GetMapping("/templates")
    @Operation(summary = "체크리스트 템플릿 목록 조회")
    public ResponseEntity<ApiResponse<List<ChecklistTemplateResponse>>> findAllTemplates() {
        return ResponseEntity.ok(ApiResponse.success(checklistService.findAllTemplates()));
    }

    @GetMapping("/templates/{id}")
    @Operation(summary = "체크리스트 템플릿 상세 조회 (카테고리/항목 포함)")
    public ResponseEntity<ApiResponse<ChecklistTemplateResponse>> findTemplateWithDetails(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.findTemplateWithDetails(id)));
    }

    // ===== Batch Save =====
    @PutMapping("/templates/{id}/batch")
    @Operation(summary = "체크리스트 템플릿 일괄 저장")
    public ResponseEntity<ApiResponse<ChecklistTemplateResponse>> batchSaveTemplate(
            @PathVariable Long id, @RequestBody ChecklistTemplateBatchSaveRequest request, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Saved successfully", checklistService.batchSaveTemplate(id, request, username)));
    }

    @PostMapping("/templates")
    @Operation(summary = "체크리스트 템플릿 등록")
    public ResponseEntity<ApiResponse<ChecklistTemplateResponse>> createTemplate(@RequestBody ChecklistTemplate template) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.createTemplate(template)));
    }

    @DeleteMapping("/templates/{id}")
    @Operation(summary = "체크리스트 템플릿 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable Long id) {
        checklistService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/templates/{id}/copy")
    @Operation(summary = "체크리스트 템플릿 복제 (제목 앞에 'copy_ ' 접두어)")
    public ResponseEntity<ApiResponse<ChecklistTemplateResponse>> copyTemplate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Copied successfully", checklistService.copyTemplate(id)));
    }

    // ===== Category =====
    @PostMapping("/categories")
    @Operation(summary = "체크리스트 카테고리 추가")
    public ResponseEntity<ApiResponse<ChecklistCategoryResponse>> createCategory(@RequestBody ChecklistCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Created successfully", checklistService.createCategory(request)));
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "체크리스트 카테고리 수정")
    public ResponseEntity<ApiResponse<ChecklistCategoryResponse>> updateCategory(@PathVariable Long id, @RequestBody ChecklistCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", checklistService.updateCategory(id, request)));
    }

    @DeleteMapping("/categories/{id}")
    @Operation(summary = "체크리스트 카테고리 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        checklistService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }

    // ===== Item =====
    @PostMapping("/items")
    @Operation(summary = "체크리스트 항목 추가")
    public ResponseEntity<ApiResponse<ChecklistItemResponse>> createItem(@RequestBody ChecklistItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Created successfully", checklistService.createItem(request)));
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "체크리스트 항목 수정")
    public ResponseEntity<ApiResponse<ChecklistItemResponse>> updateItem(@PathVariable Long id, @RequestBody ChecklistItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", checklistService.updateItem(id, request)));
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "체크리스트 항목 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable Long id) {
        checklistService.deleteItem(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }

    // ===== Inspection =====
    @GetMapping("/inspections")
    @Operation(summary = "점검 기록 목록 조회")
    public ResponseEntity<ApiResponse<List<ChecklistInspectionResponse>>> findInspections(@RequestParam Long templateId) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.findInspectionsByTemplateId(templateId)));
    }

    @GetMapping("/inspection-by-risk-assessment")
    @Operation(summary = "위험성 평가 연결 점검 기록 조회")
    public ResponseEntity<ApiResponse<ChecklistInspectionResponse>> findInspectionByRiskAssessment(
            @RequestParam Long riskAssessmentId, @RequestParam Long templateId) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.findInspectionByRiskAssessmentAndTemplate(riskAssessmentId, templateId)));
    }

    @GetMapping("/inspections/{id}")
    @Operation(summary = "점검 기록 상세 조회 (결과 포함)")
    public ResponseEntity<ApiResponse<ChecklistInspectionResponse>> findInspection(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.findInspectionWithResults(id)));
    }

    @PostMapping("/inspections")
    @Operation(summary = "점검 기록 생성")
    public ResponseEntity<ApiResponse<ChecklistInspectionResponse>> createInspection(
            @RequestBody ChecklistInspectionRequest request, Authentication authentication) {
        String regUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Created successfully", checklistService.createInspection(request, regUser)));
    }

    @PutMapping("/inspections/{id}")
    @Operation(summary = "점검 기록 수정")
    public ResponseEntity<ApiResponse<ChecklistInspectionResponse>> updateInspection(
            @PathVariable Long id, @RequestBody ChecklistInspectionRequest request, Authentication authentication) {
        String modUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", checklistService.updateInspection(id, request, modUser)));
    }

    @DeleteMapping("/inspections/{id}")
    @Operation(summary = "점검 기록 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteInspection(@PathVariable Long id) {
        checklistService.deleteInspection(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
