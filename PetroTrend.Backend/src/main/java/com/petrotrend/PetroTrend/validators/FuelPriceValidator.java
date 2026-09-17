package com.petrotrend.PetroTrend.validators;

import com.petrotrend.PetroTrend.exceptions.InvalidDateRangeException;
import com.petrotrend.PetroTrend.exceptions.InvalidSortPropertyException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.Set;

public final class FuelPriceValidator {

    public static final Set<String> SORTABLE_PROPERTIES = Set.of("date", "price");

    private FuelPriceValidator() {}

    public static void validateDateRange(final LocalDate from, final LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new InvalidDateRangeException(from, to);
        }
    }

    public static void validateSort(final Pageable pageable) {
        for (final Sort.Order order : pageable.getSort()) {
            if (!SORTABLE_PROPERTIES.contains(order.getProperty())) {
                throw new InvalidSortPropertyException(order.getProperty(), SORTABLE_PROPERTIES);
            }
        }
    }
}