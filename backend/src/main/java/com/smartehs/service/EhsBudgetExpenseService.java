package com.smartehs.service;

import com.smartehs.dto.request.EhsBudgetExpenseRequest;
import com.smartehs.dto.response.EhsBudgetExpenseResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EhsBudgetExpenseMapper;
import com.smartehs.model.EhsBudgetExpense;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EhsBudgetExpenseService {

    private final EhsBudgetExpenseMapper ehsBudgetExpenseMapper;

    @Transactional(readOnly = true)
    public Page<EhsBudgetExpenseResponse> findAll(Integer budgetYear, String category, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsBudgetExpenseResponse> content = ehsBudgetExpenseMapper.findAll(budgetYear, category, offset, limit).stream()
                .map(EhsBudgetExpenseResponse::from)
                .collect(Collectors.toList());
        int total = ehsBudgetExpenseMapper.countByYearAndCategory(budgetYear, category);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public List<EhsBudgetExpenseResponse> findByYear(Integer budgetYear) {
        return ehsBudgetExpenseMapper.findByYear(budgetYear).stream()
                .map(EhsBudgetExpenseResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EhsBudgetExpenseResponse findById(Long id) {
        EhsBudgetExpense expense = ehsBudgetExpenseMapper.findById(id);
        if (expense == null) {
            throw new ResourceNotFoundException("EhsBudgetExpense", "id", id);
        }
        return EhsBudgetExpenseResponse.from(expense);
    }

    @Transactional
    public EhsBudgetExpenseResponse create(EhsBudgetExpenseRequest request) {
        EhsBudgetExpense expense = EhsBudgetExpense.builder()
                .budgetYear(request.getBudgetYear())
                .category(request.getCategory())
                .itemName(request.getItemName())
                .amount(request.getAmount() != null ? request.getAmount() : 0L)
                .expenseDate(request.getExpenseDate())
                .department(request.getDepartment())
                .note(request.getNote())
                .writer(request.getWriter())
                .build();

        ehsBudgetExpenseMapper.insert(expense);
        log.info("Created SHE budget expense: {}", expense.getId());
        return EhsBudgetExpenseResponse.from(expense);
    }

    @Transactional
    public EhsBudgetExpenseResponse update(Long id, EhsBudgetExpenseRequest request) {
        EhsBudgetExpense expense = ehsBudgetExpenseMapper.findById(id);
        if (expense == null) {
            throw new ResourceNotFoundException("EhsBudgetExpense", "id", id);
        }

        expense.setBudgetYear(request.getBudgetYear());
        expense.setCategory(request.getCategory());
        expense.setItemName(request.getItemName());
        expense.setAmount(request.getAmount() != null ? request.getAmount() : 0L);
        expense.setExpenseDate(request.getExpenseDate());
        expense.setDepartment(request.getDepartment());
        expense.setNote(request.getNote());
        expense.setWriter(request.getWriter());

        ehsBudgetExpenseMapper.update(expense);
        log.info("Updated SHE budget expense: {}", id);
        return EhsBudgetExpenseResponse.from(expense);
    }

    @Transactional
    public void delete(Long id) {
        EhsBudgetExpense expense = ehsBudgetExpenseMapper.findById(id);
        if (expense == null) {
            throw new ResourceNotFoundException("EhsBudgetExpense", "id", id);
        }
        ehsBudgetExpenseMapper.delete(id);
        log.info("Deleted SHE budget expense with id: {}", id);
    }
}
