package com.smartehs.mapper;

import com.smartehs.model.ChemicalHazardReport;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChemicalHazardReportMapper {

    List<ChemicalHazardReport> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    ChemicalHazardReport findById(@Param("id") Long id);

    void insert(ChemicalHazardReport chemicalHazardReport);
    void update(ChemicalHazardReport chemicalHazardReport);
    void softDelete(@Param("id") Long id);

    List<ChemicalHazardReport> search(@Param("keyword") String keyword,
                                                     @Param("offset") int offset,
                                                     @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword);
}
