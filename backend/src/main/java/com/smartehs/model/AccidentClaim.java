package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccidentClaim {
    private Long id;
    private String claimId;
    private String status;

    // Worker info
    private String workerName;
    private String workerSsn;
    private String workerPhone;
    private String workerAddress;
    private String workerJobType;
    private LocalDate workerJoinDate;
    private String workerDept;

    // Company info
    private String companyName;
    private String companyRepName;
    private String companyBizNo;
    private String companyAddress;
    private String companyPhone;
    private String companyIndustry;
    private Integer companyWorkersCount;

    // Disease info
    private String diseaseName;
    private String diseaseCode;
    private LocalDate onsetDate;
    private LocalDate diagnosisDate;
    private String exposurePeriod;
    private String exposureFactor;
    private String workHistory;

    // Hospital info
    private String hospitalName;
    private String hospitalDept;
    private LocalDate treatmentStartDate;
    private LocalDate treatmentEndDate;
    private String treatmentType;

    // Applicant info
    private String applicantName;
    private String applicantRelation;
    private LocalDate applyDate;
    private String notes;

    // Meta
    private Boolean deleted;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
