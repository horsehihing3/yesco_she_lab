package com.smartehs.mapper;

import com.smartehs.model.ChemicalWarehouse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChemicalWarehouseMapper {

    List<ChemicalWarehouse> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    ChemicalWarehouse findById(@Param("id") Long id);

    int countByWarehouseCodeStartingWith(@Param("prefix") String prefix);

    void insert(ChemicalWarehouse chemicalWarehouse);
    void update(ChemicalWarehouse chemicalWarehouse);
    void softDelete(@Param("id") Long id);

    List<ChemicalWarehouse> search(@Param("keyword") String keyword,
                                                     @Param("offset") int offset,
                                                     @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword);
}
