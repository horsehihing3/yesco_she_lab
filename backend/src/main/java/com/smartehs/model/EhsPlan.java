package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsPlan {
    private Long id;
    private String title;
    private String titleEn;
    private String titleZh;
    private String planDetail;
    private String planDetailEn;
    private String planDetailZh;
    private String planCompany;
    private String planCategory;
    private LocalDate planDate;
    private LocalDate planEndDate;
    private Boolean isAutoRegistration;
    private String authorEmail;
    private String recipients;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
