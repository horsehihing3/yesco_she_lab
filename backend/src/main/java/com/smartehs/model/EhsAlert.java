package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsAlert {
    private Long id;
    private String alertId;
    private String title;
    private String titleEn;
    private String titleZh;
    private String detail;
    private String detailEn;
    private String detailZh;
    private String authorName;
    private String authorDept;
    private String authorPosition;
    private String authorEmail;
    private String authorCompany;
    private Boolean isAutoRegistration;
    private Integer views;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
