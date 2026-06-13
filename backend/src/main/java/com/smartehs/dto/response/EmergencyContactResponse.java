package com.smartehs.dto.response;

import com.smartehs.model.EmergencyContact;
import com.smartehs.model.PersonRef;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * EmergencyContact raw 엔티티 반환 대체 DTO. (PersonRef 브릿지)
 * wire(JSON) 는 raw 모델과 100% 동일 유지 — 프론트 무변경.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyContactResponse {
    private Long id;
    private String contactId;
    private String organization;
    private String contactName;
    private String phoneNumber;
    private String email;
    private String contactType;
    private Boolean isEmergency;
    private Integer sortOrder;
    private String notes;
    private Boolean deleted;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static EmergencyContactResponse from(EmergencyContact e) {
        return EmergencyContactResponse.builder()
                .id(e.getId())
                .contactId(e.getContactId())
                .organization(e.getOrganization())
                .contactName(e.getContactName())
                .phoneNumber(e.getPhoneNumber())
                .email(e.getEmail())
                .contactType(e.getContactType())
                .isEmergency(e.getIsEmergency())
                .sortOrder(e.getSortOrder())
                .notes(e.getNotes())
                .deleted(e.getDeleted())
                .createdByUserId(PersonRef.userId(e.getCreatedBy()))
                .createdByName(PersonRef.name(e.getCreatedBy()))
                .createdByTeam(PersonRef.team(e.getCreatedBy()))
                .createdByPosition(PersonRef.position(e.getCreatedBy()))
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
