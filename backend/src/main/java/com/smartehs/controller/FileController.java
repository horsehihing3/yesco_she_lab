package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.FileMetadata;
import com.smartehs.service.FileConversionService;
import com.smartehs.service.FileStorageService;
import com.smartehs.util.LanguageContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@Tag(name = "File Management", description = "File upload/download API")
public class FileController {

    private final FileStorageService fileStorageService;
    private final FileConversionService fileConversionService;

    @PostMapping("/upload")
    @Operation(summary = "Upload file", description = "Upload a file with entity type and entity ID")
    public ResponseEntity<ApiResponse<FileMetadata>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") String entityId,
            @AuthenticationPrincipal UserDetails userDetails) {

        FileMetadata metadata = fileStorageService.uploadFile(
                file, entityType, entityId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", metadata));
    }

    @GetMapping("/{fileId}")
    @Operation(summary = "Download file", description = "Download a file by ID")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) {
        FileMetadata metadata = fileStorageService.getFileMetadata(fileId);
        Resource resource = fileStorageService.downloadFile(fileId);

        String encodedFilename = URLEncoder.encode(metadata.getOriginalFilename(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(metadata.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + encodedFilename)
                .body(resource);
    }

    @GetMapping("/{fileId}/base64")
    @Operation(summary = "Get file as Base64", description = "Get file content as Base64 encoded string")
    public ResponseEntity<ApiResponse<Map<String, String>>> getFileAsBase64(@PathVariable Long fileId) {
        FileMetadata metadata = fileStorageService.getFileMetadata(fileId);
        byte[] fileBytes = fileStorageService.getFileAsBytes(fileId);
        String base64Content = Base64.getEncoder().encodeToString(fileBytes);

        Map<String, String> response = Map.of(
                "filename", metadata.getOriginalFilename(),
                "contentType", metadata.getContentType(),
                "content", base64Content
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{fileId}/pdf")
    @Operation(summary = "Get file as PDF", description = "Convert Office document to PDF for preview")
    public ResponseEntity<byte[]> getFileAsPdf(@PathVariable Long fileId) {
        FileMetadata metadata = fileStorageService.getFileMetadata(fileId);
        byte[] pdfBytes = fileConversionService.convertToPdf(fileId);

        String pdfFilename = metadata.getOriginalFilename().replaceAll("\\.[^.]+$", ".pdf");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + pdfFilename + "\"")
                .body(pdfBytes);
    }

    @DeleteMapping("/{fileId}")
    @Operation(summary = "Delete file", description = "Delete a file by ID")
    public ResponseEntity<ApiResponse<Void>> deleteFile(@PathVariable Long fileId) {
        fileStorageService.deleteFile(fileId);
        return ResponseEntity.ok(ApiResponse.success("File deleted successfully", null));
    }

    @GetMapping("/by-entity/{entityType}/{*entityId}")
    @Operation(summary = "List files by entity", description = "Get all files for a specific entity, language-aware for SAFETY_RULES")
    public ResponseEntity<ApiResponse<List<FileMetadata>>> getFilesByEntity(
            @PathVariable String entityType,
            @PathVariable String entityId) {
        // entityId comes with leading slash, remove it
        String cleanEntityId = entityId.startsWith("/") ? entityId.substring(1) : entityId;

        List<FileMetadata> files;
        if ("SAFETY_RULES".equals(entityType)) {
            String language = LanguageContext.getLanguage();
            files = fileStorageService.getFilesByEntityAndLanguage(entityType, cleanEntityId, language);
        } else {
            files = fileStorageService.getFilesByEntity(entityType, cleanEntityId);
        }

        return ResponseEntity.ok(ApiResponse.success(files));
    }

    @PatchMapping("/{fileId}/entity-type")
    @Operation(summary = "Change file entityType", description = "Move a file to a different entityType (used for position changes)")
    public ResponseEntity<ApiResponse<FileMetadata>> updateEntityType(
            @PathVariable Long fileId,
            @RequestBody Map<String, String> body) {
        FileMetadata metadata = fileStorageService.getFileMetadata(fileId);
        String newType = body.get("entityType");
        if (newType != null && !newType.isBlank()) {
            metadata.setEntityType(newType);
            fileStorageService.updateMetadata(metadata);
        }
        return ResponseEntity.ok(ApiResponse.success(metadata));
    }

    @PostMapping("/reorder")
    @Operation(summary = "Reorder files", description = "Assign display_order to the given file IDs in the order provided")
    public ResponseEntity<ApiResponse<Void>> reorderFiles(@RequestBody Map<String, List<Long>> body) {
        List<Long> orderedIds = body.get("fileIds");
        fileStorageService.reorderFiles(orderedIds);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
