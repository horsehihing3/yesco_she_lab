package com.smartehs.service;

import com.smartehs.mapper.MenuRuleMapper;
import com.smartehs.model.MenuRule;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuRuleService {

    private final MenuRuleMapper mapper;

    public List<MenuRule> findAll() {
        return mapper.findAll();
    }

    @Transactional
    public void saveAll(List<MenuRule> rules) {
        mapper.deleteAll();
        if (rules.isEmpty()) return;
        int chunkSize = 500;
        for (int i = 0; i < rules.size(); i += chunkSize) {
            mapper.insertBatch(rules.subList(i, Math.min(i + chunkSize, rules.size())));
        }
    }
}
