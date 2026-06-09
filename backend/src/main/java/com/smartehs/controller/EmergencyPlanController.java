package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.EmergencyPlan;
import com.smartehs.model.IdmUser;
import com.smartehs.service.EmergencyPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/emergency-plan")
@RequiredArgsConstructor
@Tag(name = "Emergency Plan", description = "비상 대응 계획 관리")
public class EmergencyPlanController {

    private final EmergencyPlanService emergencyPlanService;
    private final IdmMapper idmMapper;

    @GetMapping
    @Operation(summary = "비상 대응 계획 전체 목록 조회")
    public ResponseEntity<ApiResponse<Page<EmergencyPlan>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emergencyPlanService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "비상 대응 계획 상세 조회")
    public ResponseEntity<ApiResponse<EmergencyPlan>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(emergencyPlanService.findById(id)));
    }

    @GetMapping("/type/{planType}")
    @Operation(summary = "유형별 비상 대응 계획 조회")
    public ResponseEntity<ApiResponse<Page<EmergencyPlan>>> findByPlanType(
            @PathVariable String planType,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emergencyPlanService.findByPlanType(planType, pageable)));
    }

    @PostMapping
    @Operation(summary = "비상 대응 계획 등록")
    public ResponseEntity<ApiResponse<EmergencyPlan>> create(
            @RequestBody EmergencyPlan emergencyPlan,
            Authentication authentication) {
        if (authentication != null) {
            IdmUser idmUser = idmMapper.findByUid(authentication.getName());
            if (idmUser != null) {
                emergencyPlan.setWriterUserId(idmUser.getUidNumber());
                emergencyPlan.setWriterName(idmUser.getUserName());
                emergencyPlan.setWriterTeam(idmUser.getGroupName());
                emergencyPlan.setWriterPosition(idmUser.getTitleName());
                emergencyPlan.setModifiedByUserId(idmUser.getUidNumber());
                emergencyPlan.setModifiedByName(idmUser.getUserName());
                emergencyPlan.setModifiedByTeam(idmUser.getGroupName());
                emergencyPlan.setModifiedByPosition(idmUser.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(emergencyPlanService.create(emergencyPlan)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "비상 대응 계획 수정")
    public ResponseEntity<ApiResponse<EmergencyPlan>> update(@PathVariable Long id, @RequestBody EmergencyPlan emergencyPlan, Authentication authentication) {
        if (authentication != null) {
            IdmUser idmUser = idmMapper.findByUid(authentication.getName());
            if (idmUser != null) {
                emergencyPlan.setModifiedByUserId(idmUser.getUidNumber());
                emergencyPlan.setModifiedByName(idmUser.getUserName());
                emergencyPlan.setModifiedByTeam(idmUser.getGroupName());
                emergencyPlan.setModifiedByPosition(idmUser.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(emergencyPlanService.update(id, emergencyPlan)));
    }

    @PatchMapping("/{id}/transition")
    @Operation(summary = "비상 대응 계획 결재 전이",
               description = "action: submit / approve / reject / complete; rejectReason required when reject")
    public ResponseEntity<ApiResponse<EmergencyPlan>> transition(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        String action = String.valueOf(body.get("action"));
        String rejectReason = body.get("rejectReason") != null ? String.valueOf(body.get("rejectReason")) : null;
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success(emergencyPlanService.transition(id, action, username, rejectReason)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "비상 대응 계획 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        emergencyPlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
