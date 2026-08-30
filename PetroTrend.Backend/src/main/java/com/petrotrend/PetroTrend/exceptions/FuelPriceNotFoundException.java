package com.petrotrend.PetroTrend.exceptions;

public class FuelPriceNotFoundException extends BaseRuntimeException {

    private static final String REASON_CODE = "FUEL_PRICE_NOT_FOUND";

    public FuelPriceNotFoundException(final String id) {
        super("Fuel price with id %s not found".formatted(id), REASON_CODE);
    }
}
