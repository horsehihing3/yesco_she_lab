package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EhsAlertRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String detail;

    private String authorName;

    private String authorDept;

    private String authorEmail;

    private String authorCompany;

    private Boolean isAutoRegistration;

    // Source language for translation (ko, en, zh)
    private String sourceLang;
}
