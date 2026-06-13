package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.*;
import com.smartehs.service.PermitLifecycleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/permit-lifecycle")
@RequiredArgsConstructor
@Tag(name = "Permit Lifecycle", description = "인허가 생애주기 관리")
public class PermitLifecycleController {

    private final PermitLifecycleService svc;

    // 1. Identification
    @GetMapping("/identifications")         public ResponseEntity<ApiResponse<List<PermitIdentification>>> ident()                          { return ResponseEntity.ok(ApiResponse.success(svc.findAllIdent())); }
    @PostMapping("/identifications")        public ResponseEntity<ApiResponse<PermitIdentification>> createIdent(@RequestBody PermitIdentification e) { return ResponseEntity.ok(ApiResponse.success(svc.createIdent(e))); }
    @PutMapping("/identifications/{id}")    public ResponseEntity<ApiResponse<PermitIdentification>> updateIdent(@PathVariable Long id, @RequestBody PermitIdentification e) { return ResponseEntity.ok(ApiResponse.success(svc.updateIdent(id, e))); }
    @DeleteMapping("/identifications/{id}") public ResponseEntity<ApiResponse<Void>> deleteIdent(@PathVariable Long id)                     { svc.deleteIdent(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // 2. Registry
    @GetMapping("/registries")         public ResponseEntity<ApiResponse<List<PermitRegistry>>> reg()                         { return ResponseEntity.ok(ApiResponse.success(svc.findAllRegistry())); }
    @PostMapping("/registries")        public ResponseEntity<ApiResponse<PermitRegistry>> createReg(@RequestBody PermitRegistry e) { return ResponseEntity.ok(ApiResponse.success(svc.createRegistry(e))); }
    @PutMapping("/registries/{id}")    public ResponseEntity<ApiResponse<PermitRegistry>> updateReg(@PathVariable Long id, @RequestBody PermitRegistry e) { return ResponseEntity.ok(ApiResponse.success(svc.updateRegistry(id, e))); }
    @DeleteMapping("/registries/{id}") public ResponseEntity<ApiResponse<Void>> deleteReg(@PathVariable Long id)              { svc.deleteRegistry(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // 3. Renewal
    @GetMapping("/renewals")         public ResponseEntity<ApiResponse<List<PermitRenewal>>> rn()                       { return ResponseEntity.ok(ApiResponse.success(svc.findAllRenewal())); }
    @PostMapping("/renewals")        public ResponseEntity<ApiResponse<PermitRenewal>> createRn(@RequestBody PermitRenewal e) { return ResponseEntity.ok(ApiResponse.success(svc.createRenewal(e))); }
    @PutMapping("/renewals/{id}")    public ResponseEntity<ApiResponse<PermitRenewal>> updateRn(@PathVariable Long id, @RequestBody PermitRenewal e) { return ResponseEntity.ok(ApiResponse.success(svc.updateRenewal(id, e))); }
    @DeleteMapping("/renewals/{id}") public ResponseEntity<ApiResponse<Void>> deleteRn(@PathVariable Long id)           { svc.deleteRenewal(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // 4. Change
    @GetMapping("/changes")         public ResponseEntity<ApiResponse<List<PermitChange>>> ch()                       { return ResponseEntity.ok(ApiResponse.success(svc.findAllChange())); }
    @PostMapping("/changes")        public ResponseEntity<ApiResponse<PermitChange>> createCh(@RequestBody PermitChange e) { return ResponseEntity.ok(ApiResponse.success(svc.createChange(e))); }
    @PutMapping("/changes/{id}")    public ResponseEntity<ApiResponse<PermitChange>> updateCh(@PathVariable Long id, @RequestBody PermitChange e) { return ResponseEntity.ok(ApiResponse.success(svc.updateChange(id, e))); }
    @DeleteMapping("/changes/{id}") public ResponseEntity<ApiResponse<Void>> deleteCh(@PathVariable Long id)          { svc.deleteChange(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // 5. Inspection
    @GetMapping("/inspections")         public ResponseEntity<ApiResponse<List<PermitInspection>>> ip()                         { return ResponseEntity.ok(ApiResponse.success(svc.findAllInspection())); }
    @PostMapping("/inspections")        public ResponseEntity<ApiResponse<PermitInspection>> createIp(@RequestBody PermitInspection e) { return ResponseEntity.ok(ApiResponse.success(svc.createInspection(e))); }
    @PutMapping("/inspections/{id}")    public ResponseEntity<ApiResponse<PermitInspection>> updateIp(@PathVariable Long id, @RequestBody PermitInspection e) { return ResponseEntity.ok(ApiResponse.success(svc.updateInspection(id, e))); }
    @DeleteMapping("/inspections/{id}") public ResponseEntity<ApiResponse<Void>> deleteIp(@PathVariable Long id)               { svc.deleteInspection(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // 6. Reporting
    @GetMapping("/reportings")         public ResponseEntity<ApiResponse<List<PermitReporting>>> rp()                        { return ResponseEntity.ok(ApiResponse.success(svc.findAllReporting())); }
    @PostMapping("/reportings")        public ResponseEntity<ApiResponse<PermitReporting>> createRp(@RequestBody PermitReporting e) { return ResponseEntity.ok(ApiResponse.success(svc.createReporting(e))); }
    @PutMapping("/reportings/{id}")    public ResponseEntity<ApiResponse<PermitReporting>> updateRp(@PathVariable Long id, @RequestBody PermitReporting e) { return ResponseEntity.ok(ApiResponse.success(svc.updateReporting(id, e))); }
    @DeleteMapping("/reportings/{id}") public ResponseEntity<ApiResponse<Void>> deleteRp(@PathVariable Long id)             { svc.deleteReporting(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // 7. Document
    @GetMapping("/documents")         public ResponseEntity<ApiResponse<List<PermitDocument>>> dc()                       { return ResponseEntity.ok(ApiResponse.success(svc.findAllDocument())); }
    @PostMapping("/documents")        public ResponseEntity<ApiResponse<PermitDocument>> createDc(@RequestBody PermitDocument e) { return ResponseEntity.ok(ApiResponse.success(svc.createDocument(e))); }
    @PutMapping("/documents/{id}")    public ResponseEntity<ApiResponse<PermitDocument>> updateDc(@PathVariable Long id, @RequestBody PermitDocument e) { return ResponseEntity.ok(ApiResponse.success(svc.updateDocument(id, e))); }
    @DeleteMapping("/documents/{id}") public ResponseEntity<ApiResponse<Void>> deleteDc(@PathVariable Long id)            { svc.deleteDocument(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        return ResponseEntity.ok(ApiResponse.success(svc.getStats()));
    }
}
