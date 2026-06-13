package com.smartehs.dto.response;

import com.smartehs.model.RadHealth;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** RadHealth raw 엔티티 반환 대체 DTO. wire 100% 동일 유지. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RadHealthResponse {
    private Long id;
    private String employeeNo;
    private String workerName;
    private String dept;
    private String examType;
    private LocalDate examDate;
    private String examOrg;
    private String judgment;
    private String cbcWbc;
    private String lensCheck;
    private BigDecimal cumulativeDose;
    private String afterAction;
    private LocalDate nextExamDate;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static RadHealthResponse from(RadHealth e) {
        return RadHealthResponse.builder()
                .id(e.getId())
                .employeeNo(e.getEmployeeNo())
                .workerName(e.getWorkerName())
                .dept(e.getDept())
                .examType(e.getExamType())
                .examDate(e.getExamDate())
                .examOrg(e.getExamOrg())
                .judgment(e.getJudgment())
                .cbcWbc(e.getCbcWbc())
                .lensCheck(e.getLensCheck())
                .cumulativeDose(e.getCumulativeDose())
                .afterAction(e.getAfterAction())
                .nextExamDate(e.getNextExamDate())
                .deleted(e.getDeleted())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
