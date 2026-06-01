package com.smartehs.service;

import com.smartehs.dto.response.UserInfoResponse;
import com.smartehs.model.User;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public List<UserInfoResponse> findAll() {
        return userMapper.findAll().stream()
                .filter(user -> Boolean.TRUE.equals(user.getActive()))
                .map(UserInfoResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<UserInfoResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        List<UserInfoResponse> content = userMapper.findAllWithPaging(offset, limit).stream()
                .map(UserInfoResponse::from)
                .collect(Collectors.toList());
        int total = userMapper.countAll();

        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public UserInfoResponse findById(Long id) {
        User user = userMapper.findById(id);
        if (user == null) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        return UserInfoResponse.from(user);
    }

    @Transactional(readOnly = true)
    public UserInfoResponse findByUsername(String username) {
        User user = userMapper.findByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException("User", "username", username);
        }
        return UserInfoResponse.from(user);
    }

    @Transactional(readOnly = true)
    public UserInfoResponse findByEmail(String email) {
        User user = userMapper.findByEmail(email);
        if (user == null) {
            throw new ResourceNotFoundException("User", "email", email);
        }
        return UserInfoResponse.from(user);
    }

    @Transactional
    public void updateRole(Long id, String role) {
        User user = userMapper.findById(id);
        if (user == null) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userMapper.updateRole(id, role);
    }

    @Transactional(readOnly = true)
    public Map<String, List<UserInfoResponse>> findAllGroupedByDepartment() {
        List<User> users = userMapper.findAll().stream()
                .filter(user -> Boolean.TRUE.equals(user.getActive()))
                .collect(Collectors.toList());

        return users.stream()
                .map(UserInfoResponse::from)
                .collect(Collectors.groupingBy(
                        user -> user.getDepartment() != null ? user.getDepartment() : "기타",
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }
}
