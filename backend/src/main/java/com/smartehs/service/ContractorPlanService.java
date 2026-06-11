package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ContractorPlanMapper;
import com.smartehs.mapper.ContractorWorkerMapper;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.ContractorPlan;
import com.smartehs.model.ContractorWorker;
import com.smartehs.model.IdmUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractorPlanService {

    private final ContractorPlanMapper contractorPlanMapper;
    private final ContractorWorkerMapper contractorWorkerMapper;
    private final IdmMapper idmMapper;
    private final ChecklistSnapshotService checklistSnapshotService;

    @Transactional(readOnly = true)
    public Page<ContractorPlan> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ContractorPlan> content = contractorPlanMapper.findByDeletedFalse(offset, limit);
        int total = contractorPlanMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ContractorPlan findById(Long id) {
        ContractorPlan plan = contractorPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("ContractorPlan", "id", id);
        }
        return plan;
    }

    @Transactional(readOnly = true)
    public Page<ContractorPlan> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ContractorPlan> content = contractorPlanMapper.findByStatus(status, offset, limit);
        int total = contractorPlanMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public ContractorPlan create(ContractorPlan plan) {
        String newId = generatePlanId();
        plan.setPlanId(newId);
        if (plan.getStatus() == null) {
            plan.setStatus("DRAFT");
        }
        plan.setDeleted(false);
        contractorPlanMapper.insert(plan);
        // 체크리스트 템플릿 선택 시 private 사본 스냅샷 → plan 의 checklist_template_id 를 사본 id 로 교체
        Long snapshotId = checklistSnapshotService.snapshotIfNeeded(
                plan.getChecklistTemplateId(), ChecklistSnapshotService.OWNER_CONTRACTOR, plan.getId());
        if (snapshotId != null && !snapshotId.equals(plan.getChecklistTemplateId())) {
            plan.setChecklistTemplateId(snapshotId);
            contractorPlanMapper.update(plan);
        }
        log.info("Created contractor plan: {}", newId);
        return findById(plan.getId());
    }

    @Transactional
    public ContractorPlan update(Long id, ContractorPlan plan) {
        ContractorPlan existing = contractorPlanMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("ContractorPlan", "id", id);
        }
        plan.setId(id);
        // 사용자가 요청한 template id → private 사본으로 교체 (기존 사본이 있고 source 가 바뀌면 교체)
        Long snapshotId = checklistSnapshotService.snapshotIfNeeded(
                plan.getChecklistTemplateId(), ChecklistSnapshotService.OWNER_CONTRACTOR, id);
        plan.setChecklistTemplateId(snapshotId);
        contractorPlanMapper.update(plan);
        log.info("Updated contractor plan: {}", existing.getPlanId());
        return findById(id);
    }

    @Transactional
    public ContractorPlan approve(Long id, String approvedBy) {
        ContractorPlan existing = contractorPlanMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("ContractorPlan", "id", id);
        }
        contractorPlanMapper.approvePlan(id, approvedBy);
        log.info("Approved contractor plan: {} by {}", existing.getPlanId(), approvedBy);
        return findById(id);
    }

    /**
     * 결재 전이.
     *   submit          (DRAFT|REJECTED → PENDING_APPROVAL)         계획 결재 상신
     *   approve         (PENDING_APPROVAL → APPROVED)               계획 승인 — PLAN stamp
     *   reject          (PENDING_APPROVAL → REJECTED)               반려
     *   completionSubmit (APPROVED → COMPLETION_PENDING)            완료 결재 상신
     *   complete        (COMPLETION_PENDING → DONE)                 완료 승인 — COMPLETION stamp
     */
    @Transactional
    public ContractorPlan transition(Long id, String action, String username, String rejectReason) {
        ContractorPlan existing = contractorPlanMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("ContractorPlan", "id", id);
        }

        String nextStatus;
        boolean approved;
        String stage;
        switch (action) {
            case "submit":
                nextStatus = "PENDING_APPROVAL"; approved = false; stage = "";
                break;
            case "approve":
                ensureCanApprove(existing, username, "PLAN");
                nextStatus = "APPROVED"; approved = true; stage = "PLAN";
                break;
            case "reject":
                ensureCanApprove(existing, username, "PLAN");
                if (rejectReason == null || rejectReason.trim().isEmpty()) {
                    throw new IllegalArgumentException("반려 사유는 필수 입력입니다.");
                }
                nextStatus = "REJECTED"; approved = false; stage = "";
                break;
            case "completionSubmit":
                nextStatus = "COMPLETION_PENDING"; approved = false; stage = "";
                break;
            case "complete":
                ensureCanApprove(existing, username, "COMPLETION");
                nextStatus = "DONE"; approved = true; stage = "COMPLETION";
                break;
            default:
                throw new IllegalArgumentException("Unknown action: " + action);
        }

        contractorPlanMapper.transition(id, nextStatus, approved, username, stage, rejectReason);
        return findById(id);
    }

    /** Backward-compat */
    @Transactional
    public ContractorPlan transition(Long id, String action, String username) {
        return transition(id, action, username, null);
    }

    private static final java.util.Set<String> ADMIN_ROLES = java.util.Set.of("SYSTEM_ADMIN");

    private void ensureCanApprove(ContractorPlan plan, String username, String stage) {
        if (username == null || username.isEmpty() || "system".equals(username)) return;
        IdmUser u;
        try { u = idmMapper.findByUid(username); } catch (Exception e) { u = null; }
        if (u == null) throw new org.springframework.security.access.AccessDeniedException("승인 권한이 없습니다.");
        if (u.getUserRole() != null && ADMIN_ROLES.contains(u.getUserRole())) return;

        String required = "PLAN".equals(stage) ? plan.getPlanApproverName() : plan.getCompletionApproverName();
        Long requiredId = "PLAN".equals(stage) ? plan.getPlanApproverUserId() : plan.getCompletionApproverUserId();
        if (requiredId != null && requiredId.equals(u.getUidNumber())) return;
        if (required != null && required.equalsIgnoreCase(u.getUserName())) return;
        throw new org.springframework.security.access.AccessDeniedException(
            "PLAN".equals(stage) ? "지정된 계획 승인자만 승인/반려할 수 있습니다." : "지정된 완료 승인자만 완료 처리할 수 있습니다.");
    }

    @Transactional
    public void delete(Long id) {
        ContractorPlan existing = contractorPlanMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("ContractorPlan", "id", id);
        }
        contractorPlanMapper.softDelete(id);
        // private 사본 정리
        checklistSnapshotService.deleteOwnerSnapshot(ChecklistSnapshotService.OWNER_CONTRACTOR, id);
        log.info("Soft deleted contractor plan with id: {}", id);
    }

    // ===== Workers =====

    @Transactional(readOnly = true)
    public List<ContractorWorker> findWorkersByPlanId(Long planId) {
        return contractorWorkerMapper.findByPlanId(planId);
    }

    @Transactional
    public ContractorWorker addWorker(Long planId, ContractorWorker worker) {
        // Verify plan exists
        findById(planId);
        worker.setPlanId(planId);
        contractorWorkerMapper.insert(worker);
        log.info("Added worker to contractor plan {}: {}", planId, worker.getWorkerName());
        return worker;
    }

    @Transactional
    public void deleteWorkersByPlanId(Long planId) {
        // Verify plan exists
        findById(planId);
        contractorWorkerMapper.deleteByPlanId(planId);
        log.info("Deleted all workers for contractor plan: {}", planId);
    }

    private String generatePlanId() {
        String prefix = "CP-" + LocalDate.now().getYear() + "-";
        int count = contractorPlanMapper.countByPlanIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }

    // ===== Edit Lock =====

    private static final long LOCK_STALE_MINUTES = 5;

    @Transactional
    public Map<String, Object> tryAcquireEditLock(Long planId, String username) {
        IdmUser user = idmMapper.findByUid(username);
        if (user == null) throw new ResourceNotFoundException("User", "username", username);
        ContractorPlan plan = findById(planId);
        Long lockUserId = plan.getEditingUserId();
        LocalDateTime startedAt = plan.getEditingStartedAt();
        boolean isStale = startedAt == null || startedAt.isBefore(LocalDateTime.now().minusMinutes(LOCK_STALE_MINUTES));
        boolean isCurrentUser = user.getUidNumber().equals(lockUserId);

        Map<String, Object> result = new HashMap<>();
        if (lockUserId == null || isStale || isCurrentUser) {
            contractorPlanMapper.acquireEditLock(planId, user.getUidNumber(), user.getUserName());
            result.put("acquired", true);
            result.put("currentEditor", null);
        } else {
            result.put("acquired", false);
            result.put("currentEditor", plan.getEditingUserName());
        }
        return result;
    }

    @Transactional
    public void releaseEditLock(Long planId, String username) {
        IdmUser user = idmMapper.findByUid(username);
        if (user == null) return;
        contractorPlanMapper.releaseEditLock(planId, user.getUidNumber());
    }
}
