package com.smartehs.mapper;

import com.smartehs.model.UserAccessList;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserAccessListMapper {

    List<UserAccessList> findAll();

    List<UserAccessList> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    UserAccessList findById(@Param("id") Long id);

    UserAccessList findByUserMail(@Param("userMail") String userMail);

    void insert(UserAccessList userAccessList);

    void update(UserAccessList userAccessList);

    void delete(@Param("id") Long id);
}
