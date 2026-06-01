package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EhsManagerRequest {

    @NotBlank(message = "Role category is required")
    private String roleCategory;

    private String roleDetail;

    private String rolePlace;

    private String roleIdx;

    @NotBlank(message = "User name is required")
    private String userName;

    private String userMail;

    private String userDept;

    private String userCompany;

    private String roleCaHd;

    private String roleCaField;

    private String roleCaTeam;

    private Boolean isAdmin;

    private Boolean active;
}
