package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalPermit {
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
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
