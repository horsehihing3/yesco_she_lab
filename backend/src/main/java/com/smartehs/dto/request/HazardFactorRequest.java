package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HazardFactorRequest {
    @NotBlank(message = "Hazard type is required")
    private String hazardType;

    @NotBlank(message = "Factor name is required")
    private String factorName;

    private String category;
    private String process;
    private String riskLevel;

    // 측정/평가 관련
    private String measuredValue;
    private String exposureStandard;
    private String assessmentMethod;
    private String assessmentScore;

    // 화학적 전용
    private String casNumber;

    // 생물학적 전용
    private String exposureRoute;
    private String vaccinationStatus;

    // 심리사회적 전용
    private String targetGroup;
    private Integer targetCount;
    private Integer highRiskCount;

    // 예방조치
    private String preventionStatus;
    private String preventionDetail;
    private Integer preventionRate;

    // 공통
    private LocalDate lastCheckDate;
    private String managerName;
    private String managerDept;
    private String remarks;
}
