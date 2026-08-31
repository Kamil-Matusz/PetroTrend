package com.petrotrend.PetroTrend.exceptions;

import java.util.Collection;

public class InvalidSortPropertyException extends BaseRuntimeException {

    private static final String REASON_CODE = "INVALID_SORT_PROPERTY";

    public InvalidSortPropertyException(final String property, final Collection<String> allowed) {
        super("Sorting by %s is not supported, allowed properties: %s".formatted(property, allowed), REASON_CODE);
    }
}
