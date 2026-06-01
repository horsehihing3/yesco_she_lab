package com.smartehs.controller;

import com.smartehs.dto.request.ChecklistResultMasterRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.ChecklistResultMasterResponse;
import com.smartehs.service.ChecklistExcelService;
import com.smartehs.service.ChecklistExcelService.ExcelParseResult;
import com.smartehs.service.ChecklistResultService;
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

@RestController
@RequestMapping("/checklist-results")
@RequiredArgsConstructor
@Tag(name = "Checklist Result", description = "Checklist Result API")
public class ChecklistResultController {

    private final ChecklistResultService resultService;
    private final ChecklistExcelService excelService;

    @GetMapping
    @Operation(summary = "List results", description = "Get all checklist results with pagination")
    public ResponseEntity<ApiResponse<Page<ChecklistResultMasterResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(resultService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search results", description = "Search results by title")
    public ResponseEntity<ApiResponse<Page<ChecklistResultMasterResponse>>> search(
            @RequestParam String title,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(resultService.search(title, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get result by ID", description = "Get a specific result with items")
    public ResponseEntity<ApiResponse<ChecklistResultMasterResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(resultService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "Create result", description = "Create a new checklist result with items")
    public ResponseEntity<ApiResponse<ChecklistResultMasterResponse>> create(
            @Valid @RequestBody ChecklistResultMasterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Result created successfully", resultService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update result", description = "Update an existing result with items")
    public ResponseEntity<ApiResponse<ChecklistResultMasterResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChecklistResultMasterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Result updated successfully", resultService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete result", description = "Delete a result and its items")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        resultService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Result deleted successfully", null));
    }

    @PostMapping("/upload")
    @Operation(summary = "Upload Excel", description = "Parse Excel file with meta info and items")
    public ResponseEntity<ApiResponse<ExcelParseResult>> uploadExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "templateId", required = false) Long templateId) {
        ExcelParseResult result = excelService.parseExcelWithMeta(file);
        if (templateId != null) {
            excelService.validateAgainstTemplate(templateId, result.items());
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download Excel", description = "Download result as Excel file")
    public ResponseEntity<byte[]> downloadExcel(@PathVariable Long id) {
        ChecklistResultMasterResponse result = resultService.findById(id);
        byte[] excelBytes = excelService.downloadResult(
                result.getTitle(),
                result.getCheckDate() != null ? result.getCheckDate().toString() : null,
                result.getChecker(),
                result.getCheckManager(),
                result.getFacilityManager(),
                result.getItems()
        );

        String encodedFileName = URLEncoder.encode(result.getTitle() + ".xlsx", StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
                .body(excelBytes);
    }
}
