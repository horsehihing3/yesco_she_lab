package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentRequest {
    private Long formId;
    private String title;
    private String site;
    private Long authorUserId;
    private String authorName;
    private String authorTeam;
    private String authorPosition;
    private String authorDept;
    private String authorMail;
    private String approverName;
    private String approverMail;
    // 계획/완료 결재 분리
    private Long planApproverUserId;
    private String planApproverTeam;
    private String planApproverPosition;
    private String planApproverName;
    private Long completionApproverUserId;
    private String completionApproverTeam;
    private String completionApproverPosition;
    private String completionApproverName;
    // 사무업무 탭 Step 2/3/4 체크리스트 템플릿 연결
    private Long officeChecklistId;
    private Long sanupChecklistId;
    private Long jungdaeChecklistId;
}
