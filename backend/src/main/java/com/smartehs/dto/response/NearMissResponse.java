package com.smartehs.dto.response;

import com.smartehs.model.NearMiss;
import com.smartehs.model.NearMissAction;
import com.smartehs.util.MultiLanguageUtil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NearMissResponse {

    private Long id;
    private String nearMissId;
    private String incidentType;
    private Long workPlaceId;
    private String workPlaceName;
    private String occTitle;
    private String occTitleEn;
    private String occTitleZh;
    private LocalDateTime occDate;
    private String occSite;
    private String occFloor;
    private String occSiteInfo;
    private Double occSiteX;
    private Double occSiteY;
    private Long occImageFileId;
    private String occInfo;
    private String occInfoEn;
    private String occInfoZh;
    private String company;
    private String authorName;
    private String authorEmail;
    private String authorDept;
    private Integer intensity;
    private Integer frequency;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private List<NearMissAction> actions;

    public static NearMissResponse from(NearMiss entity) {
        return NearMissResponse.builder()
                .id(entity.getId())
                .nearMissId(entity.getNearMissId())
                .incidentType(entity.getIncidentType())
                .workPlaceId(entity.getWorkPlaceId())
                .workPlaceName(entity.getWorkPlaceName())
                .occTitle(entity.getOccTitle())
                .occTitleEn(entity.getOccTitleEn())
                .occTitleZh(entity.getOccTitleZh())
                .occDate(entity.getOccDate())
                .occSite(entity.getOccSite())
                .occFloor(entity.getOccFloor())
                .occSiteInfo(entity.getOccSiteInfo())
                .occSiteX(entity.getOccSiteX())
                .occSiteY(entity.getOccSiteY())
                .occImageFileId(entity.getOccImageFileId())
                .occInfo(entity.getOccInfo())
                .occInfoEn(entity.getOccInfoEn())
                .occInfoZh(entity.getOccInfoZh())
                .company(entity.getCompany())
                .authorName(entity.getAuthorName())
                .authorEmail(entity.getAuthorEmail())
                .authorDept(entity.getAuthorDept())
                .intensity(entity.getIntensity())
                .frequency(entity.getFrequency())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }

    public static NearMissResponse fromLocalized(NearMiss entity) {
        return NearMissResponse.builder()
                .id(entity.getId())
                .nearMissId(entity.getNearMissId())
                .incidentType(entity.getIncidentType())
                .workPlaceId(entity.getWorkPlaceId())
                .workPlaceName(entity.getWorkPlaceName())
                .occTitle(MultiLanguageUtil.getLocalizedText(entity.getOccTitle(), entity.getOccTitleEn(), entity.getOccTitleZh()))
                .occDate(entity.getOccDate())
                .occSite(entity.getOccSite())
                .occFloor(entity.getOccFloor())
                .occSiteInfo(entity.getOccSiteInfo())
                .occSiteX(entity.getOccSiteX())
                .occSiteY(entity.getOccSiteY())
                .occImageFileId(entity.getOccImageFileId())
                .occInfo(MultiLanguageUtil.getLocalizedText(entity.getOccInfo(), entity.getOccInfoEn(), entity.getOccInfoZh()))
                .company(entity.getCompany())
                .authorName(entity.getAuthorName())
                .authorEmail(entity.getAuthorEmail())
                .authorDept(entity.getAuthorDept())
                .intensity(entity.getIntensity())
                .frequency(entity.getFrequency())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
