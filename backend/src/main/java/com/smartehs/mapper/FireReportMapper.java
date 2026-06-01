package com.smartehs.mapper;

import com.smartehs.model.FireReport;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface FireReportMapper {
    List<FireReport> findAll();
    FireReport findById(@Param("id") Long id);
    int countAll();
    void insert(FireReport e);
    void update(FireReport e);
    void softDelete(@Param("id") Long id);
}
