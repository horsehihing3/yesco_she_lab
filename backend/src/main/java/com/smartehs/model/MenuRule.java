package com.smartehs.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MenuRule {
    private Long id;
    private String roleKey;
    private String menuKey;
    private LocalDateTime createdAt;
}
