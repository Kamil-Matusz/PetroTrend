package com.petrotrend.PetroTrend.validators;

import com.petrotrend.PetroTrend.dto.FuelPriceRequest;
import com.petrotrend.PetroTrend.exceptions.DuplicateFuelPriceInBatchException;
import com.petrotrend.PetroTrend.exceptions.InvalidDateRangeException;
import com.petrotrend.PetroTrend.exceptions.InvalidSortPropertyException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class FuelPriceValidator {

    public static final Set<String> SORTABLE_PROPERTIES = Set.of("date", "price");

    private FuelPriceValidator() {}

    public static void validateDateRange(final LocalDate from, final LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new InvalidDateRangeException(from, to);
        }
    }

    public static void validateNoDuplicates(final List<FuelPriceRequest> requests) {
        final Set<List<Object>> seen = new HashSet<>();
        for (final FuelPriceRequest request : requests) {
            if (!seen.add(List.of(request.fuelSymbol(), request.currency(), request.date()))) {
                throw new DuplicateFuelPriceInBatchException(request.fuelSymbol(), request.currency(), request.date());
            }
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