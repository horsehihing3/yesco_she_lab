package com.smartehs.dto.response;

import com.smartehs.model.AccidentClaimDoc;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * AccidentClaimDoc raw 엔티티 반환 대체 DTO.
 * wire(JSON) 는 raw 모델과 100% 동일 유지 — 프론트 무변경.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccidentClaimDocResponse {
    private Long id;
    private Long claimId;
    private String docType;
    private String docName;
    private Boolean isRequired;
    private Boolean isSubmitted;
    private Long fileId;
    private String notes;
    private LocalDateTime createdAt;

    public static AccidentClaimDocResponse from(AccidentClaimDoc e) {
        return AccidentClaimDocResponse.builder()
                .id(e.getId())
                .claimId(e.getClaimId())
                .docType(e.getDocType())
                .docName(e.getDocName())
                .isRequired(e.getIsRequired())
                .isSubmitted(e.getIsSubmitted())
                .fileId(e.getFileId())
                .notes(e.getNotes())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
