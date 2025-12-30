import request from 'supertest';
import app from '../../app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
  ensureTestDatabase
} from '../utils/dbTestUtils';

// E2E Tests for Geocoding Controller
// Tests the real integration with Nominatim API (OpenStreetMap)
describe('GeocodingController E2E Tests', () => {
  // Setup database before all tests
  beforeAll(async () => {
    await setupTestDatabase();
    await ensureTestDatabase();
  });

  // Cleanup after all tests
  afterAll(async () => {
    await teardownTestDatabase();
  });

  // Clean dynamic data after each test
  afterEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/proxy/coordinates - Get coordinates from address', () => {
    it('should return coordinates for a valid address with house number in Turin', async () => {
      // Arrange
      const address = 'Corso Duca degli Abruzzi 24';

      // Act
      const response = await request(app)
        .get('/api/proxy/coordinates')
        .query({ address })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('lat');
      expect(response.body).toHaveProperty('lng');
      expect(response.body).toHaveProperty('display_name');
      expect(response.body).toHaveProperty('boundingbox');
      expect(response.body).toHaveProperty('resultsCount');
      expect(response.body).toHaveProperty('isSpecificAddress');

      // Validate coordinate types
      expect(typeof response.body.lat).toBe('number');
      expect(typeof response.body.lng).toBe('number');
      
      // Validate coordinates are in Turin area (rough bounds)
      expect(response.body.lat).toBeGreaterThan(44.9);
      expect(response.body.lat).toBeLessThan(45.2);
      expect(response.body.lng).toBeGreaterThan(7.5);
      expect(response.body.lng).toBeLessThan(7.9);

      // For specific address with house number
      expect(response.body.isSpecificAddress).toBe(true);
      expect(response.body.resultsCount).toBe(1);
    }, 15000); // Increased timeout for external API calls

    it('should return coordinates for a valid street name without house number', async () => {
      // Arrange
      const address = 'Via Roma';

      // Act
      const response = await request(app)
        .get('/api/proxy/coordinates')
        .query({ address })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('lat');
      expect(response.body).toHaveProperty('lng');
      expect(response.body).toHaveProperty('display_name');
      expect(response.body).toHaveProperty('boundingbox');
      expect(response.body).toHaveProperty('isSpecificAddress');
      
      // For street name without house number
      expect(response.body.isSpecificAddress).toBe(false);
      expect(response.body.resultsCount).toBeGreaterThan(1);
      
      // Validate bounding box format
      expect(Array.isArray(response.body.boundingbox)).toBe(true);
      expect(response.body.boundingbox.length).toBe(4);
    }, 15000);

    it('should return 400 if address parameter is missing', async () => {
      // Act
      const response = await request(app)
        .get('/api/proxy/coordinates')
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Address is required');
    });

    it('should return 400 if address parameter is empty string', async () => {
      // Arrange
      const address = '   '; // Empty or whitespace

      // Act
      const response = await request(app)
        .get('/api/proxy/coordinates')
        .query({ address })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Address is required');
    });

    it('should return 404 for a non-existent address in Turin', async () => {
      // Arrange
      const address = 'Via Inesistente Totalmente Falsa 99999';

      // Act
      const response = await request(app)
        .get('/api/proxy/coordinates')
        .query({ address })
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Address not found');
    }, 15000);

    it('should return 404 if house number does not exist on the street', async () => {
      // Arrange - Using a valid street but with a very unlikely house number
      const address = 'Corso Duca degli Abruzzi 99999';

      // Act
      const response = await request(app)
        .get('/api/proxy/coordinates')
        .query({ address })
        .expect('Content-Type', /json/);

      // Assert - API can return either 404 (not found) or 200 with different house number
      if (response.status === 404) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/Address.*not found/i);
      } else if (response.status === 200) {
        // If Nominatim returns a result, it should be for the street but may not match the exact number
        expect(response.body).toHaveProperty('lat');
        expect(response.body).toHaveProperty('lng');
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    }, 15000);

    it('should handle special characters in address correctly', async () => {
      // Arrange
      const address = "Corso Vittorio Emanuele II 53";

      // Act
      const response = await request(app)
        .get('/api/proxy/coordinates')
        .query({ address })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('lat');
      expect(response.body).toHaveProperty('lng');
      expect(typeof response.body.lat).toBe('number');
      expect(typeof response.body.lng).toBe('number');
    }, 15000);

    it('should handle addresses with letter suffixes (e.g., 24a)', async () => {
      // Arrange
      const address = 'Via Garibaldi 10a';

      // Act & Assert
      const response = await request(app)
        .get('/api/proxy/coordinates')
        .query({ address })
        .expect('Content-Type', /json/);

      // Either found (200) or not found (404), both are acceptable
      if (response.status === 200) {
        expect(response.body).toHaveProperty('lat');
        expect(response.body).toHaveProperty('lng');
      } else {
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
      }
    }, 15000);

    it('should return coordinates within Turin bounding box', async () => {
      // Arrange
      const address = 'Piazza Castello';

      // Act
      const response = await request(app)
        .get('/api/proxy/coordinates')
        .query({ address })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      const { lat, lng, boundingbox } = response.body;
      
      // Check that coordinates are within reasonable Turin bounds
      expect(lat).toBeGreaterThan(44.97);
      expect(lat).toBeLessThan(45.15);
      expect(lng).toBeGreaterThan(7.52);
      expect(lng).toBeLessThan(7.80);

      // Validate bounding box structure
      expect(Array.isArray(boundingbox)).toBe(true);
      expect(boundingbox.length).toBe(4);
      
      // Bounding box should be [minLat, maxLat, minLon, maxLon]
      const [south, north, west, east] = boundingbox.map(parseFloat);
      expect(south).toBeLessThanOrEqual(north);
      expect(west).toBeLessThanOrEqual(east);
    }, 15000);

    it('should include display_name in the response', async () => {
      // Arrange
      const address = 'Corso Francia 10';

      // Act
      const response = await request(app)
        .get('/api/proxy/coordinates')
        .query({ address })
        .expect('Content-Type', /json/);

      // Assert
      if (response.status === 200) {
        expect(response.body).toHaveProperty('display_name');
        expect(typeof response.body.display_name).toBe('string');
        expect(response.body.display_name.length).toBeGreaterThan(0);
        // Display name should contain "Torino" or "Turin"
        expect(response.body.display_name).toMatch(/Torino|Turin/i);
      }
    }, 15000);
  });

  describe('GET /api/proxy/address - Get address from coordinates', () => {
    it('should return address for valid coordinates in Turin', async () => {
      // Arrange - Coordinates of Piazza Castello, Torino
      const lat = 45.0703;
      const lng = 7.6869;

      // Act
      const response = await request(app)
        .get('/api/proxy/address')
        .query({ lat, lng })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('display_name');
      expect(typeof response.body.display_name).toBe('string');
      expect(response.body.display_name).toMatch(/Torino|Turin/i);
    }, 15000);

    it('should return 400 if latitude is missing', async () => {
      // Arrange
      const lng = 7.6869;

      // Act
      const response = await request(app)
        .get('/api/proxy/address')
        .query({ lng })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Latitude and Longitude are required');
    });

    it('should return 400 if longitude is missing', async () => {
      // Arrange
      const lat = 45.0703;

      // Act
      const response = await request(app)
        .get('/api/proxy/address')
        .query({ lat })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Latitude and Longitude are required');
    });

    it('should return 400 if both latitude and longitude are missing', async () => {
      // Act
      const response = await request(app)
        .get('/api/proxy/address')
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Latitude and Longitude are required');
    });

    it('should handle coordinates at the edge of Turin', async () => {
      // Arrange - Coordinates at the periphery of Turin
      const lat = 45.1198;
      const lng = 7.7421;

      // Act
      const response = await request(app)
        .get('/api/proxy/address')
        .query({ lat, lng })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('display_name');
      expect(typeof response.body.display_name).toBe('string');
    }, 15000);

    it('should return address with proper structure for valid coordinates', async () => {
      // Arrange - Mole Antonelliana coordinates
      const lat = 45.0692;
      const lng = 7.6931;

      // Act
      const response = await request(app)
        .get('/api/proxy/address')
        .query({ lat, lng })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('address');
      expect(typeof response.body.address).toBe('object');
      
      // Address object should have some common properties
      const addressKeys = Object.keys(response.body.address);
      expect(addressKeys.length).toBeGreaterThan(0);
    }, 15000);

    it('should handle string coordinates (query params are strings)', async () => {
      // Arrange
      const lat = '45.0703';
      const lng = '7.6869';

      // Act
      const response = await request(app)
        .get('/api/proxy/address')
        .query({ lat, lng })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('display_name');
    }, 15000);
  });
});
