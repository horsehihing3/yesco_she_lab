package com.smartehs.mapper;

import com.smartehs.model.PartnerEval;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PartnerEvalMapper {
    List<PartnerEval> findAll();
    PartnerEval findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    int countByGrade(@Param("min") int min, @Param("max") int max);
    void insert(PartnerEval e);
    void update(PartnerEval e);
    void softDelete(@Param("id") Long id);
}
