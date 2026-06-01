package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdFitness {
    private Long id;
    private String workerName;
    private String dept;
    private String disease;
    private LocalDate evalDate;
    private String evalOrg;
    private String evalResult;
    private String recommendation;
    private String doneStatus;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
