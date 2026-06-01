package com.smartehs.controller;

import com.smartehs.dto.request.ProcessActivityFormRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.ProcessActivityFormResponse;
import com.smartehs.service.ProcessActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/process-activity-forms")
@RequiredArgsConstructor
public class ProcessActivityController {

    private final ProcessActivityService service;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProcessActivityFormResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(service.findAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProcessActivityFormResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProcessActivityFormResponse>> create(
            @RequestBody ProcessActivityFormRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProcessActivityFormResponse>> update(
            @PathVariable Long id,
            @RequestBody ProcessActivityFormRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
