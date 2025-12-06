import { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';

// Interfaccia per la risposta di Nominatim (opzionale, ma utile per intellisense)
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

export const getAddressFromProxy = async (req: Request, res: Response): Promise<void> => {
    // TypeScript legge req.query come string | ParsedQs | ...
    // Forziamo il cast a string per sicurezza
    const lat = req.query.lat as string;
    const lng = req.query.lng as string;

    if (!lat || !lng) {
        res.status(400).json({ error: "Latitude and Longitude are required" });
        return;
    }

    const url = `https://nominatim.openstreetmap.org/reverse`;

    try {
        // Specifichiamo il tipo di ritorno atteso da Axios <NominatimResponse>
        const response = await axios.get<NominatimResponse>(url, {
            params: {
                lat: lat,
                lon: lng,
                format: 'jsonv2',
                zoom: 18,
                addressdetails: 1
            },
            headers: {
                // HEADER FONDAMENTALE PER EVITARE IL BLOCCO
                'User-Agent': 'Partecipium-App-Dev/1.0 (admin@tuo-dominio.com)', 
                'Referer': 'http://localhost' 
            }
        });

        res.json(response.data);

    } catch (error) {
        // Gestione degli errori tipizzata per Axios
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