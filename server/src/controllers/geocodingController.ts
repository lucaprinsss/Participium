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

    const url = `https://nominatim.openstreetmap.org/search`;

    try {
        // Use structured query for better precision with house numbers
        const response = await axios.get<NominatimSearchResult[]>(url, {
            params: {
                street: address,
                city: 'Torino',
                country: 'Italia',
                format: 'jsonv2',
                limit: 1,
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
            const result = response.data[0];
            res.json({
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                display_name: result.display_name,
                boundingbox: result.boundingbox
            });
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