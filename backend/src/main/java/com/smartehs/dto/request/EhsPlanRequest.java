package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EhsPlanRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String planDetail;

    private String planCompany;

    private String planCategory;

    private LocalDate planDate;

    private LocalDate planEndDate;

    private Boolean isAutoRegistration;

    private String authorEmail;

    private String recipients;
}
