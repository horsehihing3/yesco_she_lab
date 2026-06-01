package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RadSource {
    private Long id;
    private String mgmtNo;
    private String name;
    private String sourceType;
    private String isotope;
    private String activity;
    private String maker;
    private String location;
    private String permitNo;
    private LocalDate permitDate;
    private LocalDate expireDate;
    private String status;
    private String ownerName;
    private String makerNo;
    private String note;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
