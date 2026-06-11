package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EmergencyDrillMapper;
import com.smartehs.mapper.EmergencyPlanMapper;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.EmergencyDrill;
import com.smartehs.model.EmergencyPlan;
import com.smartehs.model.IdmUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmergencyPlanService {

    private final EmergencyPlanMapper emergencyPlanMapper;
    private final EmergencyDrillMapper emergencyDrillMapper;
    private final ChecklistSnapshotService checklistSnapshotService;
    private final IdmMapper idmMapper;

    private static final Set<String> ADMIN_ROLES = Set.of("SYSTEM_ADMIN");

    @Transactional(readOnly = true)
    public Page<EmergencyPlan> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmergencyPlan> content = emergencyPlanMapper.findByDeletedFalse(offset, limit);
        int total = emergencyPlanMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public EmergencyPlan findById(Long id) {
        EmergencyPlan plan = emergencyPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("EmergencyPlan", "id", id);
        }
        return plan;
    }

    @Transactional(readOnly = true)
    public Page<EmergencyPlan> findByPlanType(String planType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmergencyPlan> content = emergencyPlanMapper.findByPlanType(planType, offset, limit);
        int total = emergencyPlanMapper.countByPlanType(planType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public EmergencyPlan create(EmergencyPlan emergencyPlan) {
        String newId = generatePlanId();
        emergencyPlan.setPlanId(newId);
        emergencyPlan.setDeleted(false);
        if (emergencyPlan.getStatus() == null || emergencyPlan.getStatus().isBlank()) {
            emergencyPlan.setStatus("DRAFT");
        }
        emergencyPlanMapper.insert(emergencyPlan);
        Long snapshotId = checklistSnapshotService.snapshotIfNeeded(
                emergencyPlan.getChecklistTemplateId(), ChecklistSnapshotService.OWNER_EMERGENCY, emergencyPlan.getId());
        if (snapshotId != null && !snapshotId.equals(emergencyPlan.getChecklistTemplateId())) {
            emergencyPlan.setChecklistTemplateId(snapshotId);
            emergencyPlanMapper.update(emergencyPlan);
        }
        log.info("Created emergency plan: {}", newId);
        return findById(emergencyPlan.getId());
    }

    @Transactional
    public EmergencyPlan update(Long id, EmergencyPlan emergencyPlan) {
        EmergencyPlan existing = emergencyPlanMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("EmergencyPlan", "id", id);
        }
        emergencyPlan.setId(id);
        Long snapshotId = checklistSnapshotService.snapshotIfNeeded(
                emergencyPlan.getChecklistTemplateId(), ChecklistSnapshotService.OWNER_EMERGENCY, id);
        emergencyPlan.setChecklistTemplateId(snapshotId);
        emergencyPlanMapper.update(emergencyPlan);
        log.info("Updated emergency plan: {}", existing.getPlanId());
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        EmergencyPlan existing = emergencyPlanMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("EmergencyPlan", "id", id);
        }
        emergencyPlanMapper.softDelete(id);
        checklistSnapshotService.deleteOwnerSnapshot(ChecklistSnapshotService.OWNER_EMERGENCY, id);
        log.info("Soft deleted emergency plan with id: {}", id);
    }

    /**
     * 결재 흐름 전이.
     * action: submit (DRAFT → PENDING_APPROVAL)
     *         approve (PENDING_APPROVAL → APPROVED) — 계획 승인자 권한 + drill 자동생성
     *         reject  (PENDING_APPROVAL → DRAFT)    — 계획 승인자 권한
     *         complete (APPROVED → DONE)            — 완료 승인자 권한 (훈련 관리에서 호출)
     */
    @Transactional
    public EmergencyPlan transition(Long id, String action, String username, String rejectReason) {
        EmergencyPlan plan = emergencyPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("EmergencyPlan", "id", id);
        }

        String nextStatus;
        boolean approved;
        String stage; // "PLAN" / "COMPLETION" / ""
        switch (action) {
            case "submit":
                nextStatus = "PENDING_APPROVAL"; approved = false; stage = "";
                break;
            case "approve":
                ensureCanApprove(plan, username, "PLAN");
                nextStatus = "APPROVED"; approved = true; stage = "PLAN";
                break;
            case "reject":
                if (rejectReason == null || rejectReason.trim().isEmpty()) {
                    throw new IllegalArgumentException("반려 사유는 필수 입력입니다.");
                }
                // 완료 결재 반려: COMPLETION_PENDING → APPROVED 로 되돌림
                if ("COMPLETION_PENDING".equals(plan.getStatus())) {
                    ensureCanApprove(plan, username, "COMPLETION");
                    nextStatus = "APPROVED"; approved = true; stage = "";
                } else {
                    // 계획 결재 반려: PENDING_APPROVAL → DRAFT
                    ensureCanApprove(plan, username, "PLAN");
                    nextStatus = "DRAFT"; approved = false; stage = "";
                }
                break;
            case "completionSubmit":
                // 완료 결재 상신: APPROVED → COMPLETION_PENDING (작성자/admin 누구나)
                if (!"APPROVED".equals(plan.getStatus())) {
                    throw new IllegalArgumentException("완료 결재 상신은 APPROVED 상태에서만 가능합니다.");
                }
                nextStatus = "COMPLETION_PENDING"; approved = true; stage = "";
                break;
            case "complete":
                ensureCanApprove(plan, username, "COMPLETION");
                if (!"COMPLETION_PENDING".equals(plan.getStatus())) {
                    throw new IllegalArgumentException("완료 승인은 COMPLETION_PENDING 상태에서만 가능합니다.");
                }
                nextStatus = "DONE"; approved = true; stage = "COMPLETION";
                break;
            default:
                throw new IllegalArgumentException("Unknown transition action: " + action);
        }

        emergencyPlanMapper.transition(id, nextStatus, approved, username, stage, rejectReason);

        // 계획 승인 시 훈련 자동 생성
        if ("approve".equals(action)) {
            createDrillFromPlan(plan);
        }
        return findById(id);
    }

    /** Backward-compat */
    @Transactional
    public EmergencyPlan transition(Long id, String action, String username) {
        return transition(id, action, username, null);
    }

    private void createDrillFromPlan(EmergencyPlan plan) {
        String drillPrefix = "DR-" + LocalDate.now().getYear() + "-";
        int drillCount = emergencyDrillMapper.countByDrillIdStartingWith(drillPrefix);
        String drillId = String.format("%s%03d", drillPrefix, drillCount + 1);

        EmergencyDrill drill = EmergencyDrill.builder()
                .drillId(drillId)
                .planId(plan.getId())
                .drillName(plan.getPlanName())
                .drillType(plan.getPlanType())
                .targetDept(plan.getResponsibleDept())
                .scheduledDate(plan.getTrainingStartDate())
                .totalChecklist(0)
                .completedChecklist(0)
                .findingCount(0)
                .status("SCHEDULED")
                .deleted(false)
                .build();
        emergencyDrillMapper.insert(drill);
        log.info("Auto-created drill {} from approved plan {}", drillId, plan.getPlanId());
    }

    private void ensureCanApprove(EmergencyPlan plan, String username, String stage) {
        if (username == null || username.isEmpty() || "system".equals(username)) {
            return;
        }
        IdmUser u;
        try { u = idmMapper.findByUid(username); } catch (Exception e) { u = null; }
        if (u == null) {
            throw new AccessDeniedException("승인 권한이 없습니다.");
        }
        if (u.getUserRole() != null && ADMIN_ROLES.contains(u.getUserRole())) return;

        String required = "PLAN".equals(stage) ? plan.getPlanApproverName() : plan.getCompletionApproverName();
        Long requiredId = "PLAN".equals(stage) ? plan.getPlanApproverUserId() : plan.getCompletionApproverUserId();
        if (requiredId != null && requiredId.equals(u.getUidNumber())) return;
        if (required != null && required.equalsIgnoreCase(u.getUserName())) return;
        throw new AccessDeniedException(
            "PLAN".equals(stage) ? "지정된 계획 승인자만 승인/반려할 수 있습니다." : "지정된 완료 승인자만 작업 완료 처리할 수 있습니다.");
    }

    private String generatePlanId() {
        String prefix = "EP-" + LocalDate.now().getYear() + "-";
        int count = emergencyPlanMapper.countByPlanIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
