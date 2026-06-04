package com.smartehs.mapper;

import com.smartehs.model.ButtonRule;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface ButtonRuleMapper {
    List<ButtonRule> findAll();
    void upsert(ButtonRule rule);
    void insertBatch(List<ButtonRule> rules);
    void deleteAll();
}
