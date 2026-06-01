package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OSHCommittee {
    private Long id;
    private String oshId;
    private LocalDateTime oshDate;
    private Integer oshYear;
    private Integer oshQuarter;
    private String oshLocation;
    private String oshLocationDetail;
    private Integer attendeeCount;
    private String mainAgenda;
    private String comment;
    private Boolean isFileCreated;
    private String authorName;
    private String authorMail;
    private String authorDept;
    private String authorCompany;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
