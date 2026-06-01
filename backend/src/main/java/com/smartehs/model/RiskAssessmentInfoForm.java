package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentInfoForm {
    private Long id;
    private String riskId;
    private String title;
    private LocalDateTime completeDate;
    private String categoryNum;
    private String regularOrOccasional;
    private String site;
    private String authorName;
    private String authorMail;
    private String authorDept;
    private String authorCompany;
    private String approval;
    private String approvalMail;
    private String comment;
    private String occManagerMail;
    private String status;
    private Boolean allowResubmit;
    private String rejectReason;
    private Integer riskCnt;
    private Integer cntOff;
    private Integer cntVis;
    private Integer cntCow;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
