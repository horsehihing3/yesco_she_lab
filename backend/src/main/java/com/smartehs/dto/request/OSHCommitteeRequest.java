package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OSHCommitteeRequest {

    /** 프론트가 "yyyy-MM-dd" 형식으로 보내므로 LocalDate 로 받음 (Service 에서 LocalDateTime 변환) */
    private LocalDate oshDate;

    private Integer oshYear;

    private Integer oshQuarter;

    private String oshLocation;

    private String oshLocationDetail;

    private String mainAgenda;

    private String comment;

    private String authorName;

    private String authorMail;

    private String authorDept;

    private String authorCompany;
}
