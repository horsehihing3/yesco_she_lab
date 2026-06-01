package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EhsAlertComment {
    private Long id;
    private Long alertId;
    private Long parentId;          // null → 최상위 댓글
    private String content;
    private String authorName;
    private String authorDept;
    private String authorEmail;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
