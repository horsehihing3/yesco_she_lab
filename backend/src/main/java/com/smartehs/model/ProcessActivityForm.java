package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessActivityForm {
    private Long id;
    private String title;
    private String description;
    private String divisionName;
    private String departmentName;
    private String evaluator;
    private LocalDate creationDate;
    private String teamMembers;
    // 작성자 (로그인 사용자 자동 입력)
    private Long createdByUserId;
    private String createdByName;
    // 수정자 (수정 시 자동 갱신)
    private Long modifiedByUserId;
    private String modifiedByName;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
