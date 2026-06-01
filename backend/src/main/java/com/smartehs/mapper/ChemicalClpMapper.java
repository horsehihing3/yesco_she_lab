package com.smartehs.mapper;

import com.smartehs.model.ChemicalClp;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChemicalClpMapper {

    List<ChemicalClp> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    ChemicalClp findById(@Param("id") Long id);

    void insert(ChemicalClp chemicalClp);
    void update(ChemicalClp chemicalClp);
    void softDelete(@Param("id") Long id);

    List<ChemicalClp> search(@Param("keyword") String keyword,
                                                     @Param("offset") int offset,
                                                     @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword);
}
