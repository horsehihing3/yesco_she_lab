package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.mapper.ContractorEvalMapper;
import com.smartehs.model.ContractorEvalItem;
import com.smartehs.model.ContractorEvalTemplate;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contractor-eval")
@RequiredArgsConstructor
@Tag(name = "Contractor Evaluation", description = "협력사 위험성 평가 API")
public class ContractorEvalController {

    private final ContractorEvalMapper contractorEvalMapper;

    @GetMapping("/templates")
    @Operation(summary = "협력사 평가 템플릿 목록 조회")
    public ResponseEntity<ApiResponse<List<ContractorEvalTemplate>>> findAllTemplates() {
        return ResponseEntity.ok(ApiResponse.success(contractorEvalMapper.findAllTemplates()));
    }

    @GetMapping("/templates/{id}")
    @Operation(summary = "협력사 평가 템플릿 상세 조회")
    public ResponseEntity<ApiResponse<ContractorEvalTemplate>> findTemplateById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(contractorEvalMapper.findTemplateById(id)));
    }

    @GetMapping("/templates/{id}/items")
    @Operation(summary = "협력사 평가 항목 조회")
    public ResponseEntity<ApiResponse<List<ContractorEvalItem>>> findItemsByTemplateId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(contractorEvalMapper.findItemsByTemplateId(id)));
    }

    @PutMapping("/templates/{id}/items")
    @Operation(summary = "협력사 평가 항목 일괄 저장")
    @Transactional
    public ResponseEntity<ApiResponse<List<ContractorEvalItem>>> batchSaveItems(
            @PathVariable Long id, @RequestBody List<ContractorEvalItem> items) {
        contractorEvalMapper.deleteItemsByTemplateId(id);
        for (ContractorEvalItem item : items) {
            item.setTemplateId(id);
            contractorEvalMapper.insertItem(item);
        }
        return ResponseEntity.ok(ApiResponse.success("Saved successfully", contractorEvalMapper.findItemsByTemplateId(id)));
    }

    @PutMapping("/templates/{id}")
    @Operation(summary = "협력사 평가 템플릿 메타(이름·설명·서명) 저장")
    public ResponseEntity<ApiResponse<ContractorEvalTemplate>> updateTemplateMeta(
            @PathVariable Long id, @RequestBody ContractorEvalTemplate template) {
        template.setId(id);
        contractorEvalMapper.updateTemplateMeta(template);
        return ResponseEntity.ok(ApiResponse.success("Template updated", contractorEvalMapper.findTemplateById(id)));
    }
}
