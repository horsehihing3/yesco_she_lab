package com.smartehs.mapper;

import com.smartehs.model.ChemicalUsage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChemicalUsageMapper {

    List<ChemicalUsage> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    ChemicalUsage findById(@Param("id") Long id);

    void insert(ChemicalUsage chemicalUsage);
    void update(ChemicalUsage chemicalUsage);
    void softDelete(@Param("id") Long id);

    List<ChemicalUsage> search(@Param("keyword") String keyword,
                                                     @Param("offset") int offset,
                                                     @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword);
}
