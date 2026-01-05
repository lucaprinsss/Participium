import { Request, Response } from 'express';
import { getAddressFromProxy, getCoordinatesFromAddress } from '@controllers/geocodingController';

// Mock axios
jest.mock('axios', () => ({
  default: {
    get: jest.fn(),
    isAxiosError: jest.fn(),
  },
  get: jest.fn(),
  isAxiosError: jest.fn(),
}));

// Mock geoValidationUtils
jest.mock('@utils/geoValidationUtils', () => ({
  isWithinTurinBoundaries: jest.fn(),
}));

import axios from 'axios';
import { isWithinTurinBoundaries } from '@utils/geoValidationUtils';

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

    it('should handle Axios error with response', async () => {
      // Arrange
      const lat = '45.4642';
      const lng = '9.1900';
      mockRequest = {
        query: { lat, lng },
      };

      const axiosError = {
        message: 'Request failed',
        response: {
          status: 404,
          data: { error: 'Not found' }
        }
      };
      (axios.isAxiosError as any).mockReturnValue(true);
      (axios.get as jest.Mock).mockRejectedValueOnce(axiosError);

      // Act
      await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.isAxiosError).toHaveBeenCalledWith(axiosError);
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ 
        error: 'External map service error', 
        details: { error: 'Not found' } 
      });
    });

    it('should handle Axios error without response', async () => {
      // Arrange
      const lat = '45.4642';
      const lng = '9.1900';
      mockRequest = {
        query: { lat, lng },
      };

      const axiosError = {
        message: 'Network timeout'
      };
      (axios.isAxiosError as any).mockReturnValue(true);
      (axios.get as jest.Mock).mockRejectedValueOnce(axiosError);

      // Act
      await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.isAxiosError).toHaveBeenCalledWith(axiosError);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error during geocoding' });
    });

    it('should handle errors', async () => {
      // Arrange
      const lat = '45.4642';
      const lng = '9.1900';
      mockRequest = {
        query: { lat, lng },
      };

      const error = new Error('Network error');
      (axios.isAxiosError as any).mockReturnValue(false);
      (axios.get as jest.Mock).mockRejectedValueOnce(error);

      // Act
      await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error during geocoding' });
    });
  });

  describe('getCoordinatesFromAddress', () => {
    it('should return coordinates when valid address is provided', async () => {
      // Arrange
      const address = 'Via Roma 42';
      mockRequest = {
        query: { address },
      };

      const mockNominatimResponse = [
        {
          lat: '45.0703393',
          lon: '7.6869005',
          display_name: 'Via Roma 42, Turin, Italy',
          boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
          address: {
            house_number: '42',
            road: 'Via Roma',
          },
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: mockNominatimResponse,
      });
      (isWithinTurinBoundaries as jest.Mock).mockReturnValue(true);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.get).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search',
        {
          params: {
            street: address,
            city: 'Torino',
            country: 'Italia',
            format: 'jsonv2',
            limit: 10, // House number present, limit is 10
            addressdetails: 1,
            viewbox: '7.5200,45.1500,7.8000,44.9700',
            countrycodes: 'it',
          },
          headers: {
            'User-Agent': 'Partecipium-App-Dev/1.0 (admin@tuo-dominio.com)',
            'Referer': 'http://localhost',
          },
        }
      );
      expect(jsonMock).toHaveBeenCalledWith({
        lat: 45.0703393,
        lng: 7.6869005,
        display_name: 'Via Roma 42, Turin, Italy',
        road: 'Via Roma',
        house_number: '42',
        requestedHouseNumber: '42',
        boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
        resultsCount: 1,
        isSpecificAddress: true,
        isVariant: false,
      });
    });

    it('should return coordinates for street name without house number', async () => {
      // Arrange
      const address = 'Via Roma';
      mockRequest = {
        query: { address },
      };

      const mockNominatimResponse = [
        {
          lat: '45.0703393',
          lon: '7.6869005',
          display_name: 'Via Roma, Turin, Italy',
          boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
          address: {
            road: 'Via Roma',
          },
        },
        {
          lat: '45.0705',
          lon: '7.6871',
          display_name: 'Via Roma, Turin, Italy',
          boundingbox: ['45.0704', '45.0706', '7.6870', '7.6872'],
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: mockNominatimResponse,
      });
      (isWithinTurinBoundaries as jest.Mock).mockReturnValue(true);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.get).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search',
        expect.objectContaining({
          params: expect.objectContaining({
            street: address,
            limit: 50, // No house number, so limit is 50
          }),
        })
      );
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: 45.0703393,
          lng: 7.6869005,
          road: 'Via Roma',
          house_number: undefined,
          resultsCount: 2,
          isSpecificAddress: false,
        })
      );
    });

    it('should return 400 error when address is missing', async () => {
      // Arrange
      mockRequest = {
        query: {},
      };

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.get).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Address is required' });
    });

    it('should return 400 error when address is empty string', async () => {
      // Arrange
      mockRequest = {
        query: { address: '' },
      };

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.get).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Address is required' });
    });

    it('should return 400 error when address is only whitespace', async () => {
      // Arrange
      mockRequest = {
        query: { address: '   ' },
      };

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.get).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Address is required' });
    });

    it('should return 404 when address is not found', async () => {
      // Arrange
      const address = 'NonExistentStreet 999';
      mockRequest = {
        query: { address },
      };

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: [], // Empty response
      });

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Address not found' });
    });

    it('should return street when house number does not match', async () => {
      // Arrange
      const address = 'Via Roma 42';
      mockRequest = {
        query: { address },
      };

      const mockNominatimResponse = [
        {
          lat: '45.0703393',
          lon: '7.6869005',
          display_name: 'Via Roma 40, Turin, Italy',
          boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
          address: {
            house_number: '40', // Different from requested 42
            road: 'Via Roma',
          },
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: mockNominatimResponse,
      });
      (isWithinTurinBoundaries as jest.Mock).mockReturnValue(true);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert - Now returns the street with houseNumberNotFound flag
      expect(jsonMock).toHaveBeenCalledWith({
        lat: 45.0703393,
        lng: 7.6869005,
        display_name: 'Via Roma 40, Turin, Italy',
        road: 'Via Roma',
        house_number: null,
        requestedHouseNumber: '42',
        boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
        resultsCount: 1,
        isSpecificAddress: false,
        houseNumberNotFound: true,
      });
    });

    it('should return street when result has no house number but one was requested', async () => {
      // Arrange
      const address = 'Via Roma 42';
      mockRequest = {
        query: { address },
      };

      const mockNominatimResponse = [
        {
          lat: '45.0703393',
          lon: '7.6869005',
          display_name: 'Via Roma, Turin, Italy',
          boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
          address: {
            road: 'Via Roma',
            // No house_number
          },
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: mockNominatimResponse,
      });
      (isWithinTurinBoundaries as jest.Mock).mockReturnValue(true);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert - Now returns the street with houseNumberNotFound flag
      expect(jsonMock).toHaveBeenCalledWith({
        lat: 45.0703393,
        lng: 7.6869005,
        display_name: 'Via Roma, Turin, Italy',
        road: 'Via Roma',
        house_number: null,
        requestedHouseNumber: '42',
        boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
        resultsCount: 1,
        isSpecificAddress: false,
        houseNumberNotFound: true,
      });
    });

    it('should handle address with alphanumeric house number', async () => {
      // Arrange
      const address = 'Via Garibaldi 42a';
      mockRequest = {
        query: { address },
      };

      const mockNominatimResponse = [
        {
          lat: '45.0703393',
          lon: '7.6869005',
          display_name: 'Via Garibaldi 42a, Turin, Italy',
          boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
          address: {
            house_number: '42a',
            road: 'Via Garibaldi',
          },
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: mockNominatimResponse,
      });
      (isWithinTurinBoundaries as jest.Mock).mockReturnValue(true);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: 45.0703393,
          lng: 7.6869005,
          road: 'Via Garibaldi',
          house_number: '42a',
          isSpecificAddress: true,
        })
      );
    });

    it('should calculate overall bounding box for multiple results', async () => {
      // Arrange
      const address = 'Via Roma';
      mockRequest = {
        query: { address },
      };

      const mockNominatimResponse = [
        {
          lat: '45.0703',
          lon: '7.6869',
          display_name: 'Via Roma, Turin, Italy',
          boundingbox: ['45.0700', '45.0705', '7.6865', '7.6870'],
        },
        {
          lat: '45.0710',
          lon: '7.6875',
          display_name: 'Via Roma, Turin, Italy',
          boundingbox: ['45.0708', '45.0712', '7.6873', '7.6877'],
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: mockNominatimResponse,
      });
      (isWithinTurinBoundaries as jest.Mock).mockReturnValue(true);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          boundingbox: ['45.07', '45.0712', '7.6865', '7.6877'], // Overall bbox
          resultsCount: 2,
        })
      );
    });

    it('should ignore 5-digit postal codes when extracting house numbers', async () => {
      // Arrange - Address like "Via Roma, 10100 Torino" should not extract 10100 as house number
      const address = 'Via Roma, 10100 Torino';
      mockRequest = {
        query: { address },
      };

      const mockNominatimResponse = [
        {
          lat: '45.0703393',
          lon: '7.6869005',
          display_name: 'Via Roma, 10100 Turin, Italy',
          boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
          address: {
            road: 'Via Roma',
            postcode: '10100',
          },
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: mockNominatimResponse,
      });
      (isWithinTurinBoundaries as jest.Mock).mockReturnValue(true);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert - Should be treated as street without house number (limit 50)
      expect(axios.get).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search',
        expect.objectContaining({
          params: expect.objectContaining({
            limit: 50,
          }),
        })
      );
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          isSpecificAddress: false,
        })
      );
    });

    it('should handle Axios error with response', async () => {
      // Arrange
      const address = 'Via Roma';
      mockRequest = {
        query: { address },
      };

      const axiosError = {
        message: 'Request failed',
        response: {
          status: 503,
          data: { error: 'Service unavailable' },
        },
      };
      (axios.isAxiosError as any).mockReturnValue(true);
      (axios.get as jest.Mock).mockRejectedValueOnce(axiosError);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.isAxiosError).toHaveBeenCalledWith(axiosError);
      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'External map service error',
        details: { error: 'Service unavailable' },
      });
    });

    it('should handle Axios error without response', async () => {
      // Arrange
      const address = 'Via Roma';
      mockRequest = {
        query: { address },
      };

      const axiosError = {
        message: 'Network timeout',
      };
      (axios.isAxiosError as any).mockReturnValue(true);
      (axios.get as jest.Mock).mockRejectedValueOnce(axiosError);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.isAxiosError).toHaveBeenCalledWith(axiosError);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error during address search' });
    });

    it('should handle non-Axios errors', async () => {
      // Arrange
      const address = 'Via Roma';
      mockRequest = {
        query: { address },
      };

      const error = new Error('Unknown error');
      (axios.isAxiosError as any).mockReturnValue(false);
      (axios.get as jest.Mock).mockRejectedValueOnce(error);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error during address search' });
    });

    it('should send correct headers to Nominatim API', async () => {
      // Arrange
      const address = 'Via Roma';
      mockRequest = {
        query: { address },
      };

      const mockNominatimResponse = [
        {
          lat: '45.0703393',
          lon: '7.6869005',
          display_name: 'Via Roma, Turin, Italy',
          boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: mockNominatimResponse,
      });

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.get).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search',
        expect.objectContaining({
          headers: {
            'User-Agent': 'Partecipium-App-Dev/1.0 (admin@tuo-dominio.com)',
            'Referer': 'http://localhost',
          },
        })
      );
    });

    it('should include Turin viewbox in request parameters', async () => {
      // Arrange
      const address = 'Via Roma';
      mockRequest = {
        query: { address },
      };

      const mockNominatimResponse = [
        {
          lat: '45.0703393',
          lon: '7.6869005',
          display_name: 'Via Roma, Turin, Italy',
          boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: mockNominatimResponse,
      });
      (isWithinTurinBoundaries as jest.Mock).mockReturnValue(true);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(axios.get).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search',
        expect.objectContaining({
          params: expect.objectContaining({
            viewbox: '7.5200,45.1500,7.8000,44.9700',
            countrycodes: 'it',
          }),
        })
      );
    });

    it('should find house number variant (34a when searching for 34)', async () => {
      // Arrange
      const address = 'Corso Castelfidardo 34';
      mockRequest = {
        query: { address },
      };

      const mockNominatimResponse = [
        {
          lat: '45.0703393',
          lon: '7.6869005',
          display_name: 'Corso Castelfidardo 34a, Turin, Italy',
          boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
          address: {
            house_number: '34a',
            road: 'Corso Castelfidardo',
          },
        },
        {
          lat: '45.0703500',
          lon: '7.6869100',
          display_name: 'Corso Castelfidardo 34b, Turin, Italy',
          boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
          address: {
            house_number: '34b',
            road: 'Corso Castelfidardo',
          },
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: mockNominatimResponse,
      });
      (isWithinTurinBoundaries as jest.Mock).mockReturnValue(true);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert - Should find 34a as it starts with 34
      expect(jsonMock).toHaveBeenCalledWith({
        lat: 45.0703393,
        lng: 7.6869005,
        display_name: 'Corso Castelfidardo 34a, Turin, Italy',
        road: 'Corso Castelfidardo',
        house_number: '34a',
        requestedHouseNumber: '34',
        boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
        resultsCount: 1,
        isSpecificAddress: true,
        isVariant: true,
      });
    });

    it('should filter out results outside Turin boundaries', async () => {
      // Arrange
      const address = 'Via Roma';
      mockRequest = {
        query: { address },
      };

      const mockNominatimResponse = [
        {
          lat: '45.0703393',
          lon: '7.6869005',
          display_name: 'Via Roma, Milan, Italy',
          boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
          address: {
            road: 'Via Roma',
          },
        },
        {
          lat: '45.0705',
          lon: '7.6871',
          display_name: 'Via Roma, Turin, Italy',
          boundingbox: ['45.0704', '45.0706', '7.6870', '7.6872'],
          address: {
            road: 'Via Roma',
          },
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: mockNominatimResponse,
      });
      
      // First result is outside Turin, second is inside
      (isWithinTurinBoundaries as jest.Mock)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert - Should only use the result inside Turin boundaries
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: 45.0705,
          lng: 7.6871,
          resultsCount: 1, // Only one valid result after filtering
        })
      );
    });

    it('should return 404 when all results are outside Turin boundaries', async () => {
      // Arrange
      const address = 'Via Roma';
      mockRequest = {
        query: { address },
      };

      const mockNominatimResponse = [
        {
          lat: '45.4642',
          lon: '9.1900',
          display_name: 'Via Roma, Milan, Italy',
          boundingbox: ['45.4640', '45.4644', '9.1898', '9.1902'],
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: mockNominatimResponse,
      });
      (isWithinTurinBoundaries as jest.Mock).mockReturnValue(false);

      // Act
      await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'No valid addresses found within Turin city boundaries',
        details: 'All results are outside the Turin municipality area',
      });
    });
  });
});