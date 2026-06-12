package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.mapper.LegalComplianceExecMapper;
import com.smartehs.mapper.LegalCompliancePlanMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.model.LegalComplianceExec;
import com.smartehs.model.LegalCompliancePlan;
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

/** 법규 대응 계획 — tb_audit_plan 과 분리된 tb_legal_compliance_plan 사용. AuditPlanService 와 동일 흐름. */
@Slf4j
@Service
@RequiredArgsConstructor
public class LegalCompliancePlanService {

    private final LegalCompliancePlanMapper planMapper;
    private final LegalComplianceExecMapper execMapper;
    private final ChecklistSnapshotService checklistSnapshotService;
    private final IdmMapper idmMapper;

    private static final Set<String> ADMIN_ROLES = Set.of("SYSTEM_ADMIN");
    // ChecklistSnapshotService 의 OWNER_AUDIT 와 충돌 방지를 위해 별도 owner 식별자 사용
    private static final String OWNER_LC = "LEGAL_COMPLIANCE";

    @Transactional(readOnly = true)
    public Page<LegalCompliancePlan> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<LegalCompliancePlan> content = planMapper.findByDeletedFalse(offset, limit);
        int total = planMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public LegalCompliancePlan findById(Long id) {
        LegalCompliancePlan plan = planMapper.findById(id);
        if (plan == null) throw new ResourceNotFoundException("LegalCompliancePlan", "id", id);
        return plan;
    }

    @Transactional(readOnly = true)
    public Page<LegalCompliancePlan> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<LegalCompliancePlan> content = planMapper.findByStatus(status, offset, limit);
        int total = planMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public LegalCompliancePlan create(LegalCompliancePlan plan) {
        String newId = generatePlanId();
        plan.setPlanId(newId);
        plan.setAuditType("LEGAL_COMPLIANCE");
        if (plan.getStatus() == null) plan.setStatus("PLAN");
        plan.setDeleted(false);
        planMapper.insert(plan);
        Long snapshotId = checklistSnapshotService.snapshotIfNeeded(
                plan.getChecklistTemplateId(), OWNER_LC, plan.getId());
        if (snapshotId != null && !snapshotId.equals(plan.getChecklistTemplateId())) {
            plan.setChecklistTemplateId(snapshotId);
            planMapper.update(plan);
        }
        log.info("Created legal-compliance plan: {}", newId);
        return findById(plan.getId());
    }

    @Transactional
    public LegalCompliancePlan update(Long id, LegalCompliancePlan plan) {
        LegalCompliancePlan existing = planMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalCompliancePlan", "id", id);
        plan.setId(id);
        Long snapshotId = checklistSnapshotService.snapshotIfNeeded(
                plan.getChecklistTemplateId(), OWNER_LC, id);
        plan.setChecklistTemplateId(snapshotId);
        planMapper.update(plan);
        log.info("Updated legal-compliance plan: {}", existing.getPlanId());
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        LegalCompliancePlan existing = planMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalCompliancePlan", "id", id);
        planMapper.softDelete(id);
        checklistSnapshotService.deleteOwnerSnapshot(OWNER_LC, id);
        log.info("Soft deleted legal-compliance plan: {}", id);
    }

    @Transactional
    public LegalCompliancePlan submit(Long id) {
        LegalCompliancePlan existing = planMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalCompliancePlan", "id", id);
        planMapper.submitPlan(id);
        return findById(id);
    }

    @Transactional
    public LegalCompliancePlan approve(Long id, String username) {
        LegalCompliancePlan existing = planMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalCompliancePlan", "id", id);
        ensureCanApprovePlan(existing, username);

        planMapper.approvePlan(id, username);

        // 실시 자동 생성
        String execIdPrefix = "LC-" + LocalDate.now().getYear() + "-";
        int count = execMapper.countByAuditIdStartingWith(execIdPrefix);
        String execId = String.format("%s%03d", execIdPrefix, count + 1);

        LegalComplianceExec exec = LegalComplianceExec.builder()
                .auditId(execId)
                .planId(id)
                .auditName(existing.getAuditName())
                .auditType("LEGAL_COMPLIANCE")
                .targetDept(existing.getTargetDept())
                .auditorName(existing.getAuditorName())
                .auditorDept(existing.getAuditorDept())
                .auditStartDate(existing.getPlanStartDate())
                .auditEndDate(existing.getPlanEndDate())
                .planApprover(existing.getPlanApprover())
                .completionApprover(existing.getCompletionApprover())
                .createdBy(existing.getCreatedBy())
                .totalChecklist(0)
                .completedChecklist(0)
                .findingCount(0)
                .status("IN_PROGRESS")
                .deleted(false)
                .build();
        execMapper.insert(exec);
        log.info("Auto-created legal-compliance exec {} from approved plan {}", execId, existing.getPlanId());
        return findById(id);
    }

    @Transactional
    public LegalCompliancePlan reject(Long id, String username, String rejectReason) {
        LegalCompliancePlan existing = planMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalCompliancePlan", "id", id);
        ensureCanApprovePlan(existing, username);
        if (rejectReason == null || rejectReason.trim().isEmpty()) {
            throw new IllegalArgumentException("반려 사유는 필수 입력입니다.");
        }
        planMapper.rejectPlan(id, rejectReason);
        return findById(id);
    }

    private void ensureCanApprovePlan(LegalCompliancePlan plan, String username) {
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
        String prefix = "LC-PL-" + LocalDate.now().getYear() + "-";
        int count = planMapper.countByPlanIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
