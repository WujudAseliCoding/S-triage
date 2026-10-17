import { Facility } from '../models/index.js';

/**
 * Mengambil daftar seluruh faskes mitra rujukan eksternal dan kapasitasnya
 */
export const getFacilities = async (req, res, next) => {
  try {
    const facilities = await Facility.findAll({
      order: [['jarak_km', 'ASC']],
    });

    return res.json({
      status: 'success',
      data: facilities,
    });
  } catch (error) {
    next(error);
  }
};
