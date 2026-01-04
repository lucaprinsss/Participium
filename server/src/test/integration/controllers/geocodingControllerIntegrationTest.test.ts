import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Request, Response } from 'express';
import axios from 'axios';
import { getCoordinatesFromAddress, getAddressFromProxy } from '../../../controllers/geocodingController';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GeocodingController Integration Tests', () => {

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Setup mock response object
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockResponse = {
      status: statusMock as any,
      json: jsonMock as any,
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- GET /api/proxy/coordinates (getCoordinatesFromAddress) ---
  describe('getCoordinatesFromAddress', () => {

    describe('Success Cases', () => {
      it('should return coordinates for a valid street name without house number', async () => {
        const mockNominatimResponse = [
          {
            lat: '45.0703393',
            lon: '7.6869005',
            display_name: 'Via Roma, Turin, Italy',
            boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
            address: {
              road: 'Via Roma'
            }
          },
          {
            lat: '45.0705',
            lon: '7.6871',
            display_name: 'Via Roma, Turin, Italy',
            boundingbox: ['45.0704', '45.0706', '7.6870', '7.6872']
          }
        ];

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { address: 'Via Roma' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://nominatim.openstreetmap.org/search',
          expect.objectContaining({
            params: expect.objectContaining({
              street: 'Via Roma',
              city: 'Torino',
              country: 'Italia',
              format: 'jsonv2',
              limit: 50, // No house number, so limit is 50
              addressdetails: 1
            })
          })
        );

        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            lat: 45.0703393,
            lng: 7.6869005,
            display_name: 'Via Roma, Turin, Italy',
            resultsCount: 2,
            isSpecificAddress: false
          })
        );
      });

      it('should return coordinates for a valid address with house number', async () => {
        const mockNominatimResponse = [
          {
            lat: '45.0703393',
            lon: '7.6869005',
            display_name: 'Via Roma 42, Turin, Italy',
            boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
            address: {
              house_number: '42',
              road: 'Via Roma'
            }
          }
        ];

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { address: 'Via Roma 42' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://nominatim.openstreetmap.org/search',
          expect.objectContaining({
            params: expect.objectContaining({
              street: 'Via Roma 42',
              city: 'Torino',
              limit: 10 // House number present, limit is 10
            })
          })
        );

        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            lat: 45.0703393,
            lng: 7.6869005,
            display_name: 'Via Roma 42, Turin, Italy',
            resultsCount: 1,
            isSpecificAddress: true
          })
        );
      });

      it('should handle address with house number containing letters (42a)', async () => {
        const mockNominatimResponse = [
          {
            lat: '45.0703393',
            lon: '7.6869005',
            display_name: 'Via Garibaldi 42a, Turin, Italy',
            boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
            address: {
              house_number: '42a',
              road: 'Via Garibaldi'
            }
          }
        ];

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { address: 'Via Garibaldi 42a' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            lat: 45.0703393,
            lng: 7.6869005,
            isSpecificAddress: true
          })
        );
      });

      it('should calculate overall bounding box for multiple results', async () => {
        const mockNominatimResponse = [
          {
            lat: '45.0703',
            lon: '7.6869',
            display_name: 'Via Roma, Turin, Italy',
            boundingbox: ['45.0700', '45.0705', '7.6865', '7.6870']
          },
          {
            lat: '45.0710',
            lon: '7.6875',
            display_name: 'Via Roma, Turin, Italy',
            boundingbox: ['45.0708', '45.0712', '7.6873', '7.6877']
          }
        ];

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { address: 'Via Roma' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            boundingbox: ['45.07', '45.0712', '7.6865', '7.6877'], // Overall bbox
            resultsCount: 2
          })
        );
      });

      it('should use first result boundingbox when overall calculation not possible', async () => {
        const mockNominatimResponse = [
          {
            lat: '45.0703',
            lon: '7.6869',
            display_name: 'Via Roma, Turin, Italy',
            boundingbox: ['45.0700', '45.0705', '7.6865', '7.6870']
          }
        ];

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { address: 'Via Roma' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        // The boundingbox should match the first result's bbox
        const receivedCall = jsonMock.mock.calls[0][0] as any;
        expect(receivedCall.boundingbox).toBeDefined();
        expect(receivedCall.boundingbox).toHaveLength(4);
        expect(receivedCall.isSpecificAddress).toBe(false);
      });
    });

    describe('Validation - Missing or Invalid Input', () => {
      it('should return 400 if address is missing', async () => {
        mockRequest = {
          query: {}
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Address is required'
        });
        expect(mockedAxios.get).not.toHaveBeenCalled();
      });

      it('should return 400 if address is empty string', async () => {
        mockRequest = {
          query: { address: '' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Address is required'
        });
      });

      it('should return 400 if address is only whitespace', async () => {
        mockRequest = {
          query: { address: '   ' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Address is required'
        });
      });
    });

    describe('Not Found Cases', () => {
      it('should return 404 if address is not found', async () => {
        mockedAxios.get.mockResolvedValue({ data: [] });

        mockRequest = {
          query: { address: 'Via NonExistent 999' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Address not found'
        });
      });

      it('should return street when house number does not match', async () => {
        const mockNominatimResponse = [
          {
            lat: '45.0703393',
            lon: '7.6869005',
            display_name: 'Via Roma 40, Turin, Italy',
            boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
            address: {
              house_number: '40', // Different from requested 42
              road: 'Via Roma'
            }
          }
        ];

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { address: 'Via Roma 42' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            lat: 45.0703393,
            lng: 7.6869005,
            road: 'Via Roma',
            house_number: null,
            requestedHouseNumber: '42',
            isSpecificAddress: false,
            houseNumberNotFound: true
          })
        );
      });

      it('should return street when result has no house number but one was requested', async () => {
        const mockNominatimResponse = [
          {
            lat: '45.0703393',
            lon: '7.6869005',
            display_name: 'Via Roma, Turin, Italy',
            boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
            address: {
              road: 'Via Roma'
              // No house_number
            }
          }
        ];

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { address: 'Via Roma 42' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            lat: 45.0703393,
            lng: 7.6869005,
            road: 'Via Roma',
            house_number: null,
            requestedHouseNumber: '42',
            isSpecificAddress: false,
            houseNumberNotFound: true
          })
        );
      });
    });

    describe('Error Handling - External Service Errors', () => {
      it('should return 500 for axios errors without response', async () => {
        const mockError = new Error('Network Error');
        (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);
        mockedAxios.get.mockRejectedValue(mockError);

        mockRequest = {
          query: { address: 'Via Roma' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Internal server error during address search'
        });
      });

      it('should return external service error status for Nominatim errors', async () => {
        const mockError = {
          response: {
            status: 503,
            data: { error: 'Service unavailable' }
          },
          message: 'Request failed with status code 503'
        };
        
        (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);
        mockedAxios.get.mockRejectedValue(mockError);

        mockRequest = {
          query: { address: 'Via Roma' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(503);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'External map service error',
          details: { error: 'Service unavailable' }
        });
      });

      it('should return 500 for non-axios errors', async () => {
        const mockError = new Error('Unknown error');
        (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(false);
        mockedAxios.get.mockRejectedValue(mockError);

        mockRequest = {
          query: { address: 'Via Roma' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Internal server error during address search'
        });
      });

      it('should handle timeout errors', async () => {
        const mockError = {
          response: {
            status: 504,
            data: { error: 'Gateway timeout' }
          },
          message: 'Timeout'
        };
        
        (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);
        mockedAxios.get.mockRejectedValue(mockError);

        mockRequest = {
          query: { address: 'Via Roma' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(504);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'External map service error',
          details: { error: 'Gateway timeout' }
        });
      });
    });

    describe('Edge Cases', () => {
      it('should ignore 5-digit postal codes when extracting house numbers', async () => {
        // Address like "Via Roma, 10100 Torino" should not extract 10100 as house number
        const mockNominatimResponse = [
          {
            lat: '45.0703393',
            lon: '7.6869005',
            display_name: 'Via Roma, 10100 Turin, Italy',
            boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
            address: {
              road: 'Via Roma',
              postcode: '10100'
            }
          }
        ];

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { address: 'Via Roma, 10100 Torino' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        // Should be treated as street without house number (limit 50)
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://nominatim.openstreetmap.org/search',
          expect.objectContaining({
            params: expect.objectContaining({
              limit: 50
            })
          })
        );

        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            isSpecificAddress: false
          })
        );
      });

      it('should handle addresses with special characters', async () => {
        const mockNominatimResponse = [
          {
            lat: '45.0703393',
            lon: '7.6869005',
            display_name: "Corso d'Italia 15, Turin, Italy",
            boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870'],
            address: {
              house_number: '15',
              road: "Corso d'Italia"
            }
          }
        ];

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { address: "Corso d'Italia 15" }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            lat: 45.0703393,
            lng: 7.6869005,
            isSpecificAddress: true
          })
        );
      });
    });

    describe('API Request Parameters', () => {
      it('should send correct headers to Nominatim API', async () => {
        const mockNominatimResponse = [{
          lat: '45.0703393',
          lon: '7.6869005',
          display_name: 'Via Roma, Turin, Italy',
          boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870']
        }];

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { address: 'Via Roma' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://nominatim.openstreetmap.org/search',
          expect.objectContaining({
            headers: {
              'User-Agent': 'Partecipium-App-Dev/1.0 (admin@tuo-dominio.com)',
              'Referer': 'http://localhost'
            }
          })
        );
      });

      it('should include Turin viewbox in request parameters', async () => {
        const mockNominatimResponse = [{
          lat: '45.0703393',
          lon: '7.6869005',
          display_name: 'Via Roma, Turin, Italy',
          boundingbox: ['45.0703', '45.0704', '7.6868', '7.6870']
        }];

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { address: 'Via Roma' }
        };

        await getCoordinatesFromAddress(mockRequest as Request, mockResponse as Response);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://nominatim.openstreetmap.org/search',
          expect.objectContaining({
            params: expect.objectContaining({
              viewbox: '7.5200,45.1500,7.8000,44.9700',
              countrycodes: 'it'
            })
          })
        );
      });
    });
  });

  // --- GET /api/proxy/address (getAddressFromProxy) ---
  describe('getAddressFromProxy', () => {

    describe('Success Cases', () => {
      it('should return address for valid coordinates', async () => {
        const mockNominatimResponse = {
          address: {
            road: 'Via Roma',
            house_number: '42',
            city: 'Turin',
            town: undefined,
            village: undefined
          },
          display_name: 'Via Roma 42, 10100 Turin, Italy'
        };

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { lat: '45.0703393', lng: '7.6869005' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://nominatim.openstreetmap.org/reverse',
          expect.objectContaining({
            params: {
              lat: '45.0703393',
              lon: '7.6869005',
              format: 'jsonv2',
              zoom: 18,
              addressdetails: 1
            }
          })
        );

        expect(jsonMock).toHaveBeenCalledWith(mockNominatimResponse);
      });

      it('should handle coordinates at edge of valid range', async () => {
        const mockNominatimResponse = {
          address: {
            city: 'North Pole'
          },
          display_name: 'North Pole'
        };

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { lat: '90', lng: '180' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith(mockNominatimResponse);
      });

      it('should handle negative coordinates (Southern hemisphere)', async () => {
        const mockNominatimResponse = {
          address: {
            city: 'Sydney',
            road: 'George Street'
          },
          display_name: 'George Street, Sydney, Australia'
        };

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { lat: '-33.8688', lng: '151.2093' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith(mockNominatimResponse);
      });

      it('should handle response without house number', async () => {
        const mockNominatimResponse = {
          address: {
            road: 'Unknown Road',
            city: 'Unknown City'
          },
          display_name: 'Unknown Road, Unknown City'
        };

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { lat: '0', lng: '0' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith(mockNominatimResponse);
      });

      it('should handle high precision coordinates', async () => {
        const mockNominatimResponse = {
          address: {
            road: 'Via Roma',
            house_number: '42',
            city: 'Turin'
          },
          display_name: 'Via Roma 42, Turin, Italy'
        };

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { lat: '45.070339299999999', lng: '7.686900500000001' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith(mockNominatimResponse);
      });
    });

    describe('Validation - Missing Parameters', () => {
      it('should return 400 if latitude is missing', async () => {
        mockRequest = {
          query: { lng: '7.6869005' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Latitude and Longitude are required'
        });
        expect(mockedAxios.get).not.toHaveBeenCalled();
      });

      it('should return 400 if longitude is missing', async () => {
        mockRequest = {
          query: { lat: '45.0703393' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Latitude and Longitude are required'
        });
      });

      it('should return 400 if both lat and lng are missing', async () => {
        mockRequest = {
          query: {}
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Latitude and Longitude are required'
        });
      });
    });

    describe('Error Handling - External Service Errors', () => {
      it('should return 500 for axios errors without response', async () => {
        const mockError = new Error('Network Error');
        (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);
        mockedAxios.get.mockRejectedValue(mockError);

        mockRequest = {
          query: { lat: '45.0703393', lng: '7.6869005' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Internal server error during geocoding'
        });
      });

      it('should return external service error status for Nominatim errors', async () => {
        const mockError = {
          response: {
            status: 503,
            data: { error: 'Service unavailable' }
          },
          message: 'Request failed with status code 503'
        };
        
        (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);
        mockedAxios.get.mockRejectedValue(mockError);

        mockRequest = {
          query: { lat: '45.0703393', lng: '7.6869005' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(503);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'External map service error',
          details: { error: 'Service unavailable' }
        });
      });

      it('should return 500 for non-axios errors', async () => {
        const mockError = new Error('Unknown error');
        (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(false);
        mockedAxios.get.mockRejectedValue(mockError);

        mockRequest = {
          query: { lat: '45.0703393', lng: '7.6869005' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Internal server error during geocoding'
        });
      });

      it('should handle rate limiting errors (429)', async () => {
        const mockError = {
          response: {
            status: 429,
            data: { error: 'Rate limit exceeded' }
          },
          message: 'Too many requests'
        };
        
        (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);
        mockedAxios.get.mockRejectedValue(mockError);

        mockRequest = {
          query: { lat: '45.0703393', lng: '7.6869005' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(429);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'External map service error',
          details: { error: 'Rate limit exceeded' }
        });
      });

      it('should handle timeout errors', async () => {
        const mockError = {
          response: {
            status: 504,
            data: { error: 'Gateway timeout' }
          },
          message: 'Timeout'
        };
        
        (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);
        mockedAxios.get.mockRejectedValue(mockError);

        mockRequest = {
          query: { lat: '45.0703393', lng: '7.6869005' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(504);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'External map service error',
          details: { error: 'Gateway timeout' }
        });
      });
    });

    describe('API Request Parameters', () => {
      it('should send correct headers to Nominatim API', async () => {
        const mockNominatimResponse = {
          address: {
            road: 'Via Roma',
            city: 'Turin'
          },
          display_name: 'Via Roma, Turin, Italy'
        };

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { lat: '45.0703393', lng: '7.6869005' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://nominatim.openstreetmap.org/reverse',
          expect.objectContaining({
            headers: {
              'User-Agent': 'Partecipium-App-Dev/1.0 (admin@tuo-dominio.com)',
              'Referer': 'http://localhost'
            }
          })
        );
      });

      it('should use zoom level 18 for detailed address', async () => {
        const mockNominatimResponse = {
          address: {
            road: 'Via Roma',
            house_number: '42',
            city: 'Turin'
          },
          display_name: 'Via Roma 42, Turin, Italy'
        };

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { lat: '45.0703393', lng: '7.6869005' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://nominatim.openstreetmap.org/reverse',
          expect.objectContaining({
            params: expect.objectContaining({
              zoom: 18,
              addressdetails: 1,
              format: 'jsonv2'
            })
          })
        );
      });
    });

    describe('Response Structure', () => {
      it('should return response with address object', async () => {
        const mockNominatimResponse = {
          address: {
            road: 'Via Roma',
            house_number: '42',
            city: 'Turin'
          },
          display_name: 'Via Roma 42, Turin, Italy'
        };

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { lat: '45.0703393', lng: '7.6869005' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            address: expect.any(Object),
            display_name: expect.any(String)
          })
        );
      });

      it('should preserve all address fields from Nominatim response', async () => {
        const mockNominatimResponse = {
          address: {
            road: 'Via Roma',
            house_number: '42',
            city: 'Turin',
            postcode: '10100',
            country: 'Italy',
            pedestrian: 'Some pedestrian area'
          },
          display_name: 'Via Roma 42, 10100 Turin, Italy',
          lat: '45.0703393',
          lon: '7.6869005'
        };

        mockedAxios.get.mockResolvedValue({ data: mockNominatimResponse });

        mockRequest = {
          query: { lat: '45.0703393', lng: '7.6869005' }
        };

        await getAddressFromProxy(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith(mockNominatimResponse);
      });
    });
  });
});
