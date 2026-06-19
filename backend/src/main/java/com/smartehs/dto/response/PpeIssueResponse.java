package com.smartehs.dto.response;

import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeIssue;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeIssueResponse {
    private Long id;
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

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static PpeIssueResponse from(PpeIssue e) {
        return PpeIssueResponse.builder()
                .id(e.getId())
                .issueDate(e.getIssueDate())
                .workerName(e.getWorkerName())
                .empId(e.getEmpId())
                .department(e.getDepartment())
                .itemId(e.getItemId())
                .itemName(e.getItemName())
                .quantity(e.getQuantity())
                .issueReason(e.getIssueReason())
                .returnDate(e.getReturnDate())
                .status(e.getStatus())
                .signed(e.getSigned())
                .signatureImage(e.getSignatureImage())
                .note(e.getNote())
                .createdByUserId(PersonRef.userId(e.getCreatedBy()))
                .createdByName(PersonRef.name(e.getCreatedBy()))
                .createdByTeam(PersonRef.team(e.getCreatedBy()))
                .createdByPosition(PersonRef.position(e.getCreatedBy()))
                .modifiedByUserId(PersonRef.userId(e.getModifiedBy()))
                .modifiedByName(PersonRef.name(e.getModifiedBy()))
                .modifiedByTeam(PersonRef.team(e.getModifiedBy()))
                .modifiedByPosition(PersonRef.position(e.getModifiedBy()))
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
