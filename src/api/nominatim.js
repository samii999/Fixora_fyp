export const getAddressFromCoords = async (lat, lon) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Fixora/1.0' }
      });
      const data = await response.json();
      return data.display_name || 'Unknown location';
    } catch (err) {
      console.error('Nominatim error:', err);
      return 'Address not found';
    }
  };

export const getCoordsFromAddress = async (address) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Fixora/1.0' }
    });
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (err) {
    console.error('Nominatim search error:', err);
    return null;
  }
};
  