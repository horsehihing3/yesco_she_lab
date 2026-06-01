package com.smartehs.dto.response;

import com.smartehs.model.EhsManager;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsManagerResponse {

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
    private LocalDateTime createdAt;

    public static EhsManagerResponse from(EhsManager entity) {
        return EhsManagerResponse.builder()
                .id(entity.getId())
                .roleCategory(entity.getRoleCategory())
                .roleDetail(entity.getRoleDetail())
                .rolePlace(entity.getRolePlace())
                .roleIdx(entity.getRoleIdx())
                .userName(entity.getUserName())
                .userMail(entity.getUserMail())
                .userDept(entity.getUserDept())
                .userCompany(entity.getUserCompany())
                .roleCaHd(entity.getRoleCaHd())
                .roleCaField(entity.getRoleCaField())
                .roleCaTeam(entity.getRoleCaTeam())
                .isAdmin(entity.getIsAdmin())
                .active(entity.getActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
