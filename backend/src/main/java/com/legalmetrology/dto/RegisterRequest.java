package com.legalmetrology.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String name;

    @NotBlank
    @jakarta.validation.constraints.Email
    private String email;

    @NotBlank
    private String password;

    @NotNull
    private com.legalmetrology.enums.Role role;

    private String phone;

    private String businessName;
    private String address;
    private String state;
    private String district;
    private String city;
    private String pincode;
}
