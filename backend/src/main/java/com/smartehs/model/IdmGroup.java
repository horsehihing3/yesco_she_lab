package com.smartehs.model;

import lombok.Data;

@Data
public class IdmGroup {
    private String companyCode;
    private String groupCode;
    private String upperGroupCode;
    private String groupName;
    private Integer groupLevel;
    private String groupStatus;
}
