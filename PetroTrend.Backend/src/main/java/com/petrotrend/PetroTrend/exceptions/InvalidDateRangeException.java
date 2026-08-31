package com.petrotrend.PetroTrend.exceptions;

import java.time.LocalDate;

public class InvalidDateRangeException extends BaseRuntimeException {

    private static final String REASON_CODE = "INVALID_DATE_RANGE";

    public InvalidDateRangeException(final LocalDate from, final LocalDate to) {
        super("Date range start %s must not be after end %s".formatted(from, to), REASON_CODE);
    }
}
