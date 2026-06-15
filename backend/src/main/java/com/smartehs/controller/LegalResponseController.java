package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.LegalSearchResult;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.model.LegalRegistry;
import com.smartehs.model.LegalRevisionLog;
import com.smartehs.service.LegalResponseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/legal-response")
@RequiredArgsConstructor
public class LegalResponseController {

    private final LegalResponseService service;
    private final IdmMapper idmMapper;

    // ===== 외부 API (법제처 검색) =====
    @GetMapping("/external/search")
    public ResponseEntity<ApiResponse<LegalSearchResult>> searchExternal(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int display) {
        return ResponseEntity.ok(ApiResponse.success(service.searchExternal(query, page, display)));
    }

    @PostMapping("/external/sync-recent")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncRecent(
            @RequestParam(defaultValue = "100") int display,
            @RequestParam(defaultValue = "1") int pages) {
        return ResponseEntity.ok(ApiResponse.success(service.syncRecentRevisionsMulti(display, pages)));
    }

    // ===== 등록 법령 (Registry) =====
    @GetMapping("/registry")
    public ResponseEntity<ApiResponse<List<LegalRegistry>>> listRegistry(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(service.listRegistry(category, keyword)));
    }

    @GetMapping("/registry/{id}")
    public ResponseEntity<ApiResponse<LegalRegistry>> getRegistry(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getRegistry(id)));
    }

    @PostMapping("/registry")
    public ResponseEntity<ApiResponse<LegalRegistry>> createRegistry(
            @RequestBody LegalRegistry r, Authentication auth) {
        applyAudit(r, auth, true);
        return ResponseEntity.ok(ApiResponse.success(service.createRegistry(r)));
    }

    @PutMapping("/registry/{id}")
    public ResponseEntity<ApiResponse<LegalRegistry>> updateRegistry(
            @PathVariable Long id, @RequestBody LegalRegistry r, Authentication auth) {
        applyAudit(r, auth, false);
        return ResponseEntity.ok(ApiResponse.success(service.updateRegistry(id, r)));
    }

    @DeleteMapping("/registry/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRegistry(@PathVariable Long id) {
        service.deleteRegistry(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** 등록 법령별 미완료 개정 카운트 (lawId → count) */
    @GetMapping("/registry/revision-counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> registryRevisionCounts() {
        return ResponseEntity.ok(ApiResponse.success(service.getRegistryRevisionCounts()));
    }

    /** 등록 법령 전체에 대해 법제처 API로 개정 여부 일괄 확인 */
    @PostMapping("/registry/check-revisions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkRegistryRevisions() {
        return ResponseEntity.ok(ApiResponse.success(service.checkRegistryRevisions()));
    }

    // ===== 개정 추적 (Revision Log) =====
    @GetMapping("/revisions")
    public ResponseEntity<ApiResponse<List<LegalRevisionLog>>> listRevisions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(service.listRevisions(status, keyword)));
    }

    @GetMapping("/revisions/{id}")
    public ResponseEntity<ApiResponse<LegalRevisionLog>> getRevision(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getRevision(id)));
    }

    @PutMapping("/revisions/{id}")
    public ResponseEntity<ApiResponse<LegalRevisionLog>> updateRevision(
            @PathVariable Long id, @RequestBody LegalRevisionLog r) {
        return ResponseEntity.ok(ApiResponse.success(service.updateRevision(id, r)));
    }

    @DeleteMapping("/revisions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRevision(@PathVariable Long id) {
        service.deleteRevision(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ===== KPI =====
    @GetMapping("/kpi")
    public ResponseEntity<ApiResponse<Map<String, Object>>> kpi() {
        return ResponseEntity.ok(ApiResponse.success(service.getKpi()));
    }

    // ===== Internal =====
    private void applyAudit(LegalRegistry r, Authentication auth, boolean isCreate) {
        if (auth == null) return;
        IdmUser u = idmMapper.findByUid(auth.getName());
        if (u == null) return;
        if (isCreate) {
            r.setCreatedByUserId(u.getUidNumber());
            r.setCreatedByName(u.getUserName());
            r.setCreatedByTeam(u.getGroupName());
            r.setCreatedByPosition(u.getTitleName());
        }
        r.setModifiedByUserId(u.getUidNumber());
        r.setModifiedByName(u.getUserName());
        r.setModifiedByTeam(u.getGroupName());
        r.setModifiedByPosition(u.getTitleName());
    }
}
