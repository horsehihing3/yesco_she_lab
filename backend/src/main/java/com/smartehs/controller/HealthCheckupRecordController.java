package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.mapper.HealthCheckupRecordMapper;
import com.smartehs.model.FileMetadata;
import com.smartehs.model.HealthCheckupRecord;
import com.smartehs.service.FileStorageService;
import com.smartehs.service.HealthCheckupPdfParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/health-checkup-records")
@RequiredArgsConstructor
public class HealthCheckupRecordController {

    private final HealthCheckupRecordMapper mapper;
    private final HealthCheckupPdfParser parser;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<HealthCheckupRecord>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(mapper.findAll()));
    }

    @GetMapping("/by-name/{name}")
    public ResponseEntity<ApiResponse<List<HealthCheckupRecord>>> findByName(@PathVariable String name) {
        return ResponseEntity.ok(ApiResponse.success(mapper.findByName(name)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HealthCheckupRecord>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(mapper.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HealthCheckupRecord>> create(
            @RequestBody HealthCheckupRecord record, Authentication authentication) {
        record.setCreatedBy(authentication != null ? authentication.getName() : "system");
        mapper.insert(record);
        return ResponseEntity.ok(ApiResponse.success(mapper.findById(record.getId())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HealthCheckupRecord>> update(
            @PathVariable Long id, @RequestBody HealthCheckupRecord record) {
        record.setId(id);
        mapper.update(record);
        return ResponseEntity.ok(ApiResponse.success(mapper.findById(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        mapper.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** PDF 업로드 + 자동 파싱 + 원본 PDF 저장 + DB 저장 */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<HealthCheckupRecord>> uploadPdf(
            @RequestParam("file") MultipartFile file, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            // 1) 파일 바이트 1회 읽기 (parser와 storage 양쪽에서 재사용)
            byte[] bytes = file.getBytes();
            // 2) 파싱
            HealthCheckupRecord parsed = parser.parse(new java.io.ByteArrayInputStream(bytes));
            parsed.setCreatedBy(username);
            mapper.insert(parsed);
            // 3) 원본 PDF 저장 — entityId는 새로 insert된 record id
            try {
                FileMetadata fm = fileStorageService.uploadFile(file, "HEALTH_CHECKUP_RECORD",
                        String.valueOf(parsed.getId()), username);
                parsed.setPdfFileId(fm.getId());
                mapper.update(parsed);
                log.info("Health checkup PDF saved: recordId={}, fileId={}", parsed.getId(), fm.getId());
            } catch (Exception e) {
                log.warn("PDF 원본 저장 실패 (파싱은 성공)", e);
            }
            return ResponseEntity.ok(ApiResponse.success(mapper.findById(parsed.getId())));
        } catch (Exception e) {
            log.error("Health checkup PDF parse failed", e);
            return ResponseEntity.ok(ApiResponse.error("PDF 파싱 실패: " + e.getMessage()));
        }
    }
}
