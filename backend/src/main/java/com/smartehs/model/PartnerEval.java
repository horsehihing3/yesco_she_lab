package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PartnerEval {
    private Long id;
    private Long contractorRegistrationId;   // tb_contractor_registration.id (선택 시 자동 매핑 출처)
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
}
