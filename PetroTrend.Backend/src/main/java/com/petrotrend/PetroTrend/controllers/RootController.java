package com.petrotrend.PetroTrend.controllers;

import com.petrotrend.PetroTrend.errors.ApiError;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootController {

    public static ResponseEntity<ApiError> handleException(ApiError apiError) {
        return new ResponseEntity<>(apiError, HttpStatusCode.valueOf(apiError.getStatus()));
    }
}
