package com.smartehs.mapper;

import com.smartehs.model.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserMapper {

    List<User> findAll();

    List<User> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    User findById(@Param("id") Long id);

    User findByUsername(@Param("username") String username);

    User findByEmail(@Param("email") String email);

    int existsByUsername(@Param("username") String username);

    int existsByEmail(@Param("email") String email);

    void updateRole(@Param("id") Long id, @Param("role") String role);
}
