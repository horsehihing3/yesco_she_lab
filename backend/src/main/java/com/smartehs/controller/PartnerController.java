package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PartnerEvalResponse;
import com.smartehs.dto.response.PartnerVisitorResponse;
import com.smartehs.model.*;
import com.smartehs.service.PartnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/partner")
@RequiredArgsConstructor
@Tag(name = "Partner", description = "협력사 평가·방문자 관리")
public class PartnerController {

    private final PartnerService svc;

    // Eval
    @GetMapping("/evals") public ResponseEntity<ApiResponse<List<PartnerEvalResponse>>> listEval() { return ResponseEntity.ok(ApiResponse.success(svc.findAllEvals().stream().map(PartnerEvalResponse::from).collect(Collectors.toList()))); }
    @PostMapping("/evals") public ResponseEntity<ApiResponse<PartnerEvalResponse>> createEval(@RequestBody PartnerEval e) { return ResponseEntity.ok(ApiResponse.success(PartnerEvalResponse.from(svc.createEval(e)))); }
    @PutMapping("/evals/{id}") public ResponseEntity<ApiResponse<PartnerEvalResponse>> updateEval(@PathVariable Long id, @RequestBody PartnerEval e) { return ResponseEntity.ok(ApiResponse.success(PartnerEvalResponse.from(svc.updateEval(id, e)))); }
    @DeleteMapping("/evals/{id}") public ResponseEntity<ApiResponse<Void>> deleteEval(@PathVariable Long id) { svc.deleteEval(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Visitor
    @GetMapping("/visitors") public ResponseEntity<ApiResponse<List<PartnerVisitorResponse>>> listVis() { return ResponseEntity.ok(ApiResponse.success(svc.findAllVisitors().stream().map(PartnerVisitorResponse::from).collect(Collectors.toList()))); }
    @PostMapping("/visitors") public ResponseEntity<ApiResponse<PartnerVisitorResponse>> createVis(@RequestBody PartnerVisitor e) { return ResponseEntity.ok(ApiResponse.success(PartnerVisitorResponse.from(svc.createVisitor(e)))); }
    @PutMapping("/visitors/{id}") public ResponseEntity<ApiResponse<PartnerVisitorResponse>> updateVis(@PathVariable Long id, @RequestBody PartnerVisitor e) { return ResponseEntity.ok(ApiResponse.success(PartnerVisitorResponse.from(svc.updateVisitor(id, e)))); }
    @DeleteMapping("/visitors/{id}") public ResponseEntity<ApiResponse<Void>> deleteVis(@PathVariable Long id) { svc.deleteVisitor(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    @GetMapping("/stats") public ResponseEntity<ApiResponse<Map<String, Object>>> stats() { return ResponseEntity.ok(ApiResponse.success(svc.getStats())); }
}
