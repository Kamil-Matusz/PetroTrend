package com.petrotrend.PetroTrend.services;

import com.petrotrend.PetroTrend.dto.FuelPriceRequest;
import com.petrotrend.PetroTrend.dto.FuelPriceResponse;
import com.petrotrend.PetroTrend.entities.FuelPrice;
import com.petrotrend.PetroTrend.exceptions.FuelPriceAlreadyExistsException;
import com.petrotrend.PetroTrend.exceptions.FuelPriceNotFoundException;
import com.petrotrend.PetroTrend.mappers.FuelPriceMapper;
import com.petrotrend.PetroTrend.repositories.FuelPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FuelPriceService {

    private final FuelPriceRepository fuelPriceRepository;
    private final FuelPriceMapper fuelPriceMapper;

    public List<FuelPriceResponse> findAll() {
        return fuelPriceMapper.convertToResponses(fuelPriceRepository.findAll());
    }

    public FuelPriceResponse findById(final String id) {
        return fuelPriceMapper.convertToResponse(getOrThrow(id));
    }

    public FuelPriceResponse create(final FuelPriceRequest request) {
        final FuelPrice fuelPrice = fuelPriceMapper.convertToDto(request);
        return fuelPriceMapper.convertToResponse(save(fuelPrice, request));
    }

    public FuelPriceResponse update(final String id, final FuelPriceRequest request) {
        final FuelPrice fuelPrice = getOrThrow(id);
        fuelPriceMapper.convertToEntity(request, fuelPrice);
        return fuelPriceMapper.convertToResponse(save(fuelPrice, request));
    }

    public void delete(final String id) {
        fuelPriceRepository.delete(getOrThrow(id));
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
