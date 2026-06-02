package com.smartehs.controller;

import com.smartehs.dto.request.HealthCheckupPlanRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.HealthCheckupPlanResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.service.HealthCheckupPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/health-checkup-plan")
@RequiredArgsConstructor
@Tag(name = "Health Checkup Plan", description = "건강검진 계획 관리 (일반/특수/직업병 통합)")
public class HealthCheckupPlanController {

    private final HealthCheckupPlanService service;
    private final IdmMapper idmMapper;

    @GetMapping
    @Operation(summary = "검진계획 목록", description = "checkupType / planYear / status 필터 + 페이징")
    public ResponseEntity<ApiResponse<Page<HealthCheckupPlanResponse>>> findAll(
            @RequestParam(required = false) String checkupType,
            @RequestParam(required = false) Integer planYear,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(checkupType, planYear, status, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "검진계획 단건 조회")
    public ResponseEntity<ApiResponse<HealthCheckupPlanResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @PostMapping
    @Operation(summary = "검진계획 등록")
    public ResponseEntity<ApiResponse<HealthCheckupPlanResponse>> create(
            @Valid @RequestBody HealthCheckupPlanRequest request,
            Authentication authentication) {
        IdmUser currentUser = authentication != null ? idmMapper.findByUid(authentication.getName()) : null;
        return ResponseEntity.ok(ApiResponse.success("Health checkup plan created", service.create(request, currentUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "검진계획 수정")
    public ResponseEntity<ApiResponse<HealthCheckupPlanResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody HealthCheckupPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Health checkup plan updated", service.update(id, request)));
    }

    @PatchMapping("/{id}/transition")
    @Operation(summary = "검진계획 결재 전이", description = "submit / approve / reject / complete")
    public ResponseEntity<ApiResponse<HealthCheckupPlanResponse>> transition(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        String action = String.valueOf(body.get("action"));
        String rejectReason = body.get("rejectReason") != null ? String.valueOf(body.get("rejectReason")) : null;
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success(service.transition(id, action, username, rejectReason)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "검진계획 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Health checkup plan deleted", null));
    }
}
