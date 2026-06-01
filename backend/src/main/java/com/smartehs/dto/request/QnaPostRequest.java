package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QnaPostRequest {
    @NotBlank(message = "Title is required")
    private String title;
    private String content;
    private String category;
    private String authorName;
    private String authorDept;
    private String authorEmail;
    private Boolean isPublic;
}
