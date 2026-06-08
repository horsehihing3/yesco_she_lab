package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QnaPost {
    private Long id;
    private String title;
    private String content;
    private String category;
    private String authorName;
    private String authorDept;
    private String authorPosition;
    private String authorEmail;
    private Integer views;
    private Boolean isAnswered;
    private String answer;
    private String answerAuthorName;
    private String answerAuthorDept;
    private LocalDateTime answerDate;
    private Boolean isPublic;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
