import { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';

// Nominatim reverse geocoding response interface
interface NominatimResponse {
    address: {
        road?: string;
        house_number?: string;
        city?: string;
        town?: string;
        village?: string;
        pedestrian?: string;
        footway?: string;
        path?: string;
        [key: string]: string | undefined;
    };
    display_name: string;
}

// Nominatim forward geocoding search result interface
interface NominatimSearchResult {
    lat: string;
    lon: string;
    display_name: string;
    boundingbox?: string[];
    address?: {
        house_number?: string;
        road?: string;
        [key: string]: string | undefined;
    };
}

export const getAddressFromProxy = async (req: Request, res: Response): Promise<void> => {
    const lat = req.query.lat as string;
    const lng = req.query.lng as string;

    if (!lat || !lng) {
        res.status(400).json({ error: "Latitude and Longitude are required" });
        return;
    }

    const url = `https://nominatim.openstreetmap.org/reverse`;

    try {
        const response = await axios.get<NominatimResponse>(url, {
            params: {
                lat: lat,
                lon: lng,
                format: 'jsonv2',
                zoom: 18,
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'Partecipium-App-Dev/1.0 (admin@tuo-dominio.com)', 
                'Referer': 'http://localhost' 
            }
        });

        res.json(response.data);

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Nominatim Proxy Error:", error.message);
            
            if (error.response) {
                res.status(error.response.status).json({ 
                    error: "External map service error", 
                    details: error.response.data 
                });
                return;
            }
        } else {
            console.error("Unknown Error:", error);
        }

        res.status(500).json({ error: "Internal server error during geocoding" });
    }
};

export const getCoordinatesFromAddress = async (req: Request, res: Response): Promise<void> => {
    const address = req.query.address as string;

    if (!address || address.trim() === '') {
        res.status(400).json({ error: "Address is required" });
        return;
    }

    // Extract house number from the search query (excluding 5-digit postal codes)
    const houseNumberMatch = address.match(/\b(\d{1,4}[a-zA-Z]?)\b/);
    const requestedHouseNumber = houseNumberMatch ? houseNumberMatch[1] : null;
    const hasHouseNumber = requestedHouseNumber !== null;
    const searchLimit = hasHouseNumber ? 1 : 50; // Single result for specific address, multiple for street name

    const url = `https://nominatim.openstreetmap.org/search`;

    try {
        // Use structured query for better precision with house numbers
        const response = await axios.get<NominatimSearchResult[]>(url, {
            params: {
                street: address,
                city: 'Torino',
                country: 'Italia',
                format: 'jsonv2',
                limit: searchLimit,
                addressdetails: 1,
                viewbox: '7.5200,45.1500,7.8000,44.9700', // Enlarged Turin area (west,north,east,south)
                countrycodes: 'it'
            },
            headers: {
                'User-Agent': 'Partecipium-App-Dev/1.0 (admin@tuo-dominio.com)',
                'Referer': 'http://localhost'
            }
        });

        if (response.data && response.data.length > 0) {
            const firstResult = response.data[0];
            
            // For specific addresses (with house number), validate the returned house number
            if (hasHouseNumber) {
                const returnedHouseNumber = firstResult.address?.house_number;
                
                // Check if the returned house number matches the requested one
                if (!returnedHouseNumber || returnedHouseNumber !== requestedHouseNumber) {
                    res.status(404).json({ 
                        error: "Address with specified house number not found",
                        details: `House number ${requestedHouseNumber} not found in the results`
                    });
                    return;
                }

                res.json({
                    lat: parseFloat(firstResult.lat),
                    lng: parseFloat(firstResult.lon),
                    display_name: firstResult.display_name,
                    boundingbox: firstResult.boundingbox,
                    resultsCount: 1,
                    isSpecificAddress: true
                });
            } else {
                // For street names without number, calculate overall bounding box
                let minLat = Infinity, maxLat = -Infinity;
                let minLon = Infinity, maxLon = -Infinity;

                response.data.forEach(result => {
                    if (result.boundingbox) {
                        const [south, north, west, east] = result.boundingbox.map(parseFloat);
                        minLat = Math.min(minLat, south);
                        maxLat = Math.max(maxLat, north);
                        minLon = Math.min(minLon, west);
                        maxLon = Math.max(maxLon, east);
                    }
                });

                // If we have valid bounding box, use it; otherwise use first result's bbox
                const overallBoundingBox = minLat !== Infinity 
                    ? [minLat.toString(), maxLat.toString(), minLon.toString(), maxLon.toString()]
                    : firstResult.boundingbox;

                res.json({
                    lat: parseFloat(firstResult.lat),
                    lng: parseFloat(firstResult.lon),
                    display_name: firstResult.display_name,
                    boundingbox: overallBoundingBox,
                    resultsCount: response.data.length,
                    isSpecificAddress: false
                });
            }
        } else {
            res.status(404).json({ error: "Address not found" });
        }

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Nominatim Search Proxy Error:", error.message);
            
            if (error.response) {
                res.status(error.response.status).json({
                    error: "External map service error",
                    details: error.response.data
                });
                return;
            }
        } else {
            console.error("Unknown Error:", error);
        }

        res.status(500).json({ error: "Internal server error during address search" });
    }
};