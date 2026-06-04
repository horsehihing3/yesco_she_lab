package com.smartehs.mapper;

import com.smartehs.model.MenuRule;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface MenuRuleMapper {
    List<MenuRule> findAll();
    void insertBatch(List<MenuRule> rules);
    void deleteAll();
}
