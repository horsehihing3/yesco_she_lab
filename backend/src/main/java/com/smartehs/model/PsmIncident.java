package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsmIncident {
    private Long id;
    private String incidentNo;
    private String incidentType;
    private LocalDateTime occurAt;
    private String location;
    private String relatedEquipment;
    private String relatedMaterial;
    private String firstFinder;
    private String reporter;
    private String investigator;
    private LocalDateTime reportedAt;
    private String narrative;
    private String severity;
    private String humanFactorsJson;
    private String technicalFactorsJson;
    private String why1;
    private String why2;
    private String why3;
    private String why4;
    private String why5;
    private String managementCause;
    private Integer deaths;
    private Integer seriousInjuries;
    private Integer minorInjuries;
    private String injuryType;
    private String damagedEquipment;
    private BigDecimal propertyLoss;
    private BigDecimal productionLoss;
    private BigDecimal downtimeHours;
    private String envImpact;
    private LocalDate recoveryDate;
    private String actionsJson;
    private String technicalAction;
    private String managerialAction;
    private String similarCheckPlan;
    private String psmImprovement;
    private String status;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
