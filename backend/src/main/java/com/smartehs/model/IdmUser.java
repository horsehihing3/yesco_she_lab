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
    // T_IDM_GROUP JOIN으로 조회되는 부서명 (DeptCode → GroupName)
    private String groupName;
    // T_IDM_HRCODE JOIN으로 조회되는 직위명 (TitleCode → Name)
    private String titleName;
}
