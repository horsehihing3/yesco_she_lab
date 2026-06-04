package com.smartehs.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ButtonRule {
    private Long id;
    private String menuPath;
    private String statusCode;
    private String buttonName;
    private String roleKey;
    private boolean visible;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
