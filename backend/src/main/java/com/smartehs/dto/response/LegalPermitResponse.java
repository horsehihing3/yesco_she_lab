package com.smartehs.dto.response;

import com.smartehs.model.LegalPermit;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalPermitResponse {
    private Long id;
    private String permitType;
    private String category;
    private String permitName;
    private String baseLaw;
    private String agency;
    private String permitNo;
    private LocalDate issueDate;
    private LocalDate expireDate;
    private String ownerName;
    private String renewalPeriod;
    private String conditions;
    private String icon;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static LegalPermitResponse from(LegalPermit e) {
        return LegalPermitResponse.builder()
                .id(e.getId())
                .permitType(e.getPermitType())
                .category(e.getCategory())
                .permitName(e.getPermitName())
                .baseLaw(e.getBaseLaw())
                .agency(e.getAgency())
                .permitNo(e.getPermitNo())
                .issueDate(e.getIssueDate())
                .expireDate(e.getExpireDate())
                .ownerName(e.getOwnerName())
                .renewalPeriod(e.getRenewalPeriod())
                .conditions(e.getConditions())
                .icon(e.getIcon())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
