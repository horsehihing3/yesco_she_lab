package com.smartehs.mapper;

import com.smartehs.model.ChemicalUsageReport;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChemicalUsageReportMapper {

    List<ChemicalUsageReport> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    ChemicalUsageReport findById(@Param("id") Long id);

    void insert(ChemicalUsageReport chemicalUsageReport);
    void update(ChemicalUsageReport chemicalUsageReport);
    void softDelete(@Param("id") Long id);

    List<ChemicalUsageReport> search(@Param("keyword") String keyword,
                                                     @Param("offset") int offset,
                                                     @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword);
}
