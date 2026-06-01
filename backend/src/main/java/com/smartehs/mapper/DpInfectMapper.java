package com.smartehs.mapper;

import com.smartehs.model.DpInfect;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface DpInfectMapper {
    List<DpInfect> findAll();
    DpInfect findById(@Param("id") Long id);
    int countAll();
    int countByProgramType(@Param("programType") String programType);
    int countDueSoon(@Param("days") int days);
    void insert(DpInfect e);
    void update(DpInfect e);
    void softDelete(@Param("id") Long id);
}
