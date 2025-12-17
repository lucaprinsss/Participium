import { Request, Response } from 'express';
import { getAddressFromProxy } from '@controllers/geocodingController';

// Mock axios
jest.mock('axios', () => ({
  default: {
    get: jest.fn(),
    isAxiosError: jest.fn(),
  },
  get: jest.fn(),
  isAxiosError: jest.fn(),
}));

import axios from 'axios';

describe('GeocodingController Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  describe('getAddressFromProxy', () => {
    it('should return address data when valid lat and lng are provided', async () => {
      // Arrange
      const lat = '45.4642';
      const lng = '9.1900';
      mockRequest = {
        query: { lat, lng },
      };

      const mockNominatimResponse = {
        address: {
          road: 'Via Roma',
          house_number: '1',
          city: 'Milan',
        },
        display_name: 'Via Roma, 1, Milan, Italy',
      };

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: mockNominatimResponse,
      });

      // Act
      await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.get).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/reverse',
        {
          params: {
            lat: lat,
            lon: lng,
            format: 'jsonv2',
            zoom: 18,
            addressdetails: 1,
          },
          headers: {
            'User-Agent': 'Partecipium-App-Dev/1.0 (admin@tuo-dominio.com)',
            'Referer': 'http://localhost',
          },
        }
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockNominatimResponse);
    });

    it('should return 400 error when lat is missing', async () => {
      // Arrange
      mockRequest = {
        query: { lng: '9.1900' },
      };

      // Act
      await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.get).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Latitude and Longitude are required' });
    });

    it('should return 400 error when lng is missing', async () => {
      // Arrange
      mockRequest = {
        query: { lat: '45.4642' },
      };

      // Act
      await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.get).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Latitude and Longitude are required' });
    });

    it('should return 400 error when both lat and lng are missing', async () => {
      // Arrange
      mockRequest = {
        query: {},
      };

      // Act
      await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.get).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Latitude and Longitude are required' });
    });

    it('should handle errors', async () => {
      // Arrange
      const lat = '45.4642';
      const lng = '9.1900';
      mockRequest = {
        query: { lat, lng },
      };

      const error = new Error('Network error');
      (axios.get as jest.Mock).mockRejectedValueOnce(error);

      // Act
      await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error during geocoding' });
    });
  });
});