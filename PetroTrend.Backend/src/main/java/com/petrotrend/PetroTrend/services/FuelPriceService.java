package com.petrotrend.PetroTrend.services;

import com.petrotrend.PetroTrend.dto.FuelPriceBatchRequest;
import com.petrotrend.PetroTrend.dto.FuelPriceBatchResponse;
import com.petrotrend.PetroTrend.dto.FuelPriceFilter;
import com.petrotrend.PetroTrend.dto.FuelPriceRequest;
import com.petrotrend.PetroTrend.dto.FuelPriceResponse;
import com.petrotrend.PetroTrend.entities.FuelPrice;
import com.petrotrend.PetroTrend.enums.FuelSymbol;
import com.petrotrend.PetroTrend.exceptions.FuelPriceAlreadyExistsException;
import com.petrotrend.PetroTrend.exceptions.FuelPriceNotFoundException;
import com.petrotrend.PetroTrend.mappers.FuelPriceMapper;
import com.petrotrend.PetroTrend.repositories.FuelPriceRepository;
import com.petrotrend.PetroTrend.validators.FuelPriceValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FuelPriceService {

    private final FuelPriceRepository fuelPriceRepository;
    private final FuelPriceMapper fuelPriceMapper;

    public List<FuelPriceResponse> findAll() {
        return fuelPriceMapper.convertToResponses(fuelPriceRepository.findAll());
    }

    public Page<FuelPriceResponse> search(final FuelPriceFilter filter, final Pageable pageable) {
        FuelPriceValidator.validateDateRange(filter.from(), filter.to());
        FuelPriceValidator.validateSort(pageable);
        return fuelPriceRepository.search(filter, pageable).map(fuelPriceMapper::convertToResponse);
    }

    public List<FuelPriceResponse> findLatestPerFuel(final Set<FuelSymbol> fuelSymbols) {
        return fuelPriceMapper.convertToResponses(fuelPriceRepository.findLatestPerFuel(fuelSymbols));
    }

    public List<FuelPriceResponse> findCurrentMonth() {
        final YearMonth currentMonth = YearMonth.now();
        return findByDateRange(currentMonth.atDay(1), currentMonth.atEndOfMonth());
    }

    public List<FuelPriceResponse> findByDateRange(final LocalDate from, final LocalDate to) {
        FuelPriceValidator.validateDateRange(from, to);
        return fuelPriceMapper.convertToResponses(
                fuelPriceRepository.findInDateRange(from, to));
    }

    public FuelPriceResponse findById(final String id) {
        return fuelPriceMapper.convertToResponse(getOrThrow(id));
    }

    public FuelPriceResponse create(final FuelPriceRequest request) {
        final FuelPrice fuelPrice = fuelPriceMapper.convertToDto(request);
        return fuelPriceMapper.convertToResponse(save(fuelPrice, request));
    }

    /**
     * Unlike {@link #create}, a batch overwrites the reading already held for a fuel, currency and
     * day instead of rejecting it - the response keeps both outcomes apart so nothing is silent.
     */
    public FuelPriceBatchResponse createBatch(final FuelPriceBatchRequest request) {
        FuelPriceValidator.validateNoDuplicates(request.prices());

        final List<FuelPriceResponse> created = new ArrayList<>();
        final List<FuelPriceResponse> updated = new ArrayList<>();
        for (final FuelPriceRequest price : request.prices()) {
            fuelPriceRepository
                    .findByFuelSymbolAndCurrencyAndDate(price.fuelSymbol(), price.currency(), price.date())
                    .ifPresentOrElse(existing -> updated.add(overwrite(existing, price)),
                                     () -> created.add(create(price)));
        }
        return new FuelPriceBatchResponse(created, updated);
    }

    public FuelPriceResponse update(final String id, final FuelPriceRequest request) {
        final FuelPrice fuelPrice = getOrThrow(id);
        fuelPriceMapper.convertToEntity(request, fuelPrice);
        return fuelPriceMapper.convertToResponse(save(fuelPrice, request));
    }

    public void delete(final String id) {
        fuelPriceRepository.delete(getOrThrow(id));
    }

    public void deleteByDateRange(final LocalDate from, final LocalDate to) {
        FuelPriceValidator.validateDateRange(from, to);
        fuelPriceRepository.deleteInDateRange(from, to);
    }

    private FuelPriceResponse overwrite(final FuelPrice existing, final FuelPriceRequest request) {
        fuelPriceMapper.convertToEntity(request, existing);
        return fuelPriceMapper.convertToResponse(save(existing, request));
    }

    private FuelPrice getOrThrow(final String id) {
        return fuelPriceRepository.findById(id).orElseThrow(() -> new FuelPriceNotFoundException(id));
    }

    private FuelPrice save(final FuelPrice fuelPrice, final FuelPriceRequest request) {
        try {
            return fuelPriceRepository.save(fuelPrice);
        } catch (final DuplicateKeyException exception) {
            throw new FuelPriceAlreadyExistsException(request.fuelSymbol(), request.currency(), request.date());
        }
    }
}
