package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthCheckupRecord {
    private Long id;
    private String examDate;
    private String examPeriod;
    private String hospitalName;
    private String department;
    private String name;
    private Integer age;
    // 고혈압
    private Integer bpSystolic;
    private Integer bpDiastolic;
    private String bpMed;
    private String bpGrade;
    // 당뇨병
    private Integer bst;
    private String dmMed;
    private String dmGrade;
    // 이상지질혈증
    private Integer tc;
    private Integer tg;
    private Integer ldl;
    private Integer hdl;
    private String lipidMed;
    private String lipidGrade;
    // 기타
    private String followUp;
    private String workFitness;
    private String remark;
    private Long pdfFileId;
    // 메타
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
