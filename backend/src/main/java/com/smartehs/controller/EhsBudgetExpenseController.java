package com.smartehs.controller;

import com.smartehs.dto.request.EhsBudgetExpenseRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.EhsBudgetExpenseResponse;
import com.smartehs.service.EhsBudgetExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ehs-budget-expenses")
@RequiredArgsConstructor
@Tag(name = "EHS Budget Expense", description = "EHS 예산 실지출 관리 API")
public class EhsBudgetExpenseController {

    private final EhsBudgetExpenseService ehsBudgetExpenseService;

    @GetMapping
    @Operation(summary = "List budget expenses", description = "Get all EHS budget expenses with optional year and category filters and pagination")
    public ResponseEntity<ApiResponse<Page<EhsBudgetExpenseResponse>>> findAll(
            @RequestParam(required = false, defaultValue = "2026") Integer year,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EhsBudgetExpenseResponse> expenses = ehsBudgetExpenseService.findAll(year, category, pageable);
        return ResponseEntity.ok(ApiResponse.success(expenses));
    }

    @GetMapping("/by-year/{year}")
    @Operation(summary = "List all expenses for year", description = "Get all EHS budget expenses for a specific year (no pagination, for compare view)")
    public ResponseEntity<ApiResponse<List<EhsBudgetExpenseResponse>>> findByYear(@PathVariable Integer year) {
        List<EhsBudgetExpenseResponse> expenses = ehsBudgetExpenseService.findByYear(year);
        return ResponseEntity.ok(ApiResponse.success(expenses));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get budget expense by ID", description = "Get a specific EHS budget expense by ID")
    public ResponseEntity<ApiResponse<EhsBudgetExpenseResponse>> findById(@PathVariable Long id) {
        EhsBudgetExpenseResponse expense = ehsBudgetExpenseService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(expense));
    }

    @PostMapping
    @Operation(summary = "Create budget expense", description = "Create a new EHS budget expense")
    public ResponseEntity<ApiResponse<EhsBudgetExpenseResponse>> create(
            @Valid @RequestBody EhsBudgetExpenseRequest request) {
        EhsBudgetExpenseResponse expense = ehsBudgetExpenseService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Budget expense created successfully", expense));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update budget expense", description = "Update an existing EHS budget expense")
    public ResponseEntity<ApiResponse<EhsBudgetExpenseResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EhsBudgetExpenseRequest request) {
        EhsBudgetExpenseResponse expense = ehsBudgetExpenseService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Budget expense updated successfully", expense));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete budget expense", description = "Delete an EHS budget expense")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        ehsBudgetExpenseService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Budget expense deleted successfully", null));
    }
}
