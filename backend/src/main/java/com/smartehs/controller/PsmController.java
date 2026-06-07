package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.model.PsmData;
import com.smartehs.model.PsmHazop;
import com.smartehs.model.PsmIncident;
import com.smartehs.model.PsmMoc;
import com.smartehs.model.PsmPtw;
import com.smartehs.model.PsmWo;
import com.smartehs.service.PsmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/psm")
@RequiredArgsConstructor
@Tag(name = "PSM (PSW/MOC)", description = "공정안전관리 - 자료, MOC, HAZOP")
public class PsmController {

    private final PsmService service;
    private final IdmMapper idmMapper;

    private void applyAudit(Object target, Authentication auth, boolean isCreate) {
        if (auth == null) return;
        IdmUser u = idmMapper.findByUid(auth.getName());
        if (u == null) return;
        if (target instanceof PsmData) {
            PsmData d = (PsmData) target;
            if (isCreate) { d.setCreatedByUserId(u.getUidNumber()); d.setCreatedByName(u.getUserName()); }
            d.setModifiedByUserId(u.getUidNumber()); d.setModifiedByName(u.getUserName());
        } else if (target instanceof PsmMoc) {
            PsmMoc m = (PsmMoc) target;
            if (isCreate) { m.setCreatedByUserId(u.getUidNumber()); m.setCreatedByName(u.getUserName()); }
            m.setModifiedByUserId(u.getUidNumber()); m.setModifiedByName(u.getUserName());
        } else if (target instanceof PsmHazop) {
            PsmHazop h = (PsmHazop) target;
            if (isCreate) { h.setCreatedByUserId(u.getUidNumber()); h.setCreatedByName(u.getUserName()); }
            h.setModifiedByUserId(u.getUidNumber()); h.setModifiedByName(u.getUserName());
        } else if (target instanceof PsmWo) {
            PsmWo w = (PsmWo) target;
            if (isCreate) { w.setCreatedByUserId(u.getUidNumber()); w.setCreatedByName(u.getUserName()); }
            w.setModifiedByUserId(u.getUidNumber()); w.setModifiedByName(u.getUserName());
        } else if (target instanceof PsmIncident) {
            PsmIncident i = (PsmIncident) target;
            if (isCreate) { i.setCreatedByUserId(u.getUidNumber()); i.setCreatedByName(u.getUserName()); }
            i.setModifiedByUserId(u.getUidNumber()); i.setModifiedByName(u.getUserName());
        } else if (target instanceof PsmPtw) {
            PsmPtw p = (PsmPtw) target;
            if (isCreate) { p.setCreatedByUserId(u.getUidNumber()); p.setCreatedByName(u.getUserName()); }
            p.setModifiedByUserId(u.getUidNumber()); p.setModifiedByName(u.getUserName());
        }
    }

