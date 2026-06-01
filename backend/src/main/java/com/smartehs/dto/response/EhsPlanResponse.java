package com.smartehs.dto.response;

import com.smartehs.model.EhsPlan;
import com.smartehs.util.MultiLanguageUtil;
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
public class EhsPlanResponse {

    private Long id;
    private String title;
    private String titleEn;
    private String titleZh;
    private String planDetail;
    private String planDetailEn;
    private String planDetailZh;
    private String planCompany;
    private String planCategory;
    private LocalDate planDate;
    private LocalDate planEndDate;
    private Boolean isAutoRegistration;
    private String authorEmail;
    private String recipients;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static EhsPlanResponse from(EhsPlan entity) {
        return EhsPlanResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .titleEn(entity.getTitleEn())
                .titleZh(entity.getTitleZh())
                .planDetail(entity.getPlanDetail())
                .planDetailEn(entity.getPlanDetailEn())
                .planDetailZh(entity.getPlanDetailZh())
                .planCompany(entity.getPlanCompany())
                .planCategory(entity.getPlanCategory())
                .planDate(entity.getPlanDate())
                .planEndDate(entity.getPlanEndDate())
                .isAutoRegistration(entity.getIsAutoRegistration())
                .authorEmail(entity.getAuthorEmail())
                .recipients(entity.getRecipients())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }

    public static EhsPlanResponse fromLocalized(EhsPlan entity) {
        return EhsPlanResponse.builder()
                .id(entity.getId())
                .title(MultiLanguageUtil.getLocalizedText(entity.getTitle(), entity.getTitleEn(), entity.getTitleZh()))
                .planDetail(MultiLanguageUtil.getLocalizedText(entity.getPlanDetail(), entity.getPlanDetailEn(), entity.getPlanDetailZh()))
                .planCompany(entity.getPlanCompany())
                .planCategory(entity.getPlanCategory())
                .planDate(entity.getPlanDate())
                .planEndDate(entity.getPlanEndDate())
                .isAutoRegistration(entity.getIsAutoRegistration())
                .authorEmail(entity.getAuthorEmail())
                .recipients(entity.getRecipients())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
