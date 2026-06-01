package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsMessage {
    private Long id;
    private String messageId;
    private String title;
    private String titleEn;
    private String titleZh;
    private String category;
    private String subCategory;
    private String recipient;
    private String recipientGroup;
    private String referrer;
    private String authorName;
    private String authorRole;
    private String authorEmail;
    private String authorDept;
    private String authorCompany;
    private Integer views;
    private LocalDateTime sendDate;
    private String detail;
    private String detailEn;
    private String detailZh;
    private Boolean entireOrNot;
    private Boolean isExist;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
