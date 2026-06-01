package com.smartehs.mapper;

import com.smartehs.model.ChemicalRegulation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChemicalRegulationMapper {

    List<ChemicalRegulation> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    ChemicalRegulation findById(@Param("id") Long id);

    int countByRegCodeStartingWith(@Param("prefix") String prefix);

    void insert(ChemicalRegulation chemicalRegulation);
    void update(ChemicalRegulation chemicalRegulation);
    void softDelete(@Param("id") Long id);

    List<ChemicalRegulation> search(@Param("keyword") String keyword,
                                                     @Param("offset") int offset,
                                                     @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword);
}
