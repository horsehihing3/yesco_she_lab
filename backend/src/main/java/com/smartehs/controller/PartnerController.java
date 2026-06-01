package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.*;
import com.smartehs.service.PartnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/partner")
@RequiredArgsConstructor
public class PartnerController {

    private final PartnerService svc;

    // Eval
    @GetMapping("/evals") public ResponseEntity<ApiResponse<List<PartnerEval>>> listEval() { return ResponseEntity.ok(ApiResponse.success(svc.findAllEvals())); }
    @PostMapping("/evals") public ResponseEntity<ApiResponse<PartnerEval>> createEval(@RequestBody PartnerEval e) { return ResponseEntity.ok(ApiResponse.success(svc.createEval(e))); }
    @PutMapping("/evals/{id}") public ResponseEntity<ApiResponse<PartnerEval>> updateEval(@PathVariable Long id, @RequestBody PartnerEval e) { return ResponseEntity.ok(ApiResponse.success(svc.updateEval(id, e))); }
    @DeleteMapping("/evals/{id}") public ResponseEntity<ApiResponse<Void>> deleteEval(@PathVariable Long id) { svc.deleteEval(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Visitor
    @GetMapping("/visitors") public ResponseEntity<ApiResponse<List<PartnerVisitor>>> listVis() { return ResponseEntity.ok(ApiResponse.success(svc.findAllVisitors())); }
    @PostMapping("/visitors") public ResponseEntity<ApiResponse<PartnerVisitor>> createVis(@RequestBody PartnerVisitor e) { return ResponseEntity.ok(ApiResponse.success(svc.createVisitor(e))); }
    @PutMapping("/visitors/{id}") public ResponseEntity<ApiResponse<PartnerVisitor>> updateVis(@PathVariable Long id, @RequestBody PartnerVisitor e) { return ResponseEntity.ok(ApiResponse.success(svc.updateVisitor(id, e))); }
    @DeleteMapping("/visitors/{id}") public ResponseEntity<ApiResponse<Void>> deleteVis(@PathVariable Long id) { svc.deleteVisitor(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    @GetMapping("/stats") public ResponseEntity<ApiResponse<Map<String, Object>>> stats() { return ResponseEntity.ok(ApiResponse.success(svc.getStats())); }
}
