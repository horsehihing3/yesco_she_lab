package com.smartehs.controller;

import com.smartehs.dto.request.RiskActivityProcessRequest;
import com.smartehs.dto.request.RiskAssessmentDetailRequest;
import com.smartehs.dto.request.RiskAssessmentRequest;
import com.smartehs.dto.request.RiskRegisterRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.RiskActivityProcessResponse;
import com.smartehs.dto.response.RiskAssessmentDetailResponse;
import com.smartehs.dto.response.RiskAssessmentResponse;
import com.smartehs.dto.response.RiskRegisterResponse;
import com.smartehs.model.RiskAssessmentLog;
import com.smartehs.service.RiskAssessmentLogService;
import com.smartehs.service.RiskAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/risk-assessments")
@RequiredArgsConstructor
public class RiskAssessmentController {

    private final RiskAssessmentService riskAssessmentService;
    private final RiskAssessmentLogService riskAssessmentLogService;

    // ==================== Risk Assessment ====================

    @GetMapping
    public ResponseEntity<ApiResponse<Page<RiskAssessmentResponse>>> findAll(
            @RequestParam(required = false) String site,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<RiskAssessmentResponse> result;
        if (site != null && !site.isEmpty()) {
            result = riskAssessmentService.findBySite(site, pageable);
        } else if (status != null && !status.isEmpty()) {
            result = riskAssessmentService.findByStatus(status, pageable);
        } else {
            result = riskAssessmentService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RiskAssessmentResponse>> findById(@PathVariable Long id) {
        RiskAssessmentResponse response = riskAssessmentService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/risk-id/{riskId}")
    public ResponseEntity<ApiResponse<RiskAssessmentResponse>> findByRiskId(@PathVariable String riskId) {
        RiskAssessmentResponse response = riskAssessmentService.findByRiskId(riskId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RiskAssessmentResponse>> create(@RequestBody RiskAssessmentRequest request) {
        RiskAssessmentResponse response = riskAssessmentService.create(request);
        return ResponseEntity.ok(ApiResponse.success("위험성 평가가 생성되었습니다.", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RiskAssessmentResponse>> update(
            @PathVariable Long id,
            @RequestBody RiskAssessmentRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        RiskAssessmentResponse response = riskAssessmentService.update(id, request, username);
        return ResponseEntity.ok(ApiResponse.success("위험성 평가가 수정되었습니다.", response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<RiskAssessmentResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        String status = (String) body.get("status");
        String rejectReason = (String) body.get("rejectReason");
        Boolean allowResubmit = (Boolean) body.get("allowResubmit");
        String username = authentication != null ? authentication.getName() : "system";

        RiskAssessmentResponse response = riskAssessmentService.updateStatus(id, status, rejectReason, allowResubmit, username);
        return ResponseEntity.ok(ApiResponse.success("상태가 변경되었습니다.", response));
    }

    @PatchMapping("/{id}/transition")
    public ResponseEntity<ApiResponse<RiskAssessmentResponse>> transition(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        String action = String.valueOf(body.get("action"));
        String rejectReason = (String) body.get("rejectReason");
        String username = authentication != null ? authentication.getName() : "system";
        RiskAssessmentResponse response = riskAssessmentService.transition(id, action, rejectReason, username);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        riskAssessmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("위험성 평가가 삭제되었습니다.", null));
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<ApiResponse<List<RiskAssessmentLog>>> getLogs(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(riskAssessmentLogService.findByAssessmentId(id)));
    }

    // ==================== Activity Process (Step 1) ====================

    @GetMapping("/{riskId}/activity-processes")
    public ResponseEntity<ApiResponse<List<RiskActivityProcessResponse>>> findActivityProcesses(
            @PathVariable String riskId) {
        List<RiskActivityProcessResponse> response = riskAssessmentService.findActivityProcessesByRiskId(riskId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{riskId}/activity-processes")
    public ResponseEntity<ApiResponse<RiskActivityProcessResponse>> createActivityProcess(
            @PathVariable String riskId,
            @RequestBody RiskActivityProcessRequest request) {
        RiskActivityProcessResponse response = riskAssessmentService.createActivityProcess(riskId, request);
        return ResponseEntity.ok(ApiResponse.success("활동공정이 추가되었습니다.", response));
    }

    @PutMapping("/activity-processes/{id}")
    public ResponseEntity<ApiResponse<RiskActivityProcessResponse>> updateActivityProcess(
            @PathVariable Long id,
            @RequestBody RiskActivityProcessRequest request) {
        RiskActivityProcessResponse response = riskAssessmentService.updateActivityProcess(id, request);
        return ResponseEntity.ok(ApiResponse.success("활동공정이 수정되었습니다.", response));
    }

    @DeleteMapping("/activity-processes/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteActivityProcess(@PathVariable Long id) {
        riskAssessmentService.deleteActivityProcess(id);
        return ResponseEntity.ok(ApiResponse.success("활동공정이 삭제되었습니다.", null));
    }

    @PostMapping("/{riskId}/activity-processes/batch")
    public ResponseEntity<ApiResponse<Void>> saveActivityProcessesBatch(
            @PathVariable String riskId,
            @RequestBody List<RiskActivityProcessRequest> requests,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        riskAssessmentService.saveActivityProcessesBatch(riskId, requests, username);
        return ResponseEntity.ok(ApiResponse.success("활동공정 목록이 저장되었습니다.", null));
    }

    // ==================== Assessment Detail (Step 2) ====================

    @GetMapping("/{riskId}/assessment-details")
    public ResponseEntity<ApiResponse<List<RiskAssessmentDetailResponse>>> findAssessmentDetails(
            @PathVariable String riskId) {
        List<RiskAssessmentDetailResponse> response = riskAssessmentService.findAssessmentDetailsByRiskId(riskId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{riskId}/assessment-details")
    public ResponseEntity<ApiResponse<RiskAssessmentDetailResponse>> createAssessmentDetail(
            @PathVariable String riskId,
            @RequestBody RiskAssessmentDetailRequest request) {
        RiskAssessmentDetailResponse response = riskAssessmentService.createAssessmentDetail(riskId, request);
        return ResponseEntity.ok(ApiResponse.success("평가 항목이 추가되었습니다.", response));
    }

    @PutMapping("/assessment-details/{id}")
    public ResponseEntity<ApiResponse<RiskAssessmentDetailResponse>> updateAssessmentDetail(
            @PathVariable Long id,
            @RequestBody RiskAssessmentDetailRequest request) {
        RiskAssessmentDetailResponse response = riskAssessmentService.updateAssessmentDetail(id, request);
        return ResponseEntity.ok(ApiResponse.success("평가 항목이 수정되었습니다.", response));
    }

    @DeleteMapping("/assessment-details/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAssessmentDetail(@PathVariable Long id) {
        riskAssessmentService.deleteAssessmentDetail(id);
        return ResponseEntity.ok(ApiResponse.success("평가 항목이 삭제되었습니다.", null));
    }

    @PostMapping("/{riskId}/assessment-details/batch")
    public ResponseEntity<ApiResponse<Void>> saveAssessmentDetailsBatch(
            @PathVariable String riskId,
            @RequestBody List<RiskAssessmentDetailRequest> requests,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        riskAssessmentService.saveAssessmentDetailsBatch(riskId, requests, username);
        return ResponseEntity.ok(ApiResponse.success("평가 항목 목록이 저장되었습니다.", null));
    }

    // ==================== Risk Register (Step 3) ====================

    @GetMapping("/{riskId}/risk-registers")
    public ResponseEntity<ApiResponse<List<RiskRegisterResponse>>> findRiskRegisters(
            @PathVariable String riskId) {
        List<RiskRegisterResponse> response = riskAssessmentService.findRiskRegistersByRiskId(riskId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{riskId}/risk-registers")
    public ResponseEntity<ApiResponse<RiskRegisterResponse>> createRiskRegister(
            @PathVariable String riskId,
            @RequestBody RiskRegisterRequest request) {
        RiskRegisterResponse response = riskAssessmentService.createRiskRegister(riskId, request);
        return ResponseEntity.ok(ApiResponse.success("위험성 등록부가 추가되었습니다.", response));
    }

    @PutMapping("/risk-registers/{id}")
    public ResponseEntity<ApiResponse<RiskRegisterResponse>> updateRiskRegister(
            @PathVariable Long id,
            @RequestBody RiskRegisterRequest request) {
        RiskRegisterResponse response = riskAssessmentService.updateRiskRegister(id, request);
        return ResponseEntity.ok(ApiResponse.success("위험성 등록부가 수정되었습니다.", response));
    }

    @DeleteMapping("/risk-registers/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRiskRegister(@PathVariable Long id) {
        riskAssessmentService.deleteRiskRegister(id);
        return ResponseEntity.ok(ApiResponse.success("위험성 등록부가 삭제되었습니다.", null));
    }

    @PostMapping("/{riskId}/risk-registers/generate")
    public ResponseEntity<ApiResponse<Void>> generateRiskRegisters(@PathVariable String riskId) {
        riskAssessmentService.generateRiskRegistersFromDetails(riskId);
        return ResponseEntity.ok(ApiResponse.success("위험성 등록부가 생성되었습니다.", null));
    }
}
