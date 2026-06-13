package com.smartehs.dto.response;

import com.smartehs.model.PartnerEval;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** PartnerEval raw 엔티티 반환 대체 DTO. wire 100% 동일 유지. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerEvalResponse {
    private Long id;
    private Long contractorRegistrationId;
    private String companyName;
    private String industry;
    private String mgrName;
    private String partnerMgr;
    private String contact;
    private LocalDate evalDate;
    private Integer scoreSafety;
    private Integer scoreHealth;
    private Integer scoreEnv;
    private Integer scoreMgmt;
    private Integer accidentCount;
    private LocalDate nextEvalDate;
    private String status;
    private String opinion;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static PartnerEvalResponse from(PartnerEval e) {
        return PartnerEvalResponse.builder()
                .id(e.getId())
                .contractorRegistrationId(e.getContractorRegistrationId())
                .companyName(e.getCompanyName())
                .industry(e.getIndustry())
                .mgrName(e.getMgrName())
                .partnerMgr(e.getPartnerMgr())
                .contact(e.getContact())
                .evalDate(e.getEvalDate())
                .scoreSafety(e.getScoreSafety())
                .scoreHealth(e.getScoreHealth())
                .scoreEnv(e.getScoreEnv())
                .scoreMgmt(e.getScoreMgmt())
                .accidentCount(e.getAccidentCount())
                .nextEvalDate(e.getNextEvalDate())
                .status(e.getStatus())
                .opinion(e.getOpinion())
                .deleted(e.getDeleted())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
