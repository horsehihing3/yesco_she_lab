package com.smartehs.mapper;

import com.smartehs.model.ChemicalIncoming;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChemicalIncomingMapper {

    List<ChemicalIncoming> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    ChemicalIncoming findById(@Param("id") Long id);

    int countByIncomingNoStartingWith(@Param("prefix") String prefix);

    void insert(ChemicalIncoming chemicalIncoming);
    void update(ChemicalIncoming chemicalIncoming);
    void softDelete(@Param("id") Long id);

    List<ChemicalIncoming> search(@Param("keyword") String keyword,
                                                     @Param("offset") int offset,
                                                     @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword);
}
