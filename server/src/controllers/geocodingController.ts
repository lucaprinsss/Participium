import { Request, Response } from 'express';
import axios from 'axios';
import { isWithinTurinBoundaries } from '../utils/geoValidationUtils';

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
    const houseNumberMatch = /\b(\d{1,4}[a-zA-Z]?)\b/.exec(address);
    const requestedHouseNumber = houseNumberMatch ? houseNumberMatch[1] : null;
    const hasHouseNumber = requestedHouseNumber !== null;
    const searchLimit = hasHouseNumber ? 10 : 50; // Multiple results to filter, even with house number

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
            // Filter results to only include coordinates within Turin boundaries
            const validResults = response.data.filter(result => {
                const lat = Number.parseFloat(result.lat);
                const lon = Number.parseFloat(result.lon);
                return isWithinTurinBoundaries(lat, lon);
            });

            if (validResults.length === 0) {
                res.status(404).json({ 
                    error: "No valid addresses found within Turin city boundaries",
                    details: "All results are outside the Turin municipality area"
                });
                return;
            }

            const firstResult = validResults[0];
            
            // For specific addresses (with house number), validate the returned house number
            if (hasHouseNumber) {
                // Try to find exact match first
                let matchedResult = validResults.find(result => 
                    result.address?.house_number === requestedHouseNumber
                );
                
                // If no exact match, try to find a house number that starts with the requested number (e.g., 34a when searching for 34)
                if (!matchedResult) {
                    matchedResult = validResults.find(result => 
                        result.address?.house_number?.startsWith(requestedHouseNumber)
                    );
                }
                
                if (matchedResult) {
                    // Found exact match or variant (34a for 34)
                    const isExactMatch = matchedResult.address?.house_number === requestedHouseNumber;
                    
                    res.json({
                        lat: Number.parseFloat(matchedResult.lat),
                        lng: Number.parseFloat(matchedResult.lon),
                        display_name: matchedResult.display_name,
                        road: matchedResult.address?.road,
                        house_number: matchedResult.address?.house_number,
                        requestedHouseNumber: requestedHouseNumber,
                        boundingbox: matchedResult.boundingbox,
                        resultsCount: 1,
                        isSpecificAddress: true,
                        isVariant: !isExactMatch
                    });
                } else {
                    // House number not found at all - return street only
                    res.json({
                        lat: Number.parseFloat(firstResult.lat),
                        lng: Number.parseFloat(firstResult.lon),
                        display_name: firstResult.display_name,
                        road: firstResult.address?.road,
                        house_number: null,
                        requestedHouseNumber: requestedHouseNumber,
                        boundingbox: firstResult.boundingbox,
                        resultsCount: validResults.length,
                        isSpecificAddress: false,
                        houseNumberNotFound: true
                    });
                }
                return;
            } else {
                // For street names without number, calculate overall bounding box
                let minLat = Infinity, maxLat = -Infinity;
                let minLon = Infinity, maxLon = -Infinity;

                validResults.forEach(result => {
                    if (result.boundingbox) {
                        const [south, north, west, east] = result.boundingbox.map(Number.parseFloat);
                        minLat = Math.min(minLat, south);
                        maxLat = Math.max(maxLat, north);
                        minLon = Math.min(minLon, west);
                        maxLon = Math.max(maxLon, east);
                    }
                });

                // If we have valid bounding box, use it; otherwise use first result's bbox
                const overallBoundingBox = minLat === Infinity 
                    ? firstResult.boundingbox
                    : [minLat.toString(), maxLat.toString(), minLon.toString(), maxLon.toString()];

                res.json({
                    lat: Number.parseFloat(firstResult.lat),
                    lng: Number.parseFloat(firstResult.lon),
                    display_name: firstResult.display_name,
                    road: firstResult.address?.road,
                    house_number: firstResult.address?.house_number,
                    boundingbox: overallBoundingBox,
                    resultsCount: validResults.length,
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