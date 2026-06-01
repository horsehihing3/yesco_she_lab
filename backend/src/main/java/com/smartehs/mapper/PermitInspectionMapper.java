package com.smartehs.mapper;

import com.smartehs.model.PermitInspection;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PermitInspectionMapper {
    List<PermitInspection> findAll();
    PermitInspection findById(@Param("id") Long id);
    int countAll();
    int countOverdue();
    int countDueSoon(@Param("days") int days);
    void insert(PermitInspection e);
    void update(PermitInspection e);
    void softDelete(@Param("id") Long id);
}
