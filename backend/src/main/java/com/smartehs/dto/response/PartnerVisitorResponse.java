package com.smartehs.dto.response;

import com.smartehs.model.PartnerVisitor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** PartnerVisitor raw 엔티티 반환 대체 DTO. wire 100% 동일 유지. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerVisitorResponse {
    private Long id;
    private LocalDateTime visitDt;
    private String visitorName;
    private String companyName;
    private String position;
    private String contact;
    private String purpose;
    private String area;
    private String education;
    private String ppe;
    private String checkInTime;
    private String checkOutTime;
    private String stayHours;
    private String mgrName;
    private String idNumber;
    private String status;
    private String note;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static PartnerVisitorResponse from(PartnerVisitor e) {
        return PartnerVisitorResponse.builder()
                .id(e.getId())
                .visitDt(e.getVisitDt())
                .visitorName(e.getVisitorName())
                .companyName(e.getCompanyName())
                .position(e.getPosition())
                .contact(e.getContact())
                .purpose(e.getPurpose())
                .area(e.getArea())
                .education(e.getEducation())
                .ppe(e.getPpe())
                .checkInTime(e.getCheckInTime())
                .checkOutTime(e.getCheckOutTime())
                .stayHours(e.getStayHours())
                .mgrName(e.getMgrName())
                .idNumber(e.getIdNumber())
                .status(e.getStatus())
                .note(e.getNote())
                .deleted(e.getDeleted())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
