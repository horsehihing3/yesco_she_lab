package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SafetyWorkListRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String location;

    private LocalDate startDate;

    private LocalDate endDate;

    private String partners;

    private String partnersName;

    private String managerName;

    private String managerDept;

    private String approverName;

    private String approverMail;

    private String approverDept;

    private String status;

    private String authorName;

    private String authorMail;

    private String authorDept;

    private String authorCompany;
}
