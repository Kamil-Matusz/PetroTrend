package com.petrotrend.PetroTrend.errors;

import com.petrotrend.PetroTrend.controllers.RootController;
import com.petrotrend.PetroTrend.exceptions.FuelPriceAlreadyExistsException;
import com.petrotrend.PetroTrend.exceptions.FuelPriceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;

public class GlobalExceptionHandler {

    @ExceptionHandler(FuelPriceNotFoundException.class)
    public ResponseEntity<ApiError> handleFuelPriceNotFoundException(final FuelPriceNotFoundException e) {
        return RootController.handleException(new ApiError(HttpStatus.NOT_FOUND, e));
    }

    @ExceptionHandler(FuelPriceAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleFuelPriceAlreadyExistsException(final FuelPriceAlreadyExistsException e) {
        return RootController.handleException(new ApiError(HttpStatus.CONFLICT, e));
    }
}
