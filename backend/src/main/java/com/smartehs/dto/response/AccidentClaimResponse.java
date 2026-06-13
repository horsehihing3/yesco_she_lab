package com.smartehs.dto.response;

import com.smartehs.model.AccidentClaim;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * AccidentClaim raw 엔티티 반환 대체 DTO. (PersonRef 없음 — createdBy 는 문자열)
 * wire(JSON) 는 raw 모델과 100% 동일 유지 — 프론트 무변경.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccidentClaimResponse {
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

    public static AccidentClaimResponse from(AccidentClaim e) {
        return AccidentClaimResponse.builder()
                .id(e.getId())
                .claimId(e.getClaimId())
                .status(e.getStatus())
                .workerName(e.getWorkerName())
                .workerSsn(e.getWorkerSsn())
                .workerPhone(e.getWorkerPhone())
                .workerAddress(e.getWorkerAddress())
                .workerJobType(e.getWorkerJobType())
                .workerJoinDate(e.getWorkerJoinDate())
                .workerDept(e.getWorkerDept())
                .companyName(e.getCompanyName())
                .companyRepName(e.getCompanyRepName())
                .companyBizNo(e.getCompanyBizNo())
                .companyAddress(e.getCompanyAddress())
                .companyPhone(e.getCompanyPhone())
                .companyIndustry(e.getCompanyIndustry())
                .companyWorkersCount(e.getCompanyWorkersCount())
                .diseaseName(e.getDiseaseName())
                .diseaseCode(e.getDiseaseCode())
                .onsetDate(e.getOnsetDate())
                .diagnosisDate(e.getDiagnosisDate())
                .exposurePeriod(e.getExposurePeriod())
                .exposureFactor(e.getExposureFactor())
                .workHistory(e.getWorkHistory())
                .hospitalName(e.getHospitalName())
                .hospitalDept(e.getHospitalDept())
                .treatmentStartDate(e.getTreatmentStartDate())
                .treatmentEndDate(e.getTreatmentEndDate())
                .treatmentType(e.getTreatmentType())
                .applicantName(e.getApplicantName())
                .applicantRelation(e.getApplicantRelation())
                .applyDate(e.getApplyDate())
                .notes(e.getNotes())
                .deleted(e.getDeleted())
                .createdBy(e.getCreatedBy())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
