package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyHazardItem {
    private Long id;
    private Long formId;
    private String processActivity;   // 공정/활동 그룹 헤더
    // 기계·기구 및 설비
    private String machineName;
    private Integer machineQty;
    // 유해화학물질
    private String chemicalName;
    private String chemicalQty;
    private String exposureTime;
    // 근로자 구성 및 경력특성 1~6
    private Boolean workerComp1;
    private Boolean workerComp2;
    private Boolean workerComp3;
    private Boolean workerComp4;
    private Boolean workerComp5;
    private Boolean workerComp6;
    // 교대작업 유무 및 형태 1~3
    private Boolean shiftWork1;
    private Boolean shiftWork2;
    private Boolean shiftWork3;
    // 중량물 취급 1~3
    private Boolean heavyLoad1;
    private Boolean heavyLoad2;
    private Boolean heavyLoad3;
    // 허가작업/특별교육
    private String permitWork;
    private String specialTraining;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
