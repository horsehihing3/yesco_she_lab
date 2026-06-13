package com.smartehs.dto.response;

import com.smartehs.model.RadDose;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** RadDose raw 엔티티 반환 대체 DTO. wire 100% 동일 유지. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RadDoseResponse {
    private Long id;
    private Long workerId;
    private String workerName;
    private String dept;
    private String measureMonth;
    private String dosimeterType;
    private BigDecimal effectiveDose;
    private BigDecimal handDose;
    private BigDecimal lensDose;
    private String measureOrg;
    private String confirmNo;
    private String note;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static RadDoseResponse from(RadDose e) {
        return RadDoseResponse.builder()
                .id(e.getId())
                .workerId(e.getWorkerId())
                .workerName(e.getWorkerName())
                .dept(e.getDept())
                .measureMonth(e.getMeasureMonth())
                .dosimeterType(e.getDosimeterType())
                .effectiveDose(e.getEffectiveDose())
                .handDose(e.getHandDose())
                .lensDose(e.getLensDose())
                .measureOrg(e.getMeasureOrg())
                .confirmNo(e.getConfirmNo())
                .note(e.getNote())
                .deleted(e.getDeleted())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
