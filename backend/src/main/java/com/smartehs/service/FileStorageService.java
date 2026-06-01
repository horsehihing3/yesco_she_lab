package com.smartehs.service;

import com.smartehs.model.FileMetadata;
import com.smartehs.model.TranslationStatus;
import com.smartehs.exception.BadRequestException;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.FileMetadataMapper;
import com.smartehs.util.LanguageContext;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private final FileMetadataMapper fileMetadataMapper;
    private final DocumentTranslationService documentTranslationService;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
            log.info("File upload directory initialized: {}", uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    @Transactional
    public FileMetadata uploadFile(MultipartFile file, String entityType, String entityId, String uploadedBy) {
        if (file.isEmpty()) {
            throw new BadRequestException("Cannot upload empty file");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        if (originalFilename.contains("..")) {
            throw new BadRequestException("Invalid filename: " + originalFilename);
        }

        // Generate unique filename
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String extension = getFileExtension(originalFilename);
        String storedFilename = UUID.randomUUID().toString() + "_" + timestamp + extension;

        // Create entity-specific subdirectory
        Path entityDir = Paths.get(uploadDir, entityType);
        try {
            Files.createDirectories(entityDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create entity directory", e);
        }

        Path targetLocation = entityDir.resolve(storedFilename);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("File uploaded: {} -> {}", originalFilename, targetLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not store file: " + originalFilename, e);
        }

        // Determine if this file should be translated
        // EHS 문서 (entityType=SAFETY_RULES) 만 자동 번역. 다른 entityType 의 첨부는 원본 그대로.
        String currentLang = LanguageContext.getLanguage();
        boolean shouldTranslate = "SAFETY_RULES".equals(entityType)
                && documentTranslationService.isTranslatable(originalFilename);

        FileMetadata metadata = FileMetadata.builder()
                .originalFilename(originalFilename)
                .storedFilename(storedFilename)
                .filePath(targetLocation.toString())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .entityType(entityType)
                .entityId(entityId)
                .uploadedBy(uploadedBy)
                .language(shouldTranslate ? currentLang : null)
                .translationStatus(shouldTranslate ? TranslationStatus.PENDING : null)
                .build();

        fileMetadataMapper.insert(metadata);

        // Trigger async translation after insert (metadata.id is now populated)
        if (shouldTranslate) {
            documentTranslationService.translateDocumentAsync(metadata.getId(), currentLang);
        }

        return metadata;
    }

    public Resource downloadFile(Long fileId) {
        FileMetadata metadata = fileMetadataMapper.findById(fileId);
        if (metadata == null) {
            throw new ResourceNotFoundException("File", "id", fileId);
        }

        try {
            Path filePath = Paths.get(metadata.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found: " + metadata.getOriginalFilename());
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Could not read file: " + metadata.getOriginalFilename(), e);
        }
    }

    public byte[] getFileAsBytes(Long fileId) {
        FileMetadata metadata = fileMetadataMapper.findById(fileId);
        if (metadata == null) {
            throw new ResourceNotFoundException("File", "id", fileId);
        }

        try {
            Path filePath = Paths.get(metadata.getFilePath());
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Could not read file: " + metadata.getOriginalFilename(), e);
        }
    }

    @Transactional
    public void updateMetadata(FileMetadata metadata) {
        fileMetadataMapper.update(metadata);
    }

    @Transactional
    public void reorderFiles(java.util.List<Long> orderedIds) {
        if (orderedIds == null) return;
        for (int i = 0; i < orderedIds.size(); i++) {
            fileMetadataMapper.updateDisplayOrder(orderedIds.get(i), i);
        }
    }

    @Transactional
    public void deleteFile(Long fileId) {
        FileMetadata metadata = fileMetadataMapper.findById(fileId);
        if (metadata == null) {
            throw new ResourceNotFoundException("File", "id", fileId);
        }

        // If this is an original file, delete all its translations first
        if (metadata.getParentFileId() == null) {
            List<FileMetadata> translations = fileMetadataMapper.findByParentFileId(fileId);
            for (FileMetadata translation : translations) {
                try {
                    Files.deleteIfExists(Paths.get(translation.getFilePath()));
                    fileMetadataMapper.delete(translation.getId());
                    log.info("Translation file deleted: {}", translation.getOriginalFilename());
                } catch (IOException e) {
                    log.error("Could not delete translation file: {}", translation.getOriginalFilename(), e);
                }
            }
        }

        try {
            Path filePath = Paths.get(metadata.getFilePath());
            Files.deleteIfExists(filePath);
            fileMetadataMapper.delete(fileId);
            log.info("File deleted: {}", metadata.getOriginalFilename());
        } catch (IOException e) {
            throw new RuntimeException("Could not delete file: " + metadata.getOriginalFilename(), e);
        }
    }

    @Transactional
    public void deleteFilesByEntity(String entityType, String entityId) {
        List<FileMetadata> files = fileMetadataMapper.findByEntityTypeAndEntityId(entityType, entityId);
        for (FileMetadata metadata : files) {
            try {
                Path filePath = Paths.get(metadata.getFilePath());
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                log.error("Could not delete file: {}", metadata.getOriginalFilename(), e);
            }
        }
        fileMetadataMapper.deleteByEntityTypeAndEntityId(entityType, entityId);
    }

    public List<FileMetadata> getFilesByEntity(String entityType, String entityId) {
        // display_order 우선, 없으면 created_at 오름차순 (등록 순서 유지 + 사용자 재정렬 반영)
        return fileMetadataMapper.findByEntityTypeAndEntityId(entityType, entityId);
    }

    /**
     * Get files for an entity, returning the version matching the requested language.
     * - Files with language=null (non-translatable) are always returned as-is.
     * - Files with language matching the request are returned as-is.
     * - Files with a different language are substituted with their completed translation if available.
     * - Only original files (parentFileId=null) are considered.
     */
    public List<FileMetadata> getFilesByEntityAndLanguage(String entityType, String entityId, String language) {
        List<FileMetadata> allFiles = fileMetadataMapper.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
        List<FileMetadata> result = new ArrayList<>();

        for (FileMetadata file : allFiles) {
            // Skip translated files (child records) - we only want originals
            if (file.getParentFileId() != null) {
                continue;
            }

            if (file.getLanguage() == null) {
                // Non-translatable file: show as-is in all languages
                result.add(file);
            } else if (file.getLanguage().equals(language)) {
                // Original is in the requested language: show it
                result.add(file);
            } else {
                // Original is in a different language: look for a translation
                FileMetadata translation = fileMetadataMapper.findByParentFileIdAndLanguage(file.getId(), language);
                if (translation != null && TranslationStatus.COMPLETED.equals(translation.getTranslationStatus())) {
                    result.add(translation);
                } else {
                    // No translation available yet: show original with its status
                    result.add(file);
                }
            }
        }

        return result;
    }

    public FileMetadata getFileMetadata(Long fileId) {
        FileMetadata metadata = fileMetadataMapper.findById(fileId);
        if (metadata == null) {
            throw new ResourceNotFoundException("File", "id", fileId);
        }
        return metadata;
    }

    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex >= 0) ? filename.substring(dotIndex) : "";
    }
}
