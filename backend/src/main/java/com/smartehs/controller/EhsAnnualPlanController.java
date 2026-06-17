package com.smartehs.controller;

import com.smartehs.dto.request.EhsAnnualPlanRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.EhsAnnualPlanResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.service.EhsAnnualPlanService;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ehs-plans")
@RequiredArgsConstructor
@Tag(name = "SHE Annual Plan", description = "SHE 연간 계획 관리 API")
public class EhsAnnualPlanController {

    private final EhsAnnualPlanService ehsAnnualPlanService;
    private final IdmMapper idmMapper;

    @GetMapping
    @Operation(summary = "List annual plans", description = "Get all SHE annual plans with optional year filter and pagination")
    public ResponseEntity<ApiResponse<Page<EhsAnnualPlanResponse>>> findAll(
            @RequestParam(required = false) Integer year,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EhsAnnualPlanResponse> plans;
        if (year != null) {
            plans = ehsAnnualPlanService.findByYear(year, pageable);
        } else {
            plans = ehsAnnualPlanService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get plan by ID", description = "Get a specific SHE annual plan by ID")
    public ResponseEntity<ApiResponse<EhsAnnualPlanResponse>> findById(@PathVariable Long id) {
        EhsAnnualPlanResponse plan = ehsAnnualPlanService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(plan));
    }

    @PostMapping
    @Operation(summary = "Create plan", description = "Create a new SHE annual plan")
    public ResponseEntity<ApiResponse<EhsAnnualPlanResponse>> create(
            @Valid @RequestBody EhsAnnualPlanRequest request,
            Authentication authentication) {
        if (authentication != null) {
            IdmUser idmUser = idmMapper.findByUid(authentication.getName());
            if (idmUser != null) {
                request.setCreatedByUserId(idmUser.getUidNumber());
                request.setCreatedByName(idmUser.getUserName());
                request.setCreatedByTeam(idmUser.getGroupName());
                request.setCreatedByPosition(idmUser.getTitleName());
            }
        }
        EhsAnnualPlanResponse plan = ehsAnnualPlanService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Plan created successfully", plan));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update plan", description = "Update an existing SHE annual plan")
    public ResponseEntity<ApiResponse<EhsAnnualPlanResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EhsAnnualPlanRequest request,
            Authentication authentication) {
        if (authentication != null) {
            IdmUser idmUser = idmMapper.findByUid(authentication.getName());
            if (idmUser != null) {
                request.setModifiedByUserId(idmUser.getUidNumber());
                request.setModifiedByName(idmUser.getUserName());
                request.setModifiedByTeam(idmUser.getGroupName());
                request.setModifiedByPosition(idmUser.getTitleName());
            }
        }
        EhsAnnualPlanResponse plan = ehsAnnualPlanService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Plan updated successfully", plan));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete plan", description = "Delete an SHE annual plan (작성자 또는 admin 만 가능)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        ehsAnnualPlanService.delete(id, username);
        return ResponseEntity.ok(ApiResponse.success("Plan deleted successfully", null));
    }

    @GetMapping("/approved")
    @Operation(summary = "List approved plans (KPI 현황)")
    public ResponseEntity<ApiResponse<List<EhsAnnualPlanResponse>>> findApproved(@RequestParam Integer year) {
        return ResponseEntity.ok(ApiResponse.success(ehsAnnualPlanService.findApprovedByYear(year)));
    }

    @PatchMapping("/{id}/transition")
    @Operation(summary = "Transition plan status",
               description = "action: submit / approve / reject / complete; rejectReason required when action=reject")
    public ResponseEntity<ApiResponse<EhsAnnualPlanResponse>> transition(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        String action = String.valueOf(body.get("action"));
        String rejectReason = body.get("rejectReason") != null ? String.valueOf(body.get("rejectReason")) : null;
        String username = authentication != null ? authentication.getName() : "system";
        EhsAnnualPlanResponse plan = ehsAnnualPlanService.transition(id, action, username, rejectReason);
        return ResponseEntity.ok(ApiResponse.success(plan));
    }
}
