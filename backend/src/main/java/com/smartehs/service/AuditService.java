package com.smartehs.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.AuditMapper;
import com.smartehs.mapper.AuditLogMapper;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.Audit;
import com.smartehs.model.AuditLog;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final AuditMapper auditMapper;
    private final AuditLogMapper auditLogMapper;
    private final IdmMapper idmMapper;

    private static final Set<String> ADMIN_ROLES = Set.of("SYSTEM_ADMIN", "EHS_ADMIN", "AUDIT_ADMIN");

    @Transactional(readOnly = true)
    public Page<Audit> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<Audit> content = auditMapper.findByDeletedFalse(offset, limit);
        int total = auditMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * 모든 audit 의 체크리스트 카운트(finding 포함) 를 plan→template 현재 항목으로 재계산.
     * 부적합 사항 탭 진입 시 호출 → 누락된 finding_count 갱신.
     */
    @Transactional
    public int recalcAllChecklistCounts() {
        int affected = auditMapper.recalcAllChecklistCounts();
        log.info("Recalculated checklist counts for {} audits", affected);
        return affected;
    }

    @Transactional(readOnly = true)
    public Audit findById(Long id) {
        Audit audit = auditMapper.findById(id);
        if (audit == null) {
            throw new ResourceNotFoundException("Audit", "id", id);
        }
        return audit;
    }

    @Transactional(readOnly = true)
    public Page<Audit> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<Audit> content = auditMapper.findByStatus(status, offset, limit);
        int total = auditMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public Audit create(Audit audit) {
        String newId = generateAuditId();
        audit.setAuditId(newId);
        if (audit.getStatus() == null) {
            audit.setStatus("IN_PROGRESS");
        }
        if (audit.getTotalChecklist() == null) {
            audit.setTotalChecklist(0);
        }
        if (audit.getCompletedChecklist() == null) {
            audit.setCompletedChecklist(0);
        }
        if (audit.getFindingCount() == null) {
            audit.setFindingCount(0);
        }
        audit.setDeleted(false);
        auditMapper.insert(audit);
        log.info("Created audit: {}", newId);
        return findById(audit.getId());
    }

    @Transactional
    public Audit update(Long id, Audit audit) {
        Audit existing = auditMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("Audit", "id", id);
        }
        audit.setId(id);
        String oldStatus = existing.getStatus();
        String newStatus = audit.getStatus();
        List<Map<String, Object>> diffs = computeFieldChanges(existing, audit);
        auditMapper.update(audit);

        if (newStatus != null && !newStatus.equals(oldStatus)) {
            auditLogMapper.insert(AuditLog.builder()
                    .auditId(id)
                    .action("STATUS_CHANGE")
                    .changedBy(audit.getModifiedBy())
                    .actorRole("EDITOR")
                    .detail(String.format("상태 변경: %s → %s", oldStatus, newStatus))
                    .build());
        }
        if (!diffs.isEmpty()) {
            auditLogMapper.insert(AuditLog.builder()
                    .auditId(id)
                    .action("FIELD_UPDATE")
                    .changedBy(audit.getModifiedBy())
                    .actorRole("EDITOR")
                    .detail(buildDiffSummary(diffs))
                    .fieldChanges(toJson(diffs))
                    .build());
        }
        log.info("Updated audit: {} (changedFields={})", existing.getAuditId(), diffs.size());
        return findById(id);
    }

    @Transactional
    public Audit updateGrade(Long id, String grade) {
        Audit existing = auditMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("Audit", "id", id);
        }
        auditMapper.updateGrade(id, grade);
        if (!Objects.equals(existing.getGrade(), grade)) {
            List<Map<String, Object>> diffs = new ArrayList<>();
            diffs.add(buildDiff("grade", existing.getGrade(), grade));
            auditLogMapper.insert(AuditLog.builder()
                    .auditId(id)
                    .action("FIELD_UPDATE")
                    .changedBy(existing.getModifiedBy())
                    .actorRole("EDITOR")
                    .detail(buildDiffSummary(diffs))
                    .fieldChanges(toJson(diffs))
                    .build());
        }
        log.info("Updated audit grade: {} -> {}", existing.getAuditId(), grade);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        Audit existing = auditMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("Audit", "id", id);
        }
        auditMapper.softDelete(id);
        log.info("Soft deleted audit with id: {}", id);
    }

    /**
     * 감사 완료 승인 (status = COMPLETED). 지정된 완료 승인자 또는 admin 만 가능.
     */
    @Transactional
    public Audit completeAudit(Long id, String username) {
        Audit existing = auditMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("Audit", "id", id);
        }
        ensureCanCompleteAudit(existing, username);
        auditMapper.completeAudit(id, username);
        log.info("Completed audit: {} by {}", existing.getAuditId(), username);
        return findById(id);
    }

    /**
     * 감사 완료 결재 반려 — status PENDING_CLOSE → IN_PROGRESS 로 되돌리며 사유 저장.
     */
    @Transactional
    public Audit rejectAudit(Long id, String username, String rejectReason) {
        Audit existing = auditMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("Audit", "id", id);
        }
        if (rejectReason == null || rejectReason.trim().isEmpty()) {
            throw new IllegalArgumentException("반려 사유는 필수 입력입니다.");
        }
        ensureCanCompleteAudit(existing, username);
        auditMapper.rejectAudit(id, rejectReason);
        log.info("Rejected audit completion: {} by {} reason={}", existing.getAuditId(), username, rejectReason);
        return findById(id);
    }

    private void ensureCanCompleteAudit(Audit audit, String username) {
        if (username == null || username.isEmpty() || "system".equals(username)) return;
        IdmUser u;
        try { u = idmMapper.findByUid(username); } catch (Exception e) { u = null; }
        if (u == null) throw new AccessDeniedException("승인 권한이 없습니다.");
        if (u.getUserRole() != null && ADMIN_ROLES.contains(u.getUserRole())) return;
        if (audit.getCompletionApproverUserId() != null && audit.getCompletionApproverUserId().equals(u.getUidNumber())) return;
        if (audit.getCompletionApproverName() != null
            && audit.getCompletionApproverName().equalsIgnoreCase(u.getUserName())) return;
        throw new AccessDeniedException("지정된 완료 승인자만 작업 완료 처리할 수 있습니다.");
    }

    private List<Map<String, Object>> computeFieldChanges(Audit before, Audit after) {
        List<Map<String, Object>> diffs = new ArrayList<>();
        addIfChanged(diffs, "auditName", before.getAuditName(), after.getAuditName());
        addIfChanged(diffs, "auditType", before.getAuditType(), after.getAuditType());
        addIfChanged(diffs, "targetDept", before.getTargetDept(), after.getTargetDept());
        addIfChanged(diffs, "targetSite", before.getTargetSite(), after.getTargetSite());
        addIfChanged(diffs, "auditorName", before.getAuditorName(), after.getAuditorName());
        addIfChanged(diffs, "auditorDept", before.getAuditorDept(), after.getAuditorDept());
        addIfChanged(diffs, "auditStartDate", before.getAuditStartDate(), after.getAuditStartDate());
        addIfChanged(diffs, "auditEndDate", before.getAuditEndDate(), after.getAuditEndDate());
        addIfChanged(diffs, "grade", before.getGrade(), after.getGrade());
        addIfChanged(diffs, "summary", before.getSummary(), after.getSummary());
        addIfChanged(diffs, "notes", before.getNotes(), after.getNotes());
        return diffs;
    }

    private void addIfChanged(List<Map<String, Object>> diffs, String field, Object before, Object after) {
        Object normBefore = normalizeBlank(before);
        Object normAfter = normalizeBlank(after);
        if (Objects.equals(normBefore, normAfter)) return;
        diffs.add(buildDiff(field, normBefore, normAfter));
    }

    private Object normalizeBlank(Object v) {
        if (v == null) return null;
        if (v instanceof String) {
            String s = ((String) v).trim();
            return s.isEmpty() ? null : s;
        }
        return v;
    }

    private Map<String, Object> buildDiff(String field, Object before, Object after) {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("field", field);
        entry.put("before", before == null ? null : before.toString());
        entry.put("after", after == null ? null : after.toString());
        return entry;
    }

    private String buildDiffSummary(List<Map<String, Object>> diffs) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < diffs.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(diffs.get(i).get("field"));
        }
        return sb.toString();
    }

    private String toJson(Object value) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize audit diff", e);
            return null;
        }
    }

    private String generateAuditId() {
        String prefix = "AUD-" + LocalDate.now().getYear() + "-";
        int count = auditMapper.countByAuditIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
