package com.smartehs.mapper;

import com.smartehs.model.PermitReporting;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PermitReportingMapper {
    List<PermitReporting> findAll();
    PermitReporting findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    int countDueSoon(@Param("days") int days);
    int countOverdue();
    void insert(PermitReporting e);
    void update(PermitReporting e);
    void softDelete(@Param("id") Long id);
}
