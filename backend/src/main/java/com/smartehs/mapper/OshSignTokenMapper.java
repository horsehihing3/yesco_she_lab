package com.smartehs.mapper;

import com.smartehs.model.OshSignToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface OshSignTokenMapper {

    void insert(OshSignToken token);

    OshSignToken findByToken(@Param("token") String token);

    void markUsed(@Param("token") String token);
}
