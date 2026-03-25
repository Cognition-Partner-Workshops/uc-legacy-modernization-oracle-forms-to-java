package com.hrms.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Custom UserDetails implementation for Spring Security.
 *
 * Bridges the HRMS User entity with Spring Security's authentication model.
 * Replaces the legacy PKG_SECURITY session context that stored user info in a database table.
 */
public class HrmsUserDetails implements UserDetails {

    private final Long userId;
    private final String username;
    private final String email;
    private final String passwordHash;
    private final boolean accountLocked;
    private final LocalDateTime lockExpiryDate;
    private final String activeFlag;
    private final Set<GrantedAuthority> authorities;

    public HrmsUserDetails(User user) {
        this.userId = user.getUserId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.passwordHash = user.getPasswordHash();
        this.accountLocked = user.isAccountLocked();
        this.lockExpiryDate = user.getLockExpiryDate();
        this.activeFlag = user.getActiveFlag();

        this.authorities = user.getRoles().stream()
                .flatMap(role -> {
                    // Add ROLE_ prefixed authority for the role itself
                    Set<GrantedAuthority> auths = role.getPermissions().stream()
                            .map(perm -> new SimpleGrantedAuthority(perm.getPermissionName()))
                            .collect(Collectors.toSet());
                    auths.add(new SimpleGrantedAuthority("ROLE_" + role.getRoleName()));
                    return auths.stream();
                })
                .collect(Collectors.toSet());
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        if (!accountLocked) {
            return true;
        }
        // Auto-unlock if lock has expired
        return lockExpiryDate != null && lockExpiryDate.isBefore(LocalDateTime.now());
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return "Y".equals(activeFlag);
    }
}
