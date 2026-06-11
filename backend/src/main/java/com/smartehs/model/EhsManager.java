package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsManager {
    private Long id;
    private String roleCategory;
    private String roleDetail;
    private String rolePlace;
    private String roleIdx;
    private String userName;
    private String userMail;
    private String userDept;
    private String userCompany;
    private String roleCaHd;
    private String roleCaField;
    private String roleCaTeam;
    private Boolean isAdmin;
    private Boolean active;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private LocalDateTime createdAt;
}
