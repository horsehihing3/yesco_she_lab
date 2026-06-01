package com.smartehs.dto.response;

import com.smartehs.model.PrePlacementExam;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrePlacementExamResponse {
    private Long id;
    private String examId;
    private String employeeId;
    private String employeeName;
    private String employeeDept;
    private String employeeEmail;
    private Long workPlaceId;
    private LocalDate examDate;
    private Integer examYear;
    private String targetJob;
    private String hazardousFactors;
    private String hospital;
    private String examResult;
    private String resultDetail;
    private String restrictionDetail;
    private Boolean followUpRequired;
    private LocalDate followUpDate;
    private String status;
    private String notes;
    private String authorName;
    private String authorEmail;
    private String authorDept;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static PrePlacementExamResponse from(PrePlacementExam entity) {
        return PrePlacementExamResponse.builder()
                .id(entity.getId())
                .examId(entity.getExamId())
                .employeeId(entity.getEmployeeId())
                .employeeName(entity.getEmployeeName())
                .employeeDept(entity.getEmployeeDept())
                .employeeEmail(entity.getEmployeeEmail())
                .workPlaceId(entity.getWorkPlaceId())
                .examDate(entity.getExamDate())
                .examYear(entity.getExamYear())
                .targetJob(entity.getTargetJob())
                .hazardousFactors(entity.getHazardousFactors())
                .hospital(entity.getHospital())
                .examResult(entity.getExamResult())
                .resultDetail(entity.getResultDetail())
                .restrictionDetail(entity.getRestrictionDetail())
                .followUpRequired(entity.getFollowUpRequired())
                .followUpDate(entity.getFollowUpDate())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .authorName(entity.getAuthorName())
                .authorEmail(entity.getAuthorEmail())
                .authorDept(entity.getAuthorDept())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
