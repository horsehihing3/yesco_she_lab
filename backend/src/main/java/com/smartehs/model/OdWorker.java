package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdWorker {
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
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
