package com.smartehs.dto.response;

import com.smartehs.model.EhsMessage;
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
public class EhsMessageResponse {

    private Long id;
    private String messageId;
    private String title;
    private String titleEn;
    private String titleZh;
    private String category;
    private String subCategory;
    private String recipient;
    private String recipientGroup;
    private String referrer;
    private String detail;
    private String detailEn;
    private String detailZh;
    private String authorName;
    private String authorPosition;
    private String authorRole;
    private String authorEmail;
    private String authorDept;
    private String authorCompany;
    private Integer views;
    private LocalDateTime sendDate;
    private Boolean entireOrNot;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static EhsMessageResponse from(EhsMessage entity) {
        return EhsMessageResponse.builder()
                .id(entity.getId())
                .messageId(entity.getMessageId())
                .title(entity.getTitle())
                .titleEn(entity.getTitleEn())
                .titleZh(entity.getTitleZh())
                .category(entity.getCategory())
                .subCategory(entity.getSubCategory())
                .recipient(entity.getRecipient())
                .recipientGroup(entity.getRecipientGroup())
                .referrer(entity.getReferrer())
                .detail(entity.getDetail())
                .detailEn(entity.getDetailEn())
                .detailZh(entity.getDetailZh())
                .authorName(entity.getAuthorName())
                .authorPosition(entity.getAuthorPosition())
                .authorRole(entity.getAuthorRole())
                .authorEmail(entity.getAuthorEmail())
                .authorDept(entity.getAuthorDept())
                .authorCompany(entity.getAuthorCompany())
                .views(entity.getViews())
                .sendDate(entity.getSendDate())
                .entireOrNot(entity.getEntireOrNot())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }

    public static EhsMessageResponse fromLocalized(EhsMessage entity) {
        return EhsMessageResponse.builder()
                .id(entity.getId())
                .messageId(entity.getMessageId())
                .title(MultiLanguageUtil.getLocalizedText(entity.getTitle(), entity.getTitleEn(), entity.getTitleZh()))
                .category(entity.getCategory())
                .subCategory(entity.getSubCategory())
                .recipient(entity.getRecipient())
                .recipientGroup(entity.getRecipientGroup())
                .referrer(entity.getReferrer())
                .detail(MultiLanguageUtil.getLocalizedText(entity.getDetail(), entity.getDetailEn(), entity.getDetailZh()))
                .authorName(entity.getAuthorName())
                .authorPosition(entity.getAuthorPosition())
                .authorRole(entity.getAuthorRole())
                .authorEmail(entity.getAuthorEmail())
                .authorDept(entity.getAuthorDept())
                .authorCompany(entity.getAuthorCompany())
                .views(entity.getViews())
                .sendDate(entity.getSendDate())
                .entireOrNot(entity.getEntireOrNot())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
