package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FireDrill {
    private Long id;
    private LocalDate drillDate;
    private String drillType;
    private String scenario;
    private Integer participants;
    private String evacTime;
    private String mgrName;
    private String fireDeptObs;
    private String result;
    private String improvement;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
