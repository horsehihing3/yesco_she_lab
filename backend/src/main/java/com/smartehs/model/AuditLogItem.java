package com.smartehs.model;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogItem {
    private Long id;
    private Long logId;
    private String categoryName;
    private Integer itemNo;
    private String classification;
    private String checkItem;
    private String legalBasis;
    private String checkResult;
    private String finding;
    private String actionDeadline;
    private Boolean actionComplete;
}
