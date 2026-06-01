package com.smartehs.model;

import lombok.Data;

@Data
public class IdmUser {
    private Long uidNumber;
    private String companyCode;
    private String deptCode;
    private String userName;
    private String email;
    private String uid;
    private String userStatus;
    private String objectCategory;
    private String password;
    private String userRole;
}
