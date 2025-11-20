import { reportService } from '../../../services/reportService';
import { BadRequestError } from '../../../models/errors/BadRequestError';
import { ReportCategory } from '../../../models/dto/ReportCategory';

describe('ReportService', () => {
  describe('getAllCategories', () => {
    it('should return all report categories', async () => {
      const categories = await reportService.getAllCategories();
      
      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain(ReportCategory.ROADS);
      expect(categories).toContain(ReportCategory.PUBLIC_LIGHTING);
    });
  });

  describe('validateLocation', () => {
    describe('missing location', () => {
      it('should throw BadRequestError when location is undefined', () => {
        expect(() => {
          reportService.validateLocation(undefined as any);
        }).toThrow(BadRequestError);
        
        expect(() => {
          reportService.validateLocation(undefined as any);
        }).toThrow('Location is required');
      });

      it('should throw BadRequestError when location is null', () => {
        expect(() => {
          reportService.validateLocation(null as any);
        }).toThrow(BadRequestError);
        
        expect(() => {
          reportService.validateLocation(null as any);
        }).toThrow('Location is required');
      });
    });

    describe('incomplete location', () => {
      it('should throw BadRequestError when latitude is missing', () => {
        expect(() => {
          reportService.validateLocation({ longitude: 7.6869005 } as any);
        }).toThrow(BadRequestError);
        
        expect(() => {
          reportService.validateLocation({ longitude: 7.6869005 } as any);
        }).toThrow('Location must include both latitude and longitude');
      });

      it('should throw BadRequestError when longitude is missing', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393 } as any);
        }).toThrow(BadRequestError);
        
        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393 } as any);
        }).toThrow('Location must include both latitude and longitude');
      });

      it('should throw BadRequestError when both coordinates are missing', () => {
        expect(() => {
          reportService.validateLocation({} as any);
        }).toThrow(BadRequestError);
        
        expect(() => {
          reportService.validateLocation({} as any);
        }).toThrow('Location must include both latitude and longitude');
      });
    });

    describe('invalid coordinates', () => {
      it('should throw BadRequestError when latitude > 90', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 91, longitude: 7.6869005 });
        }).toThrow(BadRequestError);
        
        expect(() => {
          reportService.validateLocation({ latitude: 91, longitude: 7.6869005 });
        }).toThrow('Invalid coordinates');
      });

      it('should throw BadRequestError when latitude < -90', () => {
        expect(() => {
          reportService.validateLocation({ latitude: -91, longitude: 7.6869005 });
        }).toThrow(BadRequestError);
        
        expect(() => {
          reportService.validateLocation({ latitude: -91, longitude: 7.6869005 });
        }).toThrow('Invalid coordinates');
      });

      it('should throw BadRequestError when longitude > 180', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393, longitude: 181 });
        }).toThrow(BadRequestError);
        
        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393, longitude: 181 });
        }).toThrow('Invalid coordinates');
      });

      it('should throw BadRequestError when longitude < -180', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393, longitude: -181 });
        }).toThrow(BadRequestError);
        
        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393, longitude: -181 });
        }).toThrow('Invalid coordinates');
      });

      it('should throw BadRequestError when coordinates are NaN', () => {
        expect(() => {
          reportService.validateLocation({ latitude: NaN, longitude: 7.6869005 });
        }).toThrow(BadRequestError);
        
        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393, longitude: NaN });
        }).toThrow(BadRequestError);
      });
    });

    describe('outside Turin boundaries', () => {
      it('should throw BadRequestError for Milan coordinates', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.464, longitude: 9.19 });
        }).toThrow(BadRequestError);
        
        expect(() => {
          reportService.validateLocation({ latitude: 45.464, longitude: 9.19 });
        }).toThrow('outside Turin city boundaries');
      });

      it('should throw BadRequestError for Rome coordinates', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 41.9028, longitude: 12.4964 });
        }).toThrow(BadRequestError);
        
        expect(() => {
          reportService.validateLocation({ latitude: 41.9028, longitude: 12.4964 });
        }).toThrow('outside Turin city boundaries');
      });

      it('should throw BadRequestError for coordinates just outside Turin (Moncalieri)', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0016, longitude: 7.6814 });
        }).toThrow(BadRequestError);
        
        expect(() => {
          reportService.validateLocation({ latitude: 45.0016, longitude: 7.6814 });
        }).toThrow('outside Turin city boundaries');
      });
    });

    describe('valid locations within Turin', () => {
      it('should not throw error for Turin city center (Piazza Castello)', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393, longitude: 7.6869005 });
        }).not.toThrow();
      });

      it('should not throw error for Mole Antonelliana', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0692403, longitude: 7.6932941 });
        }).not.toThrow();
      });

      it('should not throw error for Porta Nuova station', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0625748, longitude: 7.6782069 });
        }).not.toThrow();
      });
    });
  });
});
