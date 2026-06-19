package com.smartehs.dto.request;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeIssueRequest {
    private LocalDate issueDate;
    private String workerName;
    private String empId;
    private String department;
    private Long itemId;
    private String itemName;
    private Integer quantity;
    private String issueReason;
    private LocalDate returnDate;
    private String status;
    private Boolean signed;
    private String signatureImage;
    private String note;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
}
