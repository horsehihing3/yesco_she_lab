package com.smartehs.service;

import com.smartehs.mapper.AuditLogMapper;
import com.smartehs.model.AuditLog;
import com.smartehs.model.AuditLogItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogMapper auditLogMapper;

    @Transactional
    public void log(Long auditId, String action, String changedBy, String detail) {
        log(AuditLog.builder()
                .auditId(auditId)
                .action(action)
                .changedBy(changedBy)
                .detail(detail)
                .build());
    }

    @Transactional
    public void log(AuditLog entry) {
        auditLogMapper.insert(entry);
        log.info("Audit log: auditId={}, action={}, by={}, role={}, approvalId={}",
                entry.getAuditId(), entry.getAction(), entry.getChangedBy(), entry.getActorRole(), entry.getApprovalId());
    }

    @Transactional
    public void logApprovalSubmit(Long auditId, String submittedBy, Long approvalId, String detail) {
        log(AuditLog.builder()
                .auditId(auditId)
                .action("APPROVAL_SUBMIT")
                .changedBy(submittedBy)
                .actorRole("SUBMITTER")
                .approvalId(approvalId)
                .detail(detail)
                .build());
    }

    @Transactional
    public void logApprovalApproved(Long auditId, String approvedBy, Long approvalId, String detail, boolean finalApproval) {
        log(AuditLog.builder()
                .auditId(auditId)
                .action(finalApproval ? "APPROVAL_COMPLETED" : "APPROVAL_APPROVED")
                .changedBy(approvedBy)
                .actorRole("APPROVER")
                .approvalId(approvalId)
                .detail(detail)
                .build());
    }

    @Transactional
    public void logApprovalRejected(Long auditId, String rejectedBy, Long approvalId, String rejectReason) {
        log(AuditLog.builder()
                .auditId(auditId)
                .action("APPROVAL_REJECTED")
                .changedBy(rejectedBy)
                .actorRole("REJECTOR")
                .approvalId(approvalId)
                .rejectReason(rejectReason)
                .detail(rejectReason)
                .build());
    }

    @Transactional(readOnly = true)
    public List<AuditLog> findByAuditId(Long auditId) {
        return auditLogMapper.findByAuditId(auditId);
    }

    @Transactional(readOnly = true)
    public List<AuditLogItem> findItemsByLogId(Long logId) {
        return auditLogMapper.findItemsByLogId(logId);
    }
}
