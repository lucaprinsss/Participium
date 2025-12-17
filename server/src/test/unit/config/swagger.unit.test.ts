
import fs from 'fs';
import path from 'path';

describe('Swagger configuration', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    it('should generate openapi.json when NODE_ENV is not "test"', () => {
        // Set a different environment
        process.env.NODE_ENV = 'development';

        // Path to the output file
        const outputPath = path.join(__dirname, '..', '..', '..', '..', 'openapi.json');

        // Dynamically import the swagger configuration to execute the code
        require('../../../config/swagger');

        // Check if the file was created
        expect(fs.existsSync(outputPath)).toBe(true);

        // Clean up the created file
        fs.unlinkSync(outputPath);
    });
});
