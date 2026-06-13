package com.smartehs.dto.response;

import com.smartehs.model.RadSource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** RadSource raw 엔티티 반환 대체 DTO. wire 100% 동일 유지. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RadSourceResponse {
    private Long id;
    private String mgmtNo;
    private String name;
    private String sourceType;
    private String isotope;
    private String activity;
    private String maker;
    private String location;
    private String permitNo;
    private LocalDate permitDate;
    private LocalDate expireDate;
    private String status;
    private String ownerName;
    private String makerNo;
    private String note;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static RadSourceResponse from(RadSource e) {
        return RadSourceResponse.builder()
                .id(e.getId())
                .mgmtNo(e.getMgmtNo())
                .name(e.getName())
                .sourceType(e.getSourceType())
                .isotope(e.getIsotope())
                .activity(e.getActivity())
                .maker(e.getMaker())
                .location(e.getLocation())
                .permitNo(e.getPermitNo())
                .permitDate(e.getPermitDate())
                .expireDate(e.getExpireDate())
                .status(e.getStatus())
                .ownerName(e.getOwnerName())
                .makerNo(e.getMakerNo())
                .note(e.getNote())
                .deleted(e.getDeleted())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
