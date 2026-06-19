package com.smartehs.dto.response;

import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeItem;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeItemResponse {
    private Long id;
    private String itemCode;
    private String name;
    private String category;
    private String modelNo;
    private String kcCertNo;
    private String grade;
    private String supplier;
    private Integer unitPrice;
    private Integer replaceCycle;
    private LocalDate certExpiry;
    private Integer minStock;
    private String note;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static PpeItemResponse from(PpeItem e) {
        return PpeItemResponse.builder()
                .id(e.getId())
                .itemCode(e.getItemCode())
                .name(e.getName())
                .category(e.getCategory())
                .modelNo(e.getModelNo())
                .kcCertNo(e.getKcCertNo())
                .grade(e.getGrade())
                .supplier(e.getSupplier())
                .unitPrice(e.getUnitPrice())
                .replaceCycle(e.getReplaceCycle())
                .certExpiry(e.getCertExpiry())
                .minStock(e.getMinStock())
                .note(e.getNote())
                .createdByUserId(PersonRef.userId(e.getCreatedBy()))
                .createdByName(PersonRef.name(e.getCreatedBy()))
                .createdByTeam(PersonRef.team(e.getCreatedBy()))
                .createdByPosition(PersonRef.position(e.getCreatedBy()))
                .modifiedByUserId(PersonRef.userId(e.getModifiedBy()))
                .modifiedByName(PersonRef.name(e.getModifiedBy()))
                .modifiedByTeam(PersonRef.team(e.getModifiedBy()))
                .modifiedByPosition(PersonRef.position(e.getModifiedBy()))
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
