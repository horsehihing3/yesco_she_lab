package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QnaPostComment {
    private Long id;
    private Long qnaId;
    private Long parentId;
    private String content;
    private String authorName;
    private String authorDept;
    private String authorEmail;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
