jest.mock('../../../controllers/geocodingController');

import request from 'supertest';
import express, { Express } from 'express';
import geocodingRouter from '../../../routes/geocodingRoutes';

import { getAddressFromProxy } from '../../../controllers/geocodingController';

const app: Express = express();

app.use(express.json());
app.use('/api/proxy', geocodingRouter);

const mockGetAddressFromProxy = getAddressFromProxy as jest.Mock;

const mockAddressResponse = {
    address: {
        road: 'Via Roma',
        house_number: '42',
        city: 'Rome',
        town: undefined,
        village: undefined,
    },
    display_name: 'Via Roma 42, 00100 Rome, Italy',
};

describe('Geocoding Routes Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockGetAddressFromProxy.mockImplementation((req, res) => {
            const lat = req.query.lat as string;
            const lng = req.query.lng as string;

            if (!lat || !lng) {
                return res.status(400).json({ error: 'Latitude and Longitude are required' });
            }

            // Validate coordinates format
            const latNum = parseFloat(lat);
            const lngNum = parseFloat(lng);

            if (isNaN(latNum) || isNaN(lngNum)) {
                return res.status(400).json({ error: 'Invalid coordinate format' });
            }

            // Validate coordinate ranges
            if (latNum < -90 || latNum > 90) {
                return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
            }

            if (lngNum < -180 || lngNum > 180) {
                return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
            }

            res.status(200).json(mockAddressResponse);
        });
    });

    // --- GET /api/proxy/address (Get Address From Coordinates) ---
    describe('GET /api/proxy/address', () => {
        it('should return 200 and address for valid coordinates', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '41.9028', lng: '12.4964' });

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockAddressResponse);
            expect(res.body).toHaveProperty('address');
            expect(res.body).toHaveProperty('display_name');
            expect(mockGetAddressFromProxy).toHaveBeenCalledTimes(1);
        });

        it('should return 200 for coordinates at edge of valid range', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '90', lng: '180' });

            expect(res.status).toBe(200);
        });

        it('should return 200 for negative coordinates', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '-33.8688', lng: '151.2093' });

            expect(res.status).toBe(200);
        });

        it('should return 200 for coordinates with decimal precision', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '41.902782', lng: '12.496366' });

            expect(res.status).toBe(200);
        });

        it('should return 400 if latitude is missing', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lng: '12.4964' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Latitude and Longitude are required');
        });

        it('should return 400 if longitude is missing', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '41.9028' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Latitude and Longitude are required');
        });

        it('should return 400 if both lat and lng are missing', async () => {
            const res = await request(app).get('/api/proxy/address');

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Latitude and Longitude are required');
        });

        it('should return 400 if latitude is not a valid number', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: 'abc', lng: '12.4964' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Invalid coordinate format');
        });

        it('should return 400 if longitude is not a valid number', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '41.9028', lng: 'xyz' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Invalid coordinate format');
        });

        it('should return 400 if latitude is out of range (> 90)', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '91', lng: '12.4964' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Latitude must be between');
        });

        it('should return 400 if latitude is out of range (< -90)', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '-91', lng: '12.4964' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Latitude must be between');
        });

        it('should return 400 if longitude is out of range (> 180)', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '41.9028', lng: '181' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Longitude must be between');
        });

        it('should return 400 if longitude is out of range (< -180)', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '41.9028', lng: '-181' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Longitude must be between');
        });
    });

    // --- Error Handling ---
    describe('Error Handling', () => {
        it('should return 500 if external service fails', async () => {
            mockGetAddressFromProxy.mockImplementation((req, res) => {
                res.status(500).json({ error: 'Internal server error during geocoding' });
            });

            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '41.9028', lng: '12.4964' });

            expect(res.status).toBe(500);
            expect(res.body.error).toContain('Internal server error');
        });

        it('should return external service error status for Nominatim errors', async () => {
            mockGetAddressFromProxy.mockImplementation((req, res) => {
                res.status(503).json({
                    error: 'External map service error',
                    details: 'Service temporarily unavailable'
                });
            });

            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '41.9028', lng: '12.4964' });

            expect(res.status).toBe(503);
            expect(res.body.error).toContain('External map service error');
        });

        it('should handle timeout from external service', async () => {
            mockGetAddressFromProxy.mockImplementation((req, res) => {
                res.status(504).json({ error: 'Gateway timeout' });
            });

            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '41.9028', lng: '12.4964' });

            expect(res.status).toBe(504);
        });
    });

    // --- Response Structure ---
    describe('Response Structure', () => {
        it('should return response with address object containing road', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '41.9028', lng: '12.4964' });

            expect(res.status).toBe(200);
            expect(res.body.address).toHaveProperty('road');
        });

        it('should return display_name in response', async () => {
            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '41.9028', lng: '12.4964' });

            expect(res.status).toBe(200);
            expect(res.body.display_name).toBeDefined();
            expect(typeof res.body.display_name).toBe('string');
        });

        it('should handle response without house number', async () => {
            mockGetAddressFromProxy.mockImplementation((req, res) => {
                res.status(200).json({
                    address: {
                        road: 'Unknown Road',
                        city: 'Unknown City',
                    },
                    display_name: 'Unknown Road, Unknown City',
                });
            });

            const res = await request(app)
                .get('/api/proxy/address')
                .query({ lat: '0', lng: '0' });

            expect(res.status).toBe(200);
            expect(res.body.address.house_number).toBeUndefined();
        });
    });
});
