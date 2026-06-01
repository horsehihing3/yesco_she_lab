package com.smartehs.dto.response;

import com.smartehs.model.SafetyWorkList;
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
public class SafetyWorkListResponse {

    private Long id;
    private String safetyWorkId;
    private String title;
    private String titleEn;
    private String titleZh;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private String partners;
    private String partnersName;
    private String managerName;
    private String managerDept;
    private String approverName;
    private String approverMail;
    private String approverDept;
    private LocalDate approveDate;
    private String status;
    private String rejectComment;
    private String rejectBy;
    private LocalDate rejectDate;
    private String authorName;
    private String authorMail;
    private String authorDept;
    private String authorCompany;
    private LocalDate completedDate;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static SafetyWorkListResponse from(SafetyWorkList entity) {
        return SafetyWorkListResponse.builder()
                .id(entity.getId())
                .safetyWorkId(entity.getSafetyWorkId())
                .title(entity.getTitle())
                .titleEn(entity.getTitleEn())
                .titleZh(entity.getTitleZh())
                .location(entity.getLocation())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .partners(entity.getPartners())
                .partnersName(entity.getPartnersName())
                .managerName(entity.getManagerName())
                .managerDept(entity.getManagerDept())
                .approverName(entity.getApproverName())
                .approverMail(entity.getApproverMail())
                .approverDept(entity.getApproverDept())
                .approveDate(entity.getApproveDate())
                .status(entity.getStatus())
                .rejectComment(entity.getRejectComment())
                .rejectBy(entity.getRejectBy())
                .rejectDate(entity.getRejectDate())
                .authorName(entity.getAuthorName())
                .authorMail(entity.getAuthorMail())
                .authorDept(entity.getAuthorDept())
                .authorCompany(entity.getAuthorCompany())
                .completedDate(entity.getCompletedDate())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }

    public static SafetyWorkListResponse fromLocalized(SafetyWorkList entity) {
        return SafetyWorkListResponse.builder()
                .id(entity.getId())
                .safetyWorkId(entity.getSafetyWorkId())
                .title(MultiLanguageUtil.getLocalizedText(entity.getTitle(), entity.getTitleEn(), entity.getTitleZh()))
                .location(entity.getLocation())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .partners(entity.getPartners())
                .partnersName(entity.getPartnersName())
                .managerName(entity.getManagerName())
                .managerDept(entity.getManagerDept())
                .approverName(entity.getApproverName())
                .approverMail(entity.getApproverMail())
                .approverDept(entity.getApproverDept())
                .approveDate(entity.getApproveDate())
                .status(entity.getStatus())
                .rejectComment(entity.getRejectComment())
                .rejectBy(entity.getRejectBy())
                .rejectDate(entity.getRejectDate())
                .authorName(entity.getAuthorName())
                .authorMail(entity.getAuthorMail())
                .authorDept(entity.getAuthorDept())
                .authorCompany(entity.getAuthorCompany())
                .completedDate(entity.getCompletedDate())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
