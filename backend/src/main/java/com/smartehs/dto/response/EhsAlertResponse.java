package com.smartehs.dto.response;

import com.smartehs.model.EhsAlert;
import com.smartehs.util.MultiLanguageUtil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsAlertResponse {

    private Long id;
    private String alertId;
    private String title;
    private String titleEn;
    private String titleZh;
    private String detail;
    private String detailEn;
    private String detailZh;
    private String authorName;
    private String authorDept;
    private String authorPosition;
    private String authorEmail;
    private String authorCompany;
    private Boolean isAutoRegistration;
    private Integer views;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    /**
     * Creates response with all language fields (for admin/edit purposes)
     */
    public static EhsAlertResponse from(EhsAlert entity) {
        return EhsAlertResponse.builder()
                .id(entity.getId())
                .alertId(entity.getAlertId())
                .title(entity.getTitle())
                .titleEn(entity.getTitleEn())
                .titleZh(entity.getTitleZh())
                .detail(entity.getDetail())
                .detailEn(entity.getDetailEn())
                .detailZh(entity.getDetailZh())
                .authorName(entity.getAuthorName())
                .authorDept(entity.getAuthorDept())
                .authorPosition(entity.getAuthorPosition())
                .authorEmail(entity.getAuthorEmail())
                .authorCompany(entity.getAuthorCompany())
                .isAutoRegistration(entity.getIsAutoRegistration())
                .views(entity.getViews())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }

    /**
     * Creates response with localized fields based on current language context
     */
    public static EhsAlertResponse fromLocalized(EhsAlert entity) {
        return EhsAlertResponse.builder()
                .id(entity.getId())
                .alertId(entity.getAlertId())
                .title(MultiLanguageUtil.getLocalizedText(entity.getTitle(), entity.getTitleEn(), entity.getTitleZh()))
                .detail(MultiLanguageUtil.getLocalizedText(entity.getDetail(), entity.getDetailEn(), entity.getDetailZh()))
                .authorName(entity.getAuthorName())
                .authorDept(entity.getAuthorDept())
                .authorPosition(entity.getAuthorPosition())
                .authorEmail(entity.getAuthorEmail())
                .authorCompany(entity.getAuthorCompany())
                .isAutoRegistration(entity.getIsAutoRegistration())
                .views(entity.getViews())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
