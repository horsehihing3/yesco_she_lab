package com.smartehs.mapper;

import com.smartehs.model.AccidentReport;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AccidentReportMapper {
    List<AccidentReport> findAll();

    AccidentReport findById(@Param("id") Long id);

    void insert(AccidentReport report);

    void update(AccidentReport report);

    void delete(@Param("id") Long id);
}
