package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.IncidentResponse;
import com.smartehs.service.IncidentResponseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/incident-response")
@RequiredArgsConstructor
@Tag(name = "Incident Response", description = "사고 대응 관리")
public class IncidentResponseController {

    private final IncidentResponseService svc;

    @GetMapping
    public ResponseEntity<ApiResponse<List<IncidentResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(svc.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IncidentResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(svc.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IncidentResponse>> create(@RequestBody IncidentResponse e) {
        return ResponseEntity.ok(ApiResponse.success(svc.create(e)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<IncidentResponse>> update(@PathVariable Long id, @RequestBody IncidentResponse e) {
        return ResponseEntity.ok(ApiResponse.success(svc.update(id, e)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        svc.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        return ResponseEntity.ok(ApiResponse.success(svc.getStats()));
    }
}
