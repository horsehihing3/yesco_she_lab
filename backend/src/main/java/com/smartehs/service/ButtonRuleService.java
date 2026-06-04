package com.smartehs.service;

import com.smartehs.mapper.ButtonRuleMapper;
import com.smartehs.model.ButtonRule;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ButtonRuleService {

    private final ButtonRuleMapper mapper;

    public List<ButtonRule> findAll() {
        return mapper.findAll();
    }

    @Transactional
    public void saveAll(List<ButtonRule> rules) {
        mapper.deleteAll();
        if (rules.isEmpty()) return;
        // MSSQL 파라미터 한도(2100) 고려: 규칙 1개당 파라미터 5개 → 청크 400행
        int chunkSize = 400;
        for (int i = 0; i < rules.size(); i += chunkSize) {
            mapper.insertBatch(rules.subList(i, Math.min(i + chunkSize, rules.size())));
        }
    }
}
