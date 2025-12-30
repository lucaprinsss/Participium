import axios from 'axios';

// URL del tuo backend locale (o da variabile d'ambiente)
const API_BASE_URL = 'http://localhost:3001/api'; 

// Definition of types for data we expect from our Backend Proxy
interface AddressDetails {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    pedestrian?: string;
    footway?: string;
    path?: string;
    [key: string]: string | undefined;
}

interface GeocodingResponse {
    address?: AddressDetails;
    display_name?: string;
    error?: string;
}

/**
 * Recupera l'indirizzo tramite il Proxy Backend per evitare blocchi CORS/User-Agent.
 */
export async function calculateAddress(latitude: number, longitude: number): Promise<string> {
    
    // Costruzione URL verso il TUO server
    const url = `${API_BASE_URL}/proxy/address?lat=${latitude}&lng=${longitude}`;
    
    const fallbackAddress = `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;

    try {
        const response = await axios.get<GeocodingResponse>(url);

        if (response.status === 200 && response.data.display_name) {
            return response.data.display_name;
        }
        
        return fallbackAddress;

    } catch (error) {
        console.error("Error retrieving address from backend proxy:", error);
        return fallbackAddress;
    }
}