    // ─── PSM Data ───
    @GetMapping("/data")
    @Operation(summary = "공정안전자료 목록 (category=EQUIP/CHEM/POWER/VESSEL/PIPE/PSV)")
    public ResponseEntity<ApiResponse<Page<PsmData>>> findAllData(
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAllData(category, pageable)));
    }

    @GetMapping("/data/{id}")
    public ResponseEntity<ApiResponse<PsmData>> findDataById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findDataById(id)));
    }

    @PostMapping("/data")
    public ResponseEntity<ApiResponse<PsmData>> createData(@RequestBody PsmData d, Authentication auth) {
        applyAudit(d, auth, true);
        return ResponseEntity.ok(ApiResponse.success(service.createData(d)));
    }

    @PutMapping("/data/{id}")
    public ResponseEntity<ApiResponse<PsmData>> updateData(@PathVariable Long id, @RequestBody PsmData d, Authentication auth) {
        applyAudit(d, auth, false);
        return ResponseEntity.ok(ApiResponse.success(service.updateData(id, d)));
    }

    @DeleteMapping("/data/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteData(@PathVariable Long id) {
        service.deleteData(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/data/expiring")
    public ResponseEntity<ApiResponse<List<PsmData>>> findExpiring() {
        return ResponseEntity.ok(ApiResponse.success(service.findExpiring()));
    }

    // ─── MOC ───
    @GetMapping("/moc")
    public ResponseEntity<ApiResponse<Page<PsmMoc>>> findAllMoc(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAllMoc(pageable)));
    }

    @GetMapping("/moc/{id}")
    public ResponseEntity<ApiResponse<PsmMoc>> findMocById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findMocById(id)));
    }

    @PostMapping("/moc")
    public ResponseEntity<ApiResponse<PsmMoc>> createMoc(@RequestBody PsmMoc m, Authentication auth) {
        applyAudit(m, auth, true);
        return ResponseEntity.ok(ApiResponse.success(service.createMoc(m)));
    }

    @PutMapping("/moc/{id}")
    public ResponseEntity<ApiResponse<PsmMoc>> updateMoc(@PathVariable Long id, @RequestBody PsmMoc m, Authentication auth) {
        applyAudit(m, auth, false);
        return ResponseEntity.ok(ApiResponse.success(service.updateMoc(id, m)));
    }

    @DeleteMapping("/moc/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMoc(@PathVariable Long id) {
        service.deleteMoc(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ─── HAZOP ───
    @GetMapping("/hazop")
    public ResponseEntity<ApiResponse<Page<PsmHazop>>> findAllHazop(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAllHazop(pageable)));
    }

    @GetMapping("/hazop/{id}")
    public ResponseEntity<ApiResponse<PsmHazop>> findHazopById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findHazopById(id)));
    }

    @PostMapping("/hazop")
    public ResponseEntity<ApiResponse<PsmHazop>> createHazop(@RequestBody PsmHazop h, Authentication auth) {
        applyAudit(h, auth, true);
        return ResponseEntity.ok(ApiResponse.success(service.createHazop(h)));
    }

    @PutMapping("/hazop/{id}")
    public ResponseEntity<ApiResponse<PsmHazop>> updateHazop(@PathVariable Long id, @RequestBody PsmHazop h, Authentication auth) {
        applyAudit(h, auth, false);
        return ResponseEntity.ok(ApiResponse.success(service.updateHazop(id, h)));
    }

    @DeleteMapping("/hazop/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHazop(@PathVariable Long id) {
        service.deleteHazop(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ─── Work Order ───
    @GetMapping("/wo")
    public ResponseEntity<ApiResponse<Page<PsmWo>>> findAllWo(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAllWo(pageable)));
    }

    @GetMapping("/wo/{id}")
    public ResponseEntity<ApiResponse<PsmWo>> findWoById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findWoById(id)));
    }

    @PostMapping("/wo")
    public ResponseEntity<ApiResponse<PsmWo>> createWo(@RequestBody PsmWo w, Authentication auth) {
        applyAudit(w, auth, true);
        return ResponseEntity.ok(ApiResponse.success(service.createWo(w)));
    }

    @PutMapping("/wo/{id}")
    public ResponseEntity<ApiResponse<PsmWo>> updateWo(@PathVariable Long id, @RequestBody PsmWo w, Authentication auth) {
        applyAudit(w, auth, false);
        return ResponseEntity.ok(ApiResponse.success(service.updateWo(id, w)));
    }

    @DeleteMapping("/wo/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWo(@PathVariable Long id) {
        service.deleteWo(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ─── Incident ───
    @GetMapping("/incident")
    public ResponseEntity<ApiResponse<Page<PsmIncident>>> findAllIncident(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAllIncident(pageable)));
    }

    @GetMapping("/incident/{id}")
    public ResponseEntity<ApiResponse<PsmIncident>> findIncidentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findIncidentById(id)));
    }

    @PostMapping("/incident")
    public ResponseEntity<ApiResponse<PsmIncident>> createIncident(@RequestBody PsmIncident i, Authentication auth) {
        applyAudit(i, auth, true);
        return ResponseEntity.ok(ApiResponse.success(service.createIncident(i)));
    }

    @PutMapping("/incident/{id}")
    public ResponseEntity<ApiResponse<PsmIncident>> updateIncident(@PathVariable Long id, @RequestBody PsmIncident i, Authentication auth) {
        applyAudit(i, auth, false);
        return ResponseEntity.ok(ApiResponse.success(service.updateIncident(id, i)));
    }

    @DeleteMapping("/incident/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIncident(@PathVariable Long id) {
        service.deleteIncident(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ─── PTW ───
    @GetMapping("/ptw")
    public ResponseEntity<ApiResponse<Page<PsmPtw>>> findAllPtw(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAllPtw(pageable)));
    }

    @GetMapping("/ptw/{id}")
    public ResponseEntity<ApiResponse<PsmPtw>> findPtwById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findPtwById(id)));
    }

    @PostMapping("/ptw")
    public ResponseEntity<ApiResponse<PsmPtw>> createPtw(@RequestBody PsmPtw p, Authentication auth) {
        applyAudit(p, auth, true);
        return ResponseEntity.ok(ApiResponse.success(service.createPtw(p)));
    }

    @PutMapping("/ptw/{id}")
    public ResponseEntity<ApiResponse<PsmPtw>> updatePtw(@PathVariable Long id, @RequestBody PsmPtw p, Authentication auth) {
        applyAudit(p, auth, false);
        return ResponseEntity.ok(ApiResponse.success(service.updatePtw(id, p)));
    }

    @DeleteMapping("/ptw/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePtw(@PathVariable Long id) {
        service.deletePtw(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ─── Dashboard ───
    @GetMapping("/dashboard/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dashboardSummary() {
        return ResponseEntity.ok(ApiResponse.success(service.getDashboardSummary()));
    }
}
