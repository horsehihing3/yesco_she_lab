package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EhsMessageRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String category;

    private String subCategory;

    private String recipient;

    private String recipientGroup;

    private String referrer;

    private String detail;

    private String authorName;

    private String authorRole;

    private String authorEmail;

    private String authorDept;

    private String authorPosition;

    private String authorCompany;

    private LocalDateTime sendDate;

    private Boolean entireOrNot;

    // Source language for translation (ko, en, zh)
    private String sourceLang;
}
