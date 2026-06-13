package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.request.RiskAssessmentFormRequest;
import com.smartehs.dto.response.RiskAssessmentFormResponse;
import com.smartehs.service.RiskAssessmentFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/risk-assessment-forms")
@RequiredArgsConstructor
@Tag(name = "Risk Assessment Form", description = "위험성 평가표")
public class RiskAssessmentFormController {

    private final RiskAssessmentFormService formService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<RiskAssessmentFormResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String title) {
        Page<RiskAssessmentFormResponse> result;
        if (title != null && !title.isBlank()) {
            result = formService.search(title, PageRequest.of(page, size));
        } else {
            result = formService.findAll(PageRequest.of(page, size));
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RiskAssessmentFormResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(formService.findById(id)));
    }

    @GetMapping("/dropdown")
    public ResponseEntity<ApiResponse<List<RiskAssessmentFormResponse>>> getDropdown() {
        return ResponseEntity.ok(ApiResponse.success(formService.findAllForDropdown()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RiskAssessmentFormResponse>> create(
            @RequestBody RiskAssessmentFormRequest request) {
        return ResponseEntity.ok(ApiResponse.success(formService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RiskAssessmentFormResponse>> update(
            @PathVariable Long id,
            @RequestBody RiskAssessmentFormRequest request) {
        return ResponseEntity.ok(ApiResponse.success(formService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        formService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
