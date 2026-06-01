package com.smartehs.mapper;

import com.smartehs.model.ChemicalGhs;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChemicalGhsMapper {

    List<ChemicalGhs> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    ChemicalGhs findById(@Param("id") Long id);

    void insert(ChemicalGhs chemicalGhs);
    void update(ChemicalGhs chemicalGhs);
    void softDelete(@Param("id") Long id);

    List<ChemicalGhs> search(@Param("keyword") String keyword,
                                                     @Param("offset") int offset,
                                                     @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword);
}
