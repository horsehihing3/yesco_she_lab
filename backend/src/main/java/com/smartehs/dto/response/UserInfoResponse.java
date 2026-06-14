package com.smartehs.dto.response;

import com.smartehs.model.IdmUser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInfoResponse {

    private Long id;
    private String username;
    private String email;
    private String name;
    private String department;
    private String deptCode;
    private String company;
    private String role;
    private String position;
    private Boolean active;

    public static UserInfoResponse fromIdmUser(IdmUser user) {
        return UserInfoResponse.builder()
                .id(user.getUidNumber())
                .username(user.getUid())
                .email(user.getEmail())
                .name(user.getUserName())
                .department(user.getGroupName() != null ? user.getGroupName() : user.getDeptCode())
                .deptCode(user.getDeptCode())
                .company(user.getCompanyCode())
                .role(user.getUserRole() != null ? user.getUserRole() : "TEAM_MEMBER")
                .position(user.getTitleName())
                // T_IDM_USER.UserStatus '10' = 정상/활성 (관리자 조회·DEV계정 기준과 동일)
                .active("10".equals(user.getUserStatus()))
                .build();
    }
}
