import axios from 'axios';

// URL del tuo backend locale (o da variabile d'ambiente)
const API_BASE_URL = 'http://localhost:3001/api'; 

// Definizione dei tipi per i dati che ci aspettiamo dal nostro Backend Proxy
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

        if (response.status === 200 && (response.data.address || response.data.display_name)) {
            
            const data = response.data;
            const address = data.address;
            let extractedAddress = '';

            if (address) {
                // Priorità 1: Via e Civico
                if (address.road && address.house_number) {
                    extractedAddress = `${address.road}, ${address.house_number}`;
                } 
                // Priorità 2: Solo Via
                else if (address.road) {
                    extractedAddress = address.road;
                } 
                // Priorità 3: Aree pedonali
                else if (address.pedestrian || address.footway || address.path) {
                    extractedAddress = address.pedestrian || address.footway || address.path || '';
                } 
                // Priorità 4: Display Name parziale
                else if (data.display_name) {
                    extractedAddress = data.display_name.split(',')[0];
                }
            }
            
            // Aggiunta Città se manca
            const city = address?.city || address?.town || address?.village || address?.suburb;
            
            if (extractedAddress && city && !extractedAddress.includes(city)) {
                extractedAddress += `, ${city}`;
            }

            if (extractedAddress) {
                return extractedAddress;
            }
        }
        
        return fallbackAddress;

    } catch (error) {
        console.error("Error retrieving address from backend proxy:", error);
        return fallbackAddress;
    }
}