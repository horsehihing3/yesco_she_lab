package com.smartehs.dto.response;

import com.smartehs.model.QnaPost;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QnaPostResponse {
    private Long id;
    private String title;
    private String content;
    private String category;
    private String authorName;
    private String authorDept;
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

    public static QnaPostResponse from(QnaPost entity) {
        return QnaPostResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .category(entity.getCategory())
                .authorName(entity.getAuthorName())
                .authorDept(entity.getAuthorDept())
                .authorEmail(entity.getAuthorEmail())
                .views(entity.getViews())
                .isAnswered(entity.getIsAnswered())
                .answer(entity.getAnswer())
                .answerAuthorName(entity.getAnswerAuthorName())
                .answerAuthorDept(entity.getAnswerAuthorDept())
                .answerDate(entity.getAnswerDate())
                .isPublic(entity.getIsPublic())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
