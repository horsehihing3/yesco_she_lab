package com.smartehs.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.LegalComplianceExecMapper;
import com.smartehs.mapper.LegalComplianceLogMapper;
import com.smartehs.mapper.UserMapper;
import com.smartehs.model.LegalComplianceExec;
import com.smartehs.model.LegalComplianceLog;
import com.smartehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

/** 법규 대응 실시 — AuditService 와 동일 흐름 (status 변경 로깅 포함). */
@Slf4j
@Service
@RequiredArgsConstructor
public class LegalComplianceExecService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final LegalComplianceExecMapper execMapper;
    private final LegalComplianceLogMapper logMapper;
    private final UserMapper userMapper;

    private static final Set<String> ADMIN_ROLES = Set.of("SYSTEM_ADMIN", "EHS_ADMIN", "AUDIT_ADMIN");

    @Transactional(readOnly = true)
    public Page<LegalComplianceExec> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<LegalComplianceExec> content = execMapper.findByDeletedFalse(offset, limit);
        int total = execMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public int recalcAllChecklistCounts() {
        int affected = execMapper.recalcAllChecklistCounts();
        log.info("LC: Recalculated checklist counts for {} execs", affected);
        return affected;
    }

    @Transactional(readOnly = true)
    public LegalComplianceExec findById(Long id) {
        LegalComplianceExec exec = execMapper.findById(id);
        if (exec == null) throw new ResourceNotFoundException("LegalComplianceExec", "id", id);
        return exec;
    }

    @Transactional(readOnly = true)
    public Page<LegalComplianceExec> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<LegalComplianceExec> content = execMapper.findByStatus(status, offset, limit);
        int total = execMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public LegalComplianceExec create(LegalComplianceExec exec) {
        String newId = generateExecId();
        exec.setAuditId(newId);
        exec.setAuditType("LEGAL_COMPLIANCE");
        if (exec.getStatus() == null) exec.setStatus("IN_PROGRESS");
        if (exec.getTotalChecklist() == null) exec.setTotalChecklist(0);
        if (exec.getCompletedChecklist() == null) exec.setCompletedChecklist(0);
        if (exec.getFindingCount() == null) exec.setFindingCount(0);
        exec.setDeleted(false);
        execMapper.insert(exec);
        return findById(exec.getId());
    }

    @Transactional
    public LegalComplianceExec update(Long id, LegalComplianceExec exec) {
        LegalComplianceExec existing = execMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalComplianceExec", "id", id);
        exec.setId(id);
        String oldStatus = existing.getStatus();
        String newStatus = exec.getStatus();
        List<Map<String, Object>> diffs = computeFieldChanges(existing, exec);
        execMapper.update(exec);

        if (newStatus != null && !newStatus.equals(oldStatus)) {
            logMapper.insert(LegalComplianceLog.builder()
                    .auditId(id).action("STATUS_CHANGE")
                    .changedBy(exec.getModifiedBy()).actorRole("EDITOR")
                    .detail(String.format("상태 변경: %s → %s", oldStatus, newStatus)).build());
        }
        if (!diffs.isEmpty()) {
            logMapper.insert(LegalComplianceLog.builder()
                    .auditId(id).action("FIELD_UPDATE")
                    .changedBy(exec.getModifiedBy()).actorRole("EDITOR")
                    .detail(buildDiffSummary(diffs)).fieldChanges(toJson(diffs)).build());
        }
        return findById(id);
    }

    @Transactional
    public LegalComplianceExec updateGrade(Long id, String grade) {
        LegalComplianceExec existing = execMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalComplianceExec", "id", id);
        execMapper.updateGrade(id, grade);
        if (!Objects.equals(existing.getGrade(), grade)) {
            List<Map<String, Object>> diffs = new ArrayList<>();
            diffs.add(buildDiff("grade", existing.getGrade(), grade));
            logMapper.insert(LegalComplianceLog.builder()
                    .auditId(id).action("FIELD_UPDATE").changedBy(existing.getModifiedBy()).actorRole("EDITOR")
                    .detail(buildDiffSummary(diffs)).fieldChanges(toJson(diffs)).build());
        }
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        LegalComplianceExec existing = execMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalComplianceExec", "id", id);
        execMapper.softDelete(id);
    }

    @Transactional
    public LegalComplianceExec completeExec(Long id, String username) {
        LegalComplianceExec existing = execMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalComplianceExec", "id", id);
        ensureCanCompleteExec(existing, username);
        execMapper.completeExec(id, username);
        return findById(id);
    }

    @Transactional
    public LegalComplianceExec rejectExec(Long id, String username, String rejectReason) {
        LegalComplianceExec existing = execMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalComplianceExec", "id", id);
        if (rejectReason == null || rejectReason.trim().isEmpty()) {
            throw new IllegalArgumentException("반려 사유는 필수 입력입니다.");
        }
        ensureCanCompleteExec(existing, username);
        execMapper.rejectExec(id, rejectReason);
        return findById(id);
    }

    private void ensureCanCompleteExec(LegalComplianceExec exec, String username) {
        if (username == null || username.isEmpty() || "system".equals(username)) return;
        User u;
        try { u = userMapper.findByUsername(username); } catch (Exception e) { u = null; }
        if (u == null) throw new AccessDeniedException("승인 권한이 없습니다.");
        if (u.getRole() != null && ADMIN_ROLES.contains(u.getRole())) return;
        if (exec.getCompletionApproverUserId() != null && exec.getCompletionApproverUserId().equals(u.getId())) return;
        if (exec.getCompletionApproverName() != null && exec.getCompletionApproverName().equalsIgnoreCase(u.getName())) return;
        throw new AccessDeniedException("지정된 완료 승인자만 작업 완료 처리할 수 있습니다.");
    }

    private List<Map<String, Object>> computeFieldChanges(LegalComplianceExec before, LegalComplianceExec after) {
        List<Map<String, Object>> diffs = new ArrayList<>();
        addIfChanged(diffs, "auditName", before.getAuditName(), after.getAuditName());
        addIfChanged(diffs, "targetDept", before.getTargetDept(), after.getTargetDept());
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
        Object nb = normalizeBlank(before); Object na = normalizeBlank(after);
        if (Objects.equals(nb, na)) return;
        diffs.add(buildDiff(field, nb, na));
    }

    private Object normalizeBlank(Object v) {
        if (v == null) return null;
        if (v instanceof String) { String s = ((String) v).trim(); return s.isEmpty() ? null : s; }
        return v;
    }

    private Map<String, Object> buildDiff(String field, Object before, Object after) {
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("field", field);
        e.put("before", before == null ? null : before.toString());
        e.put("after", after == null ? null : after.toString());
        return e;
    }

    private String buildDiffSummary(List<Map<String, Object>> diffs) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < diffs.size(); i++) { if (i > 0) sb.append(", "); sb.append(diffs.get(i).get("field")); }
        return sb.toString();
    }

    private String toJson(Object value) {
        try { return OBJECT_MAPPER.writeValueAsString(value); }
        catch (JsonProcessingException e) { return null; }
    }

    private String generateExecId() {
        String prefix = "LC-" + LocalDate.now().getYear() + "-";
        int count = execMapper.countByAuditIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
