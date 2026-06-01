package com.smartehs.service;

import com.smartehs.mapper.RiskAssessmentLogMapper;
import com.smartehs.model.RiskAssessmentLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RiskAssessmentLogService {

    private final RiskAssessmentLogMapper riskAssessmentLogMapper;

    @Transactional
    public void log(RiskAssessmentLog entry) {
        riskAssessmentLogMapper.insert(entry);
        log.info("RiskAssessment log: id={}, action={}, by={}, role={}",
                entry.getAssessmentId(), entry.getAction(), entry.getChangedBy(), entry.getActorRole());
    }

    @Transactional
    public void logFieldUpdate(Long assessmentId, String riskId, String changedBy, String detail, String fieldChangesJson) {
        log(RiskAssessmentLog.builder()
                .assessmentId(assessmentId)
                .riskId(riskId)
                .action("FIELD_UPDATE")
                .changedBy(changedBy)
                .actorRole("EDITOR")
                .detail(detail)
                .fieldChanges(fieldChangesJson)
                .build());
    }

    @Transactional
    public void logStatusChange(Long assessmentId, String riskId, String changedBy, String oldStatus, String newStatus, String rejectReason) {
        String action;
        String role;
        switch (newStatus == null ? "" : newStatus.toLowerCase()) {
            case "submitted": action = "APPROVAL_SUBMIT"; role = "SUBMITTER"; break;
            case "approved":  action = "APPROVAL_APPROVED"; role = "APPROVER"; break;
            case "rejected":  action = "APPROVAL_REJECTED"; role = "REJECTOR"; break;
            case "completed": action = "APPROVAL_COMPLETED"; role = "APPROVER"; break;
            default:          action = "STATUS_CHANGE"; role = "EDITOR"; break;
        }
        log(RiskAssessmentLog.builder()
                .assessmentId(assessmentId)
                .riskId(riskId)
                .action(action)
                .changedBy(changedBy)
                .actorRole(role)
                .detail(String.format("%s → %s", oldStatus, newStatus))
                .rejectReason("rejected".equalsIgnoreCase(newStatus) ? rejectReason : null)
                .build());
    }

    @Transactional
    public void logChecklistSave(Long assessmentId, String riskId, String changedBy, int itemCount) {
        log(RiskAssessmentLog.builder()
                .assessmentId(assessmentId)
                .riskId(riskId)
                .action("CHECKLIST_SAVE")
                .changedBy(changedBy)
                .actorRole("EDITOR")
                .detail(String.format("체크리스트 저장 (항목 %d건)", itemCount))
                .build());
    }

    @Transactional
    public void logActivityProcessSave(Long assessmentId, String riskId, String changedBy, int itemCount) {
        log(RiskAssessmentLog.builder()
                .assessmentId(assessmentId)
                .riskId(riskId)
                .action("ACTIVITY_PROCESS_SAVE")
                .changedBy(changedBy)
                .actorRole("EDITOR")
                .detail(String.format("활동공정 저장 (항목 %d건)", itemCount))
                .build());
    }

    @Transactional(readOnly = true)
    public List<RiskAssessmentLog> findByAssessmentId(Long assessmentId) {
        return riskAssessmentLogMapper.findByAssessmentId(assessmentId);
    }
}
