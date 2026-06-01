package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.AccidentClaim;
import com.smartehs.model.AccidentClaimDoc;
import com.smartehs.service.AccidentClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/accident-claims")
@RequiredArgsConstructor
@Tag(name = "Accident Claim", description = "산업재해 신청")
public class AccidentClaimController {

    private final AccidentClaimService accidentClaimService;

    @GetMapping
    @Operation(summary = "산업재해 신청 전체 목록 조회")
    public ResponseEntity<ApiResponse<Page<AccidentClaim>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(accidentClaimService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "산업재해 신청 상세 조회")
    public ResponseEntity<ApiResponse<AccidentClaim>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(accidentClaimService.findById(id)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 산업재해 신청 조회")
    public ResponseEntity<ApiResponse<Page<AccidentClaim>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(accidentClaimService.findByStatus(status, pageable)));
    }

    @GetMapping("/my")
    @Operation(summary = "내 산업재해 신청 목록 조회")
    public ResponseEntity<ApiResponse<Page<AccidentClaim>>> findMy(
            Authentication authentication,
            @PageableDefault(size = 20) Pageable pageable) {
        String createdBy = authentication.getName();
        return ResponseEntity.ok(ApiResponse.success(accidentClaimService.findByCreatedBy(createdBy, pageable)));
    }

    @PostMapping
    @Operation(summary = "산업재해 신청 등록")
    public ResponseEntity<ApiResponse<AccidentClaim>> create(
            @RequestBody AccidentClaim claim,
            Authentication authentication) {
        String createdBy = authentication.getName();
        return ResponseEntity.ok(ApiResponse.success(accidentClaimService.create(claim, createdBy)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "산업재해 신청 수정")
    public ResponseEntity<ApiResponse<AccidentClaim>> update(
            @PathVariable Long id,
            @RequestBody AccidentClaim claim) {
        return ResponseEntity.ok(ApiResponse.success(accidentClaimService.update(id, claim)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "산업재해 신청 상태 변경")
    public ResponseEntity<ApiResponse<AccidentClaim>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(ApiResponse.success(accidentClaimService.updateStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "산업재해 신청 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        accidentClaimService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{id}/docs")
    @Operation(summary = "산업재해 신청 서류 목록 조회")
    public ResponseEntity<ApiResponse<List<AccidentClaimDoc>>> getDocs(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(accidentClaimService.findDocsByClaimId(id)));
    }

    @PatchMapping("/docs/{docId}/submit")
    @Operation(summary = "산업재해 서류 제출 상태 토글")
    public ResponseEntity<ApiResponse<Void>> toggleDocSubmitted(@PathVariable Long docId) {
        accidentClaimService.toggleDocSubmitted(docId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
