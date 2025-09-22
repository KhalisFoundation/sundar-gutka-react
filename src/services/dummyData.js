/*
2. Japji sahib baani
3. Shabad hajarey
4. Jaap Sahib
6. Savaiye
9. chaupai sahib
10. Anand Sahib
21. Rehras Sahib
23. Sohila Sahib
 */
const bhajiAmarjeetSingh = { display_name: "Bhai Amarjeet Singh", artist_id: 2 };
const bhajiPreetamSingh = { display_name: "Bhai Preetam Singh Ji Anjaan", artist_id: 3 };
const bhaiJarnailSingh = { display_name: "Bhai Jarnail Singh Ji", artist_id: 4 };
const bhaiSatnamSinghZira = { display_name: "Bhai Satnam Singh Zira", artist_id: 5 };
const bibiJaspreetKaur = { display_name: "Bibi Jaspreet Kaur Patiala", artist_id: 6 };
const bhaiHarpreetSingh = { display_name: "Bhai Harpreet Singh Ji Sangrur", artist_id: 7 };

const dummyArtists = [
  bhajiAmarjeetSingh,
  bhajiPreetamSingh,
  bhaiJarnailSingh,
  bhaiSatnamSinghZira,
  bibiJaspreetKaur,
  bhaiHarpreetSingh,
];

const dummyData = {
  2: [
    // Japji sahib baani

    {
      bani_id: 2,
      track_id: 5,
      track_url:
        "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//BhaiJarnailSingh/japji-sahib.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: bhaiJarnailSingh.display_name,
      artist_id: bhaiJarnailSingh.artist_id,
    },
    {
      bani_id: 2,
      track_id: 6,
      track_url:
        "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//BhaiHarpreetSinghSangrur/JapjiSahib.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: bhaiHarpreetSingh.display_name,
      artist_id: bhaiHarpreetSingh.artist_id,
    },
    {
      bani_id: 2,
      track_id: 7,
      track_url:
        "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//BhaiSatnamSinghZira/JapjiSahib.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: bhaiSatnamSinghZira.display_name,
      artist_id: bhaiSatnamSinghZira.artist_id,
    },
    {
      bani_id: 2,
      track_id: 8,
      track_url:
        "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//BibiJaspreetKaur/JapjiSahib.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: bibiJaspreetKaur.display_name,
      artist_id: bibiJaspreetKaur.artist_id,
    },
    {
      bani_id: 2,
      track_id: 2,
      track_url: "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//amarjeetSingh/2.mp3",
      track_length_seconds: 918,
      track_size_mb: "3.70",
      artist_name: bhajiAmarjeetSingh.display_name,
      artist_id: bhajiAmarjeetSingh.artist_id,
    },
    {
      bani_id: 2,
      track_id: 3,
      track_url: "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//preetamSingh/2.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: bhajiPreetamSingh.display_name,
      artist_id: bhajiPreetamSingh.artist_id,
    },
  ],
  3: [
    // Shabad hajarey
    {
      bani_id: 3,
      track_id: 3,
      track_url: "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//preetamSingh/3.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: "Bhai Preetam Singh Ji Anjaan",
      artist_id: 3,
    },
  ],
  4: [
    // Jaap Sahib
    {
      bani_id: 4,
      track_id: 4,
      track_url:
        "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//BhaiJarnailSingh/jaap-sahib.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: bhaiJarnailSingh.display_name,
      artist_id: bhaiJarnailSingh.artist_id,
    },
    {
      bani_id: 4,
      track_id: 5,
      track_url:
        "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//BhaiHarpreetSinghSangrur/JaapSahib.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: bhaiHarpreetSingh.display_name,
      artist_id: bhaiHarpreetSingh.artist_id,
    },
    {
      bani_id: 4,
      track_id: 6,
      track_url:
        "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//BhaiSatnamSinghZira/JaapSahib.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: bhaiSatnamSinghZira.display_name,
      artist_id: bhaiSatnamSinghZira.artist_id,
    },
  ],
  9: [
    // Chaupai Sahib
    {
      bani_id: 9,
      track_id: 9,
      track_url:
        "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//BhaiJarnailSingh/chopai-sahib.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: bhaiJarnailSingh.display_name,
      artist_id: bhaiJarnailSingh.artist_id,
    },
  ],
  10: [
    // Anand Sahib
    {
      bani_id: 10,
      track_id: 10,
      track_url:
        "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//BhaiJarnailSingh/anand-sahib.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: bhaiJarnailSingh.display_name,
      artist_id: bhaiJarnailSingh.artist_id,
    },
  ],
  21: [
    // Rehras Sahib
    {
      bani_id: 21,
      track_id: 21,
      track_url:
        "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//BhaiJarnailSingh/Rehras-sahib.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: bhaiJarnailSingh.display_name,
      artist_id: bhaiJarnailSingh.artist_id,
    },
    {
      bani_id: 21,
      track_id: 22,
      track_url:
        "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//BibiJaspreetKaur/RehrasSahib.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: bibiJaspreetKaur.display_name,
      artist_id: bibiJaspreetKaur.artist_id,
    },
  ],
  23: [
    // Sohila Sahib
    {
      bani_id: 23,
      track_id: 23,
      track_url:
        "https://raw.githubusercontent.com/amitojsingh/SG_audio/main//BhaiJarnailSingh/kirtan-sohaila.mp3",
      track_length_seconds: 1709,
      track_size_mb: "27.50",
      artist_name: bhaiJarnailSingh.display_name,
      artist_id: bhaiJarnailSingh.artist_id,
    },
  ],
};
export { dummyData, dummyArtists };
