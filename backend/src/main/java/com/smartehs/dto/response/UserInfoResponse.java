package com.smartehs.dto.response;

import com.smartehs.model.IdmUser;
import com.smartehs.model.User;
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
    private String company;
    private String role;

    public static UserInfoResponse from(User user) {
        return UserInfoResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .name(user.getName())
                .department(user.getDepartment())
                .company(user.getCompany())
                .role(user.getRole())
                .build();
    }

    public static UserInfoResponse fromIdmUser(IdmUser user) {
        return UserInfoResponse.builder()
                .id(user.getUidNumber())
                .username(user.getUid())
                .email(user.getEmail())
                .name(user.getUserName())
                .department(user.getDeptCode())
                .company(user.getCompanyCode())
                .role(user.getUserRole() != null ? user.getUserRole() : "TEAM_MEMBER")
                .build();
    }
}
