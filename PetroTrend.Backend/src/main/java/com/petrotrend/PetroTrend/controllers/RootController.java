package com.petrotrend.PetroTrend.controllers;

import com.petrotrend.PetroTrend.errors.ApiError;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;

public class RootController {

    public static ResponseEntity<ApiError> handleException(ApiError apiError) {
        return new ResponseEntity<>(apiError, HttpStatusCode.valueOf(apiError.getStatus()));
    }
}
