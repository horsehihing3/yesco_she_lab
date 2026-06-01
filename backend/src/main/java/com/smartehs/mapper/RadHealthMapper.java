package com.smartehs.mapper;

import com.smartehs.model.RadHealth;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface RadHealthMapper {
    List<RadHealth> findAll();
    RadHealth findById(@Param("id") Long id);
    int countAll();
    int countByJudgment(@Param("j") String j);
    void insert(RadHealth e);
    void update(RadHealth e);
    void softDelete(@Param("id") Long id);
}
