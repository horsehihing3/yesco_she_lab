package com.smartehs.dto.response;

import com.smartehs.model.OdWorker;
import com.smartehs.model.PersonRef;
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
public class OdWorkerResponse {
    private Long id;
    private String employeeNo;
    private String name;
    private String dept;
    private String job;
    private String gender;
    private LocalDate birthDate;
    private String division;
    private String factor;
    private String carcinogenicity;
    private String exposurePeriod;
    private String examOrg;
    private LocalDate examDate;
    private String judge;
    private String afterAction;
    private String actionDone;
    private Boolean deleted;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static OdWorkerResponse from(OdWorker e) {
        return OdWorkerResponse.builder()
                .id(e.getId())
                .employeeNo(e.getEmployeeNo())
                .name(e.getName())
                .dept(e.getDept())
                .job(e.getJob())
                .gender(e.getGender())
                .birthDate(e.getBirthDate())
                .division(e.getDivision())
                .factor(e.getFactor())
                .carcinogenicity(e.getCarcinogenicity())
                .exposurePeriod(e.getExposurePeriod())
                .examOrg(e.getExamOrg())
                .examDate(e.getExamDate())
                .judge(e.getJudge())
                .afterAction(e.getAfterAction())
                .actionDone(e.getActionDone())
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
