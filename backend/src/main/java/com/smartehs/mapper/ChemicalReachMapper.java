package com.smartehs.mapper;

import com.smartehs.model.ChemicalReach;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChemicalReachMapper {

    List<ChemicalReach> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    ChemicalReach findById(@Param("id") Long id);

    void insert(ChemicalReach chemicalReach);
    void update(ChemicalReach chemicalReach);
    void softDelete(@Param("id") Long id);

    List<ChemicalReach> search(@Param("keyword") String keyword,
                                                     @Param("offset") int offset,
                                                     @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword);
}
