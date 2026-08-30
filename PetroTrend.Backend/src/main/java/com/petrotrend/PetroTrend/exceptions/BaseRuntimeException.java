package com.petrotrend.PetroTrend.exceptions;

import lombok.Getter;

@Getter
public abstract class BaseRuntimeException extends RuntimeException implements BaseException {

    private final String reasonCode;

    protected BaseRuntimeException(final String message, final String reasonCode) {
        super(message);
        this.reasonCode = reasonCode;
    }
}