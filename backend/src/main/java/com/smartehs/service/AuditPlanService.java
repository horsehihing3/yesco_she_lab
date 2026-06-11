package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.AuditMapper;
import com.smartehs.mapper.AuditPlanMapper;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.Audit;
import com.smartehs.model.AuditPlan;
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
public class AuditPlanService {

    private final AuditPlanMapper auditPlanMapper;
    private final AuditMapper auditMapper;
    private final ChecklistSnapshotService checklistSnapshotService;
    private final IdmMapper idmMapper;

    private static final Set<String> ADMIN_ROLES = Set.of("SYSTEM_ADMIN");

    @Transactional(readOnly = true)
    public Page<AuditPlan> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AuditPlan> content = auditPlanMapper.findByDeletedFalse(offset, limit);
        int total = auditPlanMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<AuditPlan> findUnapproved(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AuditPlan> content = auditPlanMapper.findUnapproved(offset, limit);
        int total = auditPlanMapper.countUnapproved();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public AuditPlan findById(Long id) {
        AuditPlan plan = auditPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("AuditPlan", "id", id);
        }
        return plan;
    }

    @Transactional(readOnly = true)
    public Page<AuditPlan> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AuditPlan> content = auditPlanMapper.findByStatus(status, offset, limit);
        int total = auditPlanMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public AuditPlan create(AuditPlan auditPlan) {
        String newId = generatePlanId();
        auditPlan.setPlanId(newId);
        if (auditPlan.getStatus() == null) {
            auditPlan.setStatus("PLAN");
        }
        auditPlan.setDeleted(false);
        auditPlanMapper.insert(auditPlan);
        Long snapshotId = checklistSnapshotService.snapshotIfNeeded(
                auditPlan.getChecklistTemplateId(), ChecklistSnapshotService.OWNER_AUDIT, auditPlan.getId());
        if (snapshotId != null && !snapshotId.equals(auditPlan.getChecklistTemplateId())) {
            auditPlan.setChecklistTemplateId(snapshotId);
            auditPlanMapper.update(auditPlan);
        }
        log.info("Created audit plan: {}", newId);
        return findById(auditPlan.getId());
    }

    @Transactional
    public AuditPlan update(Long id, AuditPlan auditPlan) {
        AuditPlan existing = auditPlanMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AuditPlan", "id", id);
        }
        auditPlan.setId(id);
        Long snapshotId = checklistSnapshotService.snapshotIfNeeded(
                auditPlan.getChecklistTemplateId(), ChecklistSnapshotService.OWNER_AUDIT, id);
        auditPlan.setChecklistTemplateId(snapshotId);
        auditPlanMapper.update(auditPlan);
        log.info("Updated audit plan: {}", existing.getPlanId());
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        AuditPlan existing = auditPlanMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AuditPlan", "id", id);
        }
        auditPlanMapper.softDelete(id);
        checklistSnapshotService.deleteOwnerSnapshot(ChecklistSnapshotService.OWNER_AUDIT, id);
        log.info("Soft deleted audit plan with id: {}", id);
    }

    /**
     * 계획 결재 상신 — status: PLAN → PENDING_APPROVAL
     * approved 는 그대로 false, 실제 승인은 approve() 에서.
     */
    @Transactional
    public AuditPlan submit(Long id) {
        AuditPlan existing = auditPlanMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AuditPlan", "id", id);
        }
        auditPlanMapper.submitPlan(id);
        log.info("Submitted audit plan for approval: {}", existing.getPlanId());
        return findById(id);
    }

    @Transactional
    public AuditPlan approve(Long id, String username) {
        AuditPlan existing = auditPlanMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AuditPlan", "id", id);
        }
        ensureCanApprovePlan(existing, username);

        auditPlanMapper.approvePlan(id, username);
        log.info("Approved audit plan: {} by {}", existing.getPlanId(), username);

        // 감사 실시 자동 생성
        String auditIdPrefix = "AUD-" + LocalDate.now().getYear() + "-";
        int auditCount = auditMapper.countByAuditIdStartingWith(auditIdPrefix);
        String auditId = String.format("%s%03d", auditIdPrefix, auditCount + 1);

        Audit audit = Audit.builder()
                .auditId(auditId)
                .planId(id)
                .auditName(existing.getAuditName())
                .auditType(existing.getAuditType())
                .targetDept(existing.getTargetDept())
                .auditorName(existing.getAuditorName())
                .auditorDept(existing.getAuditorDept())
                .auditStartDate(existing.getPlanStartDate())
                .auditEndDate(existing.getPlanEndDate())
                .planApproverUserId(existing.getPlanApproverUserId())
                .planApproverTeam(existing.getPlanApproverTeam())
                .planApproverPosition(existing.getPlanApproverPosition())
                .planApproverName(existing.getPlanApproverName())
                .completionApproverUserId(existing.getCompletionApproverUserId())
                .completionApproverTeam(existing.getCompletionApproverTeam())
                .completionApproverPosition(existing.getCompletionApproverPosition())
                .completionApproverName(existing.getCompletionApproverName())
                .createdByUserId(existing.getCreatedByUserId())
                .createdByName(existing.getCreatedByName())
                .totalChecklist(0)
                .completedChecklist(0)
                .findingCount(0)
                .status("PREPARING")
                .deleted(false)
                .build();
        auditMapper.insert(audit);
        log.info("Auto-created audit {} from approved plan {}", auditId, existing.getPlanId());

        return findById(id);
    }

    @Transactional
    public AuditPlan reject(Long id, String username, String rejectReason) {
        AuditPlan existing = auditPlanMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AuditPlan", "id", id);
        }
        ensureCanApprovePlan(existing, username);
        if (rejectReason == null || rejectReason.trim().isEmpty()) {
            throw new IllegalArgumentException("반려 사유는 필수 입력입니다.");
        }
        auditPlanMapper.rejectPlan(id, rejectReason);
        log.info("Rejected audit plan: {} by {} reason={}", existing.getPlanId(), username, rejectReason);
        return findById(id);
    }

    /** Backward-compat */
    @Transactional
    public AuditPlan reject(Long id, String username) {
        return reject(id, username, null);
    }

    /**
     * 권한 체크: 지정된 plan_approver_user_id / plan_approver_name 본인이거나 admin 만 가능.
     */
    private void ensureCanApprovePlan(AuditPlan plan, String username) {
        if (username == null || username.isEmpty() || "system".equals(username)) return;
        IdmUser u;
        try { u = idmMapper.findByUid(username); } catch (Exception e) { u = null; }
        if (u == null) throw new AccessDeniedException("승인 권한이 없습니다.");
        if (u.getUserRole() != null && ADMIN_ROLES.contains(u.getUserRole())) return;
        if (plan.getPlanApproverUserId() != null && plan.getPlanApproverUserId().equals(u.getUidNumber())) return;
        if (plan.getPlanApproverName() != null && plan.getPlanApproverName().equalsIgnoreCase(u.getUserName())) return;
        throw new AccessDeniedException("지정된 계획 승인자만 승인/반려할 수 있습니다.");
    }

    private String generatePlanId() {
        String prefix = "AUD-PL-" + LocalDate.now().getYear() + "-";
        int count = auditPlanMapper.countByPlanIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
