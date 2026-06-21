package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.SiteSafetyPlanMapper;
import com.smartehs.mapper.SiteSafetyWorkerMapper;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.SiteSafetyPlan;
import com.smartehs.model.SiteSafetyWorker;
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
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class SiteSafetyPlanService {

    private final SiteSafetyPlanMapper planMapper;
    private final SiteSafetyWorkerMapper workerMapper;
    private final IdmMapper idmMapper;

    private static final Set<String> ADMIN_ROLES = Set.of("SYSTEM_ADMIN");

    @Transactional(readOnly = true)
    public Page<SiteSafetyPlan> findAll(String planType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<SiteSafetyPlan> content = planMapper.findByDeletedFalse(planType, offset, limit);
        int total = planMapper.countByDeletedFalse(planType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public SiteSafetyPlan findById(Long id) {
        SiteSafetyPlan plan = planMapper.findById(id);
        if (plan == null) throw new ResourceNotFoundException("SiteSafetyPlan", "id", id);
        return plan;
    }

    @Transactional(readOnly = true)
    public Page<SiteSafetyPlan> findByStatus(String planType, String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        return new PageImpl<>(planMapper.findByStatus(planType, status, offset, limit), pageable, planMapper.countByStatus(planType, status));
    }

    @Transactional
    public SiteSafetyPlan create(SiteSafetyPlan plan) {
        if (plan.getPlanType() == null || plan.getPlanType().isBlank()) plan.setPlanType("INTERNAL");
        plan.setPlanId(generatePlanId(plan.getPlanType()));
        if (plan.getStatus() == null) plan.setStatus("DRAFT");
        plan.setDeleted(false);
        planMapper.insert(plan);
        log.info("Created site safety plan: {} ({})", plan.getPlanId(), plan.getPlanType());
        return findById(plan.getId());
    }

    @Transactional
    public SiteSafetyPlan update(Long id, SiteSafetyPlan plan) {
        SiteSafetyPlan existing = planMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("SiteSafetyPlan", "id", id);
        plan.setId(id);
        // status는 게이팅된 transition()으로만 변경 — 전체수정(PUT)에서는 기존 상태 보존(무검증 승인 우회 방지)
        plan.setStatus(existing.getStatus());
        planMapper.update(plan);
        return findById(id);
    }

    /**
     * 결재 전이.
     *   submit  (DRAFT|REJECTED → PENDING_APPROVAL)
     *   approve (PENDING_APPROVAL → APPROVED)
     *   reject  (PENDING_APPROVAL → REJECTED)
     *   complete (APPROVED → DONE)
     */
    @Transactional
    public SiteSafetyPlan transition(Long id, String action, String username, String rejectReason) {
        SiteSafetyPlan existing = planMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("SiteSafetyPlan", "id", id);
        ensureCanApprove(existing, action, username);

        String nextStatus;
        boolean approved;
        String stage;
        switch (action) {
            case "submit":
                nextStatus = "PENDING_APPROVAL"; approved = false; stage = "";
                break;
            case "approve":
                nextStatus = "APPROVED"; approved = true; stage = "PLAN";
                break;
            case "reject":
                if (rejectReason == null || rejectReason.trim().isEmpty()) {
                    throw new IllegalArgumentException("반려 사유는 필수 입력입니다.");
                }
                // 완료 결재 반려: COMPLETION_PENDING → APPROVED 로 되돌림
                if ("COMPLETION_PENDING".equals(existing.getStatus())) {
                    nextStatus = "APPROVED"; approved = true; stage = "";
                } else {
                    nextStatus = "REJECTED"; approved = false; stage = "";
                }
                break;
            case "completionSubmit":
                // 완료 결재 상신: APPROVED → COMPLETION_PENDING
                if (!"APPROVED".equals(existing.getStatus())) {
                    throw new IllegalArgumentException("완료 결재 상신은 APPROVED 상태에서만 가능합니다.");
                }
                nextStatus = "COMPLETION_PENDING"; approved = true; stage = "";
                break;
            case "complete":
                // 완료 결재 승인: COMPLETION_PENDING (또는 APPROVED) → DONE
                if (!"COMPLETION_PENDING".equals(existing.getStatus()) && !"APPROVED".equals(existing.getStatus())) {
                    throw new IllegalArgumentException("완료 처리는 결재 상신 또는 승인 상태에서만 가능합니다.");
                }
                nextStatus = "DONE"; approved = true; stage = "COMPLETION";
                break;
            default:
                throw new IllegalArgumentException("Unknown action: " + action);
        }
        planMapper.transition(id, nextStatus, approved, username, stage, rejectReason);
        return findById(id);
    }

    /** 승인 결정(approve/reject/complete)은 지정 승인자 또는 Admin만. submit/completionSubmit 등 작성자 행위는 게이팅 안 함. */
    private void ensureCanApprove(SiteSafetyPlan plan, String action, String username) {
        if (!"approve".equals(action) && !"reject".equals(action) && !"complete".equals(action)) return;
        if (username == null || username.isEmpty() || "system".equals(username)) return;
        IdmUser u;
        try { u = idmMapper.findByUid(username); } catch (Exception e) { u = null; }
        if (u == null) throw new AccessDeniedException("승인 권한이 없습니다.");
        if (u.getUserRole() != null && ADMIN_ROLES.contains(u.getUserRole())) return;
        boolean planOk = matchesApprover(plan.getPlanApproverUserId(), plan.getPlanApproverName(), u);
        boolean compOk = matchesApprover(plan.getCompletionApproverUserId(), plan.getCompletionApproverName(), u);
        boolean ok = "approve".equals(action) ? planOk : "complete".equals(action) ? compOk : (planOk || compOk);
        if (!ok) throw new AccessDeniedException("지정된 승인자만 승인/반려할 수 있습니다.");
    }

    private static boolean matchesApprover(Long approverId, String approverName, IdmUser u) {
        if (approverId != null && approverId.equals(u.getUidNumber())) return true;
        if (approverName != null && u.getUserName() != null && approverName.equalsIgnoreCase(u.getUserName())) return true;
        return false;
    }

    @Transactional
    public void delete(Long id) {
        SiteSafetyPlan existing = planMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("SiteSafetyPlan", "id", id);
        planMapper.softDelete(id);
    }

    // ===== Workers =====
    @Transactional(readOnly = true)
    public List<SiteSafetyWorker> findWorkersByPlanId(Long planId) {
        return workerMapper.findByPlanId(planId);
    }

    @Transactional
    public SiteSafetyWorker addWorker(Long planId, SiteSafetyWorker worker) {
        findById(planId);
        worker.setPlanId(planId);
        workerMapper.insert(worker);
        return worker;
    }

    @Transactional
    public void deleteWorkersByPlanId(Long planId) {
        findById(planId);
        workerMapper.deleteByPlanId(planId);
    }

    private String generatePlanId(String planType) {
        String typePrefix = "PARTNER".equals(planType) ? "PS-" : "SS-";
        String prefix = typePrefix + LocalDate.now().getYear() + "-";
        int count = planMapper.countByPlanIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }

    // ===== Edit Lock =====
    private static final long LOCK_STALE_MINUTES = 5;

    @Transactional
    public Map<String, Object> tryAcquireEditLock(Long planId, String username) {
        IdmUser user = idmMapper.findByUid(username);
        if (user == null) throw new ResourceNotFoundException("User", "username", username);
        SiteSafetyPlan plan = findById(planId);
        Long lockUserId = plan.getEditingUserId();
        LocalDateTime startedAt = plan.getEditingStartedAt();
        boolean isStale = startedAt == null || startedAt.isBefore(LocalDateTime.now().minusMinutes(LOCK_STALE_MINUTES));
        // 스톱갭: 레거시 시드 일부 계정의 UIDNumber=NULL → NPE/500 방지(Objects.equals null-safe).
        // TODO(근본): UIDNumber 백필 후 재검토 — 현재 null-uid 계정은 락이 null키로 저장돼 동시편집 방지가 무효화됨. [원인규명 LAB_LOG 2026-06-21]
        boolean isCurrentUser = Objects.equals(user.getUidNumber(), lockUserId);

        Map<String, Object> result = new HashMap<>();
        if (lockUserId == null || isStale || isCurrentUser) {
            planMapper.acquireEditLock(planId, user.getUidNumber(), user.getUserName());
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
        planMapper.releaseEditLock(planId, user.getUidNumber());
    }
}
