import 'dotenv/config';

const WAY_API_URL = process.env.WAY_API_URL || 'https://api-way.gutech.dev/v1/chat/completions';
const WAY_API_KEY = process.env.WAY_API_KEY || '';
const WAY_API_MODEL = process.env.WAY_API_MODEL || 'gutech/fast';

/**
 * Menganalisis keluhan pasien menggunakan Way AI Gateway.
 * 
 * @param {string} keluhan - Keluhan medis pasien
 * @param {object} vitalSigns - Tanda-tanda vital (opsional)
 * @returns {Promise<{prioritas_triage: string, skor_urgensi: number, analisis_ai: string}>}
 */
export const analyzeTriageWithAI = async (keluhan, vitalSigns = {}) => {
  if (!WAY_API_KEY) {
    console.warn('⚠️  WAY_API_KEY tidak diset. Menggunakan fallback analisis lokal.');
    return fallbackTriageAnalysis(keluhan, vitalSigns);
  }

  const prompt = `
Anda adalah AI Asisten Medis Triase di Fasilitas Kesehatan Tingkat Pertama (FKTP).
Tugas Anda adalah menganalisis keluhan utama pasien dan tanda-tanda vitalnya, lalu mengklasifikasikannya ke dalam tingkat prioritas triase dan memberikan skor urgensi klinis.

Kriteria Prioritas Triase:
- P1 (Gawat Darurat / Merah): Mengancam nyawa, perlu penanganan segera tanpa ditunda (misal: henti jantung, sesak napas berat, tidak sadar, nyeri dada hebat, perdarahan masif, syok).
- P2 (Darurat Tidak Gawat / Kuning): Potensi bahaya tinggi tapi tidak mengancam nyawa langsung, perlu penanganan cepat dalam 10-30 menit (misal: patah tulang tertutup, nyeri sedang-berat, sesak napas ringan, demam sangat tinggi pada anak).
- P3 (Tidak Gawat Tidak Darurat / Hijau): Kondisi ringan, dapat mengantre secara normal (misal: batuk, pilek ringan, pusing ringan, gatal-gatal, luka lecet ringan).
- P0 (Meninggal / Hitam): Datang dalam kondisi sudah tidak bernyawa.

Skor Urgensi:
Kombinasi skala 1 sampai 5 (1 untuk kondisi paling ringan/P3, 5 untuk kondisi paling kritis/P1).

Informasi Pasien:
Keluhan Utama: "${keluhan}"
Tanda-Tanda Vital: ${JSON.stringify(vitalSigns)}

Format Output HARUS dalam bentuk JSON murni (tanpa markdown, tanpa tambahan teks pembuka/penutup) dengan struktur:
{
  "prioritas_triage": "P1" | "P2" | "P3" | "P0",
  "skor_urgensi": number (1-5),
  "analisis_ai": "Penjelasan klinis singkat dalam Bahasa Indonesia (maksimal 2 kalimat)"
}
`;

  try {
    const response = await fetch(WAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WAY_API_KEY}`,
      },
      body: JSON.stringify({
        model: WAY_API_MODEL,
        messages: [
          { role: 'system', content: 'Anda adalah sistem analisis triase medis ahli yang hanya merespon dalam format JSON terstruktur.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error! Status: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;
    
    // Parse JSON yang dikembalikan oleh AI
    const parsedResult = JSON.parse(aiMessage.trim());
    
    return {
      prioritas_triage: parsedResult.prioritas_triage || 'P3',
      skor_urgensi: Number(parsedResult.skor_urgensi) || 1,
      analisis_ai: parsedResult.analisis_ai || 'Analisis otomatis berhasil diproses.'
    };
  } catch (error) {
    console.error('❌ Error saat menghubungi Way AI Gateway:', error.message);
    return fallbackTriageAnalysis(keluhan, vitalSigns);
  }
};

/**
 * Fallback Rule-based Triage Analysis (jika API key tidak diisi atau request gagal)
 */
const fallbackTriageAnalysis = (keluhan, vitalSigns = {}) => {
  const lowercaseKeluhan = keluhan.toLowerCase();
  let prioritas_triage = 'P3';
  let skor_urgensi = 1;
  let analisis_ai = 'Analisis diproses menggunakan sistem penapisan cadangan berbasis kata kunci.';

  // P0 - Meninggal
  if (lowercaseKeluhan.includes('meninggal') || lowercaseKeluhan.includes('mati') || lowercaseKeluhan.includes('tidak bernyawa')) {
    prioritas_triage = 'P0';
    skor_urgensi = 5;
    analisis_ai = 'Pasien dicurigai tiba dalam kondisi tidak bernyawa (P0/Hitam) berdasarkan kata kunci keluhan.';
  }
  // P1 - Gawat Darurat
  else if (
    lowercaseKeluhan.includes('sesak napas berat') || 
    lowercaseKeluhan.includes('nyeri dada kiri') || 
    lowercaseKeluhan.includes('jantung') || 
    lowercaseKeluhan.includes('tidak sadar') || 
    lowercaseKeluhan.includes('pingsan') || 
    lowercaseKeluhan.includes('kejang') || 
    lowercaseKeluhan.includes('perdarahan hebat') ||
    (vitalSigns.spo2 && vitalSigns.spo2 < 90)
  ) {
    prioritas_triage = 'P1';
    skor_urgensi = 5;
    analisis_ai = 'Pasien dikategorikan Gawat Darurat (P1/Merah) karena terdeteksi gejala kritis mengancam nyawa.';
  }
  // P2 - Urgen Tidak Gawat
  else if (
    lowercaseKeluhan.includes('sesak') || 
    lowercaseKeluhan.includes('nyeri hebat') || 
    lowercaseKeluhan.includes('patah tulang') || 
    lowercaseKeluhan.includes('fraktur') || 
    lowercaseKeluhan.includes('luka bakar') || 
    lowercaseKeluhan.includes('asma') ||
    (vitalSigns.suhu && vitalSigns.suhu >= 39)
  ) {
    prioritas_triage = 'P2';
    skor_urgensi = 3;
    analisis_ai = 'Pasien dikategorikan Darurat Tidak Gawat (P2/Kuning) karena terdapat indikasi nyeri hebat atau cedera fisik sedang-berat.';
  }
  // P3 - Non-Urgen
  else {
    prioritas_triage = 'P3';
    skor_urgensi = 1;
    analisis_ai = 'Pasien dikategorikan Tidak Gawat Tidak Darurat (P3/Hijau) karena keluhan mengarah pada gejala ringan/biasa.';
  }

  return {
    prioritas_triage,
    skor_urgensi,
    analisis_ai
  };
};