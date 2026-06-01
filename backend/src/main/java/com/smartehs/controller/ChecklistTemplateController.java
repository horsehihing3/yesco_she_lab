package com.smartehs.controller;

import com.smartehs.dto.request.ChecklistTemplateMasterRequest;
import com.smartehs.dto.request.ChecklistTemplateMasterRequest.ChecklistItemRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.ChecklistTemplateMasterResponse;
import com.smartehs.service.ChecklistExcelService;
import com.smartehs.service.ChecklistTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/checklist-templates")
@RequiredArgsConstructor
@Tag(name = "Checklist Template", description = "Checklist Template API")
public class ChecklistTemplateController {

    private final ChecklistTemplateService templateService;
    private final ChecklistExcelService excelService;

    @GetMapping
    @Operation(summary = "List templates", description = "Get all checklist templates with pagination")
    public ResponseEntity<ApiResponse<Page<ChecklistTemplateMasterResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(templateService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search templates", description = "Search templates by title")
    public ResponseEntity<ApiResponse<Page<ChecklistTemplateMasterResponse>>> search(
            @RequestParam String title,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(templateService.search(title, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get template by ID", description = "Get a specific template with items")
    public ResponseEntity<ApiResponse<ChecklistTemplateMasterResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(templateService.findById(id)));
    }

    @GetMapping("/dropdown")
    @Operation(summary = "Get all templates for dropdown", description = "Get all templates (id + title only)")
    public ResponseEntity<ApiResponse<List<ChecklistTemplateMasterResponse>>> findAllForDropdown() {
        return ResponseEntity.ok(ApiResponse.success(templateService.findAllForDropdown()));
    }

    @PostMapping
    @Operation(summary = "Create template", description = "Create a new checklist template with items")
    public ResponseEntity<ApiResponse<ChecklistTemplateMasterResponse>> create(
            @Valid @RequestBody ChecklistTemplateMasterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Template created successfully", templateService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update template", description = "Update an existing template with items")
    public ResponseEntity<ApiResponse<ChecklistTemplateMasterResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChecklistTemplateMasterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Template updated successfully", templateService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete template", description = "Delete a template and its items")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        templateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Template deleted successfully", null));
    }

    @PostMapping("/{id}/copy")
    @Operation(summary = "Copy template", description = "Duplicate template with all items. New title prefixed 'copy_ '")
    public ResponseEntity<ApiResponse<ChecklistTemplateMasterResponse>> copy(
            @PathVariable Long id,
            @RequestParam(required = false) String username) {
        return ResponseEntity.ok(ApiResponse.success("Template copied successfully", templateService.copy(id, username)));
    }

    @PostMapping("/upload")
    @Operation(summary = "Upload Excel", description = "Parse Excel file to extract checklist items")
    public ResponseEntity<ApiResponse<List<ChecklistItemRequest>>> uploadExcel(
            @RequestParam("file") MultipartFile file) {
        List<ChecklistItemRequest> items = excelService.parseExcel(file);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download Excel", description = "Download template as Excel file")
    public ResponseEntity<byte[]> downloadExcel(@PathVariable Long id) {
        ChecklistTemplateMasterResponse template = templateService.findById(id);
        byte[] excelBytes = excelService.downloadChecklist(template.getTitle(), template.getItems());

        String encodedFileName = URLEncoder.encode(template.getTitle() + ".xlsx", StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
                .body(excelBytes);
    }
}
