package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.PartnerSafetyExecution;
import com.smartehs.service.PartnerSafetyExecutionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/partner-safety-executions")
@RequiredArgsConstructor
@Tag(name = "Partner Safety Execution", description = "협력 업체 안전 관리 실행/조회 API")
public class PartnerSafetyExecutionController {

    private final PartnerSafetyExecutionService service;

    @GetMapping
    @Operation(summary = "전체 목록")
    public ResponseEntity<ApiResponse<List<PartnerSafetyExecution>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/completed")
    @Operation(summary = "완료된 실행만 — 조회 탭")
    public ResponseEntity<ApiResponse<List<PartnerSafetyExecution>>> findCompleted() {
        return ResponseEntity.ok(ApiResponse.success(service.findCompleted()));
    }

    @GetMapping("/plan/{planId}")
    @Operation(summary = "계획별 실행 목록")
    public ResponseEntity<ApiResponse<List<PartnerSafetyExecution>>> findByPlan(@PathVariable Long planId) {
        return ResponseEntity.ok(ApiResponse.success(service.findByPlanId(planId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "단건 조회 (id)")
    public ResponseEntity<ApiResponse<PartnerSafetyExecution>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/token/{token}")
    @Operation(summary = "토큰으로 조회 — 실행 새 창에서 사용")
    public ResponseEntity<ApiResponse<PartnerSafetyExecution>> findByToken(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.success(service.findByToken(token)));
    }

    @GetMapping("/token/{token}/previous")
    @Operation(summary = "같은 planId 의 이전 완료된 실행 결과 (체크리스트 prefill 용)")
    public ResponseEntity<ApiResponse<PartnerSafetyExecution>> findPreviousByToken(@PathVariable String token) {
        PartnerSafetyExecution current = service.findByToken(token);
        PartnerSafetyExecution prev = service.findLatestCompletedForPlan(current.getPlanId());
        return ResponseEntity.ok(ApiResponse.success(prev));
    }

    @PostMapping
    @Operation(summary = "파라미터 입력 — 실행 생성 (URL 토큰 자동 발급)")
    public ResponseEntity<ApiResponse<PartnerSafetyExecution>> create(@RequestBody PartnerSafetyExecution req) {
        return ResponseEntity.ok(ApiResponse.success(service.create(req)));
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "새 창에서 체크리스트·서명 제출 → 완료 처리")
    public ResponseEntity<ApiResponse<PartnerSafetyExecution>> complete(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String signature = (String) body.get("signature");
        String checklistData = (String) body.get("checklistData");
        return ResponseEntity.ok(ApiResponse.success(service.complete(id, signature, checklistData)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
