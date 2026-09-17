package com.petrotrend.PetroTrend.errors;

import com.petrotrend.PetroTrend.controllers.RootController;
import com.petrotrend.PetroTrend.exceptions.DuplicateFuelPriceInBatchException;
import com.petrotrend.PetroTrend.exceptions.FuelPriceAlreadyExistsException;
import com.petrotrend.PetroTrend.exceptions.FuelPriceNotFoundException;
import com.petrotrend.PetroTrend.exceptions.InvalidDateRangeException;
import com.petrotrend.PetroTrend.exceptions.InvalidSortPropertyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(FuelPriceNotFoundException.class)
    public ResponseEntity<ApiError> handleFuelPriceNotFoundException(final FuelPriceNotFoundException e) {
        return RootController.handleException(new ApiError(HttpStatus.NOT_FOUND, e));
    }

    @ExceptionHandler(InvalidDateRangeException.class)
    public ResponseEntity<ApiError> handleInvalidDateRangeException(final InvalidDateRangeException e) {
        return RootController.handleException(new ApiError(HttpStatus.BAD_REQUEST, e));
    }

    @ExceptionHandler(InvalidSortPropertyException.class)
    public ResponseEntity<ApiError> handleInvalidSortPropertyException(final InvalidSortPropertyException e) {
        return RootController.handleException(new ApiError(HttpStatus.BAD_REQUEST, e));
    }

    @ExceptionHandler(DuplicateFuelPriceInBatchException.class)
    public ResponseEntity<ApiError> handleDuplicateFuelPriceInBatchException(final DuplicateFuelPriceInBatchException e) {
        return RootController.handleException(new ApiError(HttpStatus.BAD_REQUEST, e));
    }

    @ExceptionHandler(FuelPriceAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleFuelPriceAlreadyExistsException(final FuelPriceAlreadyExistsException e) {
        return RootController.handleException(new ApiError(HttpStatus.CONFLICT, e));
    }
}
