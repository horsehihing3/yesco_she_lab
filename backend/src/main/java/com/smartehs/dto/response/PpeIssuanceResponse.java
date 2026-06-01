package com.smartehs.dto.response;

import com.smartehs.model.PpeIssuance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeIssuanceResponse {
    private Long id;
    private String issuanceId;
    private String employeeId;
    private String employeeName;
    private String employeeDept;
    private String employeeEmail;
    private Long workPlaceId;
    private String ppeType;
    private String ppeTypeEn;
    private String ppeTypeZh;
    private String ppeName;
    private String ppeModel;
    private Long ppeImageFileId;
    private Integer quantity;
    private LocalDate issuanceDate;
    private LocalDate expiryDate;
    private String hazardousFactor;
    private String issuanceReason;
    private Boolean receivedSignature;
    private LocalDateTime signatureDate;
    private String notes;
    private String authorName;
    private String authorEmail;
    private String authorDept;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static PpeIssuanceResponse from(PpeIssuance entity) {
        return PpeIssuanceResponse.builder()
                .id(entity.getId())
                .issuanceId(entity.getIssuanceId())
                .employeeId(entity.getEmployeeId())
                .employeeName(entity.getEmployeeName())
                .employeeDept(entity.getEmployeeDept())
                .employeeEmail(entity.getEmployeeEmail())
                .workPlaceId(entity.getWorkPlaceId())
                .ppeType(entity.getPpeType())
                .ppeTypeEn(entity.getPpeTypeEn())
                .ppeTypeZh(entity.getPpeTypeZh())
                .ppeName(entity.getPpeName())
                .ppeModel(entity.getPpeModel())
                .ppeImageFileId(entity.getPpeImageFileId())
                .quantity(entity.getQuantity())
                .issuanceDate(entity.getIssuanceDate())
                .expiryDate(entity.getExpiryDate())
                .hazardousFactor(entity.getHazardousFactor())
                .issuanceReason(entity.getIssuanceReason())
                .receivedSignature(entity.getReceivedSignature())
                .signatureDate(entity.getSignatureDate())
                .notes(entity.getNotes())
                .authorName(entity.getAuthorName())
                .authorEmail(entity.getAuthorEmail())
                .authorDept(entity.getAuthorDept())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
