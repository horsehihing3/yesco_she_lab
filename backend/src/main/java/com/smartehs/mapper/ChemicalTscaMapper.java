package com.smartehs.mapper;

import com.smartehs.model.ChemicalTsca;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChemicalTscaMapper {

    List<ChemicalTsca> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    ChemicalTsca findById(@Param("id") Long id);

    void insert(ChemicalTsca chemicalTsca);
    void update(ChemicalTsca chemicalTsca);
    void softDelete(@Param("id") Long id);

    List<ChemicalTsca> search(@Param("keyword") String keyword,
                                                     @Param("offset") int offset,
                                                     @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword);
}
