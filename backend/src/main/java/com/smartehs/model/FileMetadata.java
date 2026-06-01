package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileMetadata {
    private Long id;
    private String originalFilename;
    private String storedFilename;
    private String filePath;
    private Long fileSize;
    private String contentType;
    private String entityType;
    private String entityId;
    private String uploadedBy;
    private LocalDateTime createdAt;
    private String language;            // ko, en, zh, or null (language-agnostic)
    private Long parentFileId;          // null for originals, set for translations
    private String translationStatus;   // PENDING, TRANSLATING, COMPLETED, FAILED, or null
    private Integer displayOrder;       // used for user-defined ordering (lower = earlier)
}
