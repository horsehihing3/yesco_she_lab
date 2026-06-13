package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/** 계정 전환(impersonation) 요청 — 전환 대상 사용자(UID). */
@Getter
@Setter
public class ImpersonateRequest {
    @NotBlank
    private String username;
}
