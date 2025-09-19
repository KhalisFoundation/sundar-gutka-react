const baniTimestamps = [
  {
    start: 2.0,
    end: 10.665,
    sequence: 1,
  },
  {
    start: 10.665,
    end: 12.473,
    sequence: 2,
  },
  {
    start: 12.473,
    end: 14.65,
    sequence: 3,
  },
  {
    start: 14.65,
    end: 18.046,
    sequence: 4,
  },
  {
    start: 18.046,
    end: 21.374,
    sequence: 5,
  },
  {
    start: 21.374,
    end: 24.251,
    sequence: 6,
  },
  {
    start: 24.251,
    end: 27.707,
    sequence: 7,
  },
  {
    start: 27.707,
    end: 31.442,
    sequence: 8,
  },
  {
    start: 31.442,
    end: 34.216,
    sequence: 9,
  },
  {
    start: 34.216,
    end: 36.742,
    sequence: 10,
  },
  {
    start: 36.742,
    end: 40.419,
    sequence: 11,
  },
  {
    start: 40.419,
    end: 43.333,
    sequence: 12,
  },
  {
    start: 43.333,
    end: 46.098,
    sequence: 13,
  },
  {
    start: 46.098,
    end: 48.585,
    sequence: 14,
  },
  {
    start: 48.585,
    end: 52.708,
    sequence: 15,
  },
  {
    start: 52.708,
    end: 55.824,
    sequence: 16,
  },
  {
    start: 55.824,
    end: 58.46,
    sequence: 17,
  },
  {
    start: 58.46,
    end: 60.739,
    sequence: 18,
  },
  {
    start: 60.739,
    end: 64.393,
    sequence: 19,
  },
  {
    start: 64.393,
    end: 66.695,
    sequence: 20,
  },
  {
    start: 66.695,
    end: 68.959,
    sequence: 21,
  },
  {
    start: 68.959,
    end: 72.206,
    sequence: 22,
  },
  {
    start: 72.206,
    end: 74.119,
    sequence: 23,
  },
  {
    start: 74.119,
    end: 76.059,
    sequence: 24,
  },
  {
    start: 76.059,
    end: 77.972,
    sequence: 25,
  },
  {
    start: 77.972,
    end: 80.544,
    sequence: 26,
  },
  {
    start: 80.544,
    end: 82.375,
    sequence: 27,
  },
  {
    start: 82.375,
    end: 84.232,
    sequence: 28,
  },
  {
    start: 84.232,
    end: 87.172,
    sequence: 29,
  },
  {
    start: 87.172,
    end: 88.746,
    sequence: 30,
  },
  {
    start: 88.746,
    end: 92.153,
    sequence: 31,
  },
  {
    start: 92.153,
    end: 95.516,
    sequence: 32,
  },
  {
    start: 95.516,
    end: 97.996,
    sequence: 33,
  },
  {
    start: 97.996,
    end: 102.636,
    sequence: 34,
  },
  {
    start: 102.636,
    end: 105.485,
    sequence: 35,
  },
  {
    start: 105.485,
    end: 108.066,
    sequence: 36,
  },
  {
    start: 108.066,
    end: 110.593,
    sequence: 37,
  },
  {
    start: 110.593,
    end: 113.967,
    sequence: 38,
  },
  {
    start: 113.967,
    end: 116.152,
    sequence: 39,
  },
  {
    start: 116.152,
    end: 118.045,
    sequence: 40,
  },
  {
    start: 118.045,
    end: 120.075,
    sequence: 41,
  },
  {
    start: 120.075,
    end: 122.017,
    sequence: 42,
  },
  {
    start: 122.017,
    end: 123.771,
    sequence: 43,
  },
  {
    start: 123.771,
    end: 128.538,
    sequence: 44,
  },
  {
    start: 128.538,
    end: 132.17,
    sequence: 45,
  },
  {
    start: 132.17,
    end: 135.537,
    sequence: 46,
  },
  {
    start: 135.537,
    end: 137.879,
    sequence: 47,
  },
  {
    start: 137.879,
    end: 141.16,
    sequence: 48,
  },
  {
    start: 141.16,
    end: 144.384,
    sequence: 49,
  },
  {
    start: 144.384,
    end: 147.328,
    sequence: 50,
  },
  {
    start: 147.328,
    end: 153.05,
    sequence: 51,
  },
  {
    start: 153.05,
    end: 154.73,
    sequence: 52,
  },
  {
    start: 154.73,
    end: 157.331,
    sequence: 53,
  },
  {
    start: 157.331,
    end: 161.239,
    sequence: 54,
  },
  {
    start: 161.239,
    end: 164.318,
    sequence: 55,
  },
  {
    start: 164.318,
    end: 167.277,
    sequence: 56,
  },
  {
    start: 167.277,
    end: 170.149,
    sequence: 57,
  },
  {
    start: 170.149,
    end: 174.161,
    sequence: 58,
  },
  {
    start: 174.161,
    end: 176.988,
    sequence: 59,
  },
  {
    start: 176.988,
    end: 179.839,
    sequence: 60,
  },
  {
    start: 179.839,
    end: 182.556,
    sequence: 61,
  },
  {
    start: 182.556,
    end: 184.643,
    sequence: 62,
  },
  {
    start: 184.643,
    end: 186.75,
    sequence: 63,
  },
  {
    start: 186.75,
    end: 188.389,
    sequence: 64,
  },
  {
    start: 188.389,
    end: 190.115,
    sequence: 65,
  },
  {
    start: 190.115,
    end: 192.878,
    sequence: 66,
  },
  {
    start: 192.878,
    end: 194.928,
    sequence: 67,
  },
  {
    start: 194.928,
    end: 196.848,
    sequence: 68,
  },
  {
    start: 196.848,
    end: 198.507,
    sequence: 69,
  },
  {
    start: 198.507,
    end: 200.585,
    sequence: 70,
  },
  {
    start: 200.585,
    end: 202.709,
    sequence: 71,
  },
  {
    start: 202.709,
    end: 205.353,
    sequence: 72,
  },
  {
    start: 205.353,
    end: 207.4,
    sequence: 73,
  },
  {
    start: 207.4,
    end: 209.316,
    sequence: 74,
  },
  {
    start: 209.316,
    end: 211.119,
    sequence: 75,
  },
  {
    start: 211.119,
    end: 212.614,
    sequence: 76,
  },
  {
    start: 212.614,
    end: 215.817,
    sequence: 77,
  },
  {
    start: 215.817,
    end: 217.716,
    sequence: 78,
  },
  {
    start: 217.716,
    end: 219.706,
    sequence: 79,
  },
  {
    start: 219.706,
    end: 221.532,
    sequence: 80,
  },
  {
    start: 221.532,
    end: 223.586,
    sequence: 81,
  },
  {
    start: 223.586,
    end: 224.619,
    sequence: 82,
  },
  {
    start: 224.619,
    end: 227.823,
    sequence: 83,
  },
  {
    start: 227.823,
    end: 229.959,
    sequence: 84,
  },
  {
    start: 229.959,
    end: 231.59,
    sequence: 85,
  },
  {
    start: 231.59,
    end: 233.384,
    sequence: 86,
  },
  {
    start: 233.384,
    end: 235.226,
    sequence: 87,
  },
  {
    start: 235.226,
    end: 236.852,
    sequence: 88,
  },
  {
    start: 236.852,
    end: 239.237,
    sequence: 89,
  },
  {
    start: 239.237,
    end: 242.479,
    sequence: 90,
  },
  {
    start: 242.479,
    end: 244.273,
    sequence: 91,
  },
  {
    start: 244.273,
    end: 246.135,
    sequence: 92,
  },
  {
    start: 246.135,
    end: 247.946,
    sequence: 93,
  },
  {
    start: 247.946,
    end: 249.901,
    sequence: 94,
  },
  {
    start: 249.901,
    end: 252.059,
    sequence: 95,
  },
  {
    start: 252.059,
    end: 254.873,
    sequence: 96,
  },
  {
    start: 254.873,
    end: 256.29,
    sequence: 97,
  },
  {
    start: 256.29,
    end: 258.016,
    sequence: 98,
  },
  {
    start: 258.016,
    end: 259.767,
    sequence: 99,
  },
  {
    start: 259.767,
    end: 261.48,
    sequence: 100,
  },
  {
    start: 261.48,
    end: 263.664,
    sequence: 101,
  },
  {
    start: 263.664,
    end: 266.208,
    sequence: 102,
  },
  {
    start: 266.208,
    end: 268.1,
    sequence: 103,
  },
  {
    start: 268.1,
    end: 269.718,
    sequence: 104,
  },
  {
    start: 269.718,
    end: 271.598,
    sequence: 105,
  },
  {
    start: 271.598,
    end: 273.314,
    sequence: 106,
  },
  {
    start: 273.314,
    end: 275.64,
    sequence: 107,
  },
  {
    start: 275.64,
    end: 278.596,
    sequence: 108,
  },
  {
    start: 278.596,
    end: 280.541,
    sequence: 109,
  },
  {
    start: 280.541,
    end: 282.539,
    sequence: 110,
  },
  {
    start: 282.539,
    end: 284.721,
    sequence: 111,
  },
  {
    start: 284.721,
    end: 286.339,
    sequence: 112,
  },
  {
    start: 286.339,
    end: 288.407,
    sequence: 113,
  },
  {
    start: 288.407,
    end: 291.053,
    sequence: 114,
  },
  {
    start: 291.053,
    end: 293.548,
    sequence: 115,
  },
  {
    start: 293.548,
    end: 295.421,
    sequence: 116,
  },
  {
    start: 295.421,
    end: 296.906,
    sequence: 117,
  },
  {
    start: 296.906,
    end: 300.564,
    sequence: 118,
  },
  {
    start: 300.564,
    end: 302.801,
    sequence: 119,
  },
  {
    start: 302.801,
    end: 304.795,
    sequence: 120,
  },
  {
    start: 304.795,
    end: 306.285,
    sequence: 121,
  },
  {
    start: 306.285,
    end: 307.778,
    sequence: 122,
  },
  {
    start: 307.778,
    end: 309.765,
    sequence: 123,
  },
  {
    start: 309.765,
    end: 312.136,
    sequence: 124,
  },
  {
    start: 312.136,
    end: 314.596,
    sequence: 125,
  },
  {
    start: 314.596,
    end: 316.5,
    sequence: 126,
  },
  {
    start: 316.5,
    end: 318.31,
    sequence: 127,
  },
  {
    start: 318.31,
    end: 320.151,
    sequence: 128,
  },
  {
    start: 320.151,
    end: 322.524,
    sequence: 129,
  },
  {
    start: 322.524,
    end: 325.114,
    sequence: 130,
  },
  {
    start: 325.114,
    end: 327.24,
    sequence: 131,
  },
  {
    start: 327.24,
    end: 328.952,
    sequence: 132,
  },
  {
    start: 328.952,
    end: 331.377,
    sequence: 133,
  },
  {
    start: 331.377,
    end: 333.921,
    sequence: 134,
  },
  {
    start: 333.921,
    end: 336.104,
    sequence: 135,
  },
  {
    start: 336.104,
    end: 338.024,
    sequence: 136,
  },
  {
    start: 338.024,
    end: 340.951,
    sequence: 137,
  },
  {
    start: 340.951,
    end: 343.181,
    sequence: 138,
  },
  {
    start: 343.181,
    end: 345.006,
    sequence: 139,
  },
  {
    start: 345.006,
    end: 346.853,
    sequence: 140,
  },
  {
    start: 346.853,
    end: 348.687,
    sequence: 141,
  },
  {
    start: 348.687,
    end: 350.814,
    sequence: 142,
  },
  {
    start: 350.814,
    end: 353.701,
    sequence: 143,
  },
  {
    start: 353.701,
    end: 356.664,
    sequence: 144,
  },
  {
    start: 356.664,
    end: 358.161,
    sequence: 145,
  },
  {
    start: 358.161,
    end: 359.729,
    sequence: 146,
  },
  {
    start: 359.729,
    end: 361.083,
    sequence: 147,
  },
  {
    start: 361.083,
    end: 362.908,
    sequence: 148,
  },
  {
    start: 362.908,
    end: 364.563,
    sequence: 149,
  },
  {
    start: 364.563,
    end: 366.647,
    sequence: 150,
  },
  {
    start: 366.647,
    end: 369.989,
    sequence: 151,
  },
  {
    start: 369.989,
    end: 372.312,
    sequence: 152,
  },
  {
    start: 372.312,
    end: 374.272,
    sequence: 153,
  },
  {
    start: 374.272,
    end: 376.391,
    sequence: 154,
  },
  {
    start: 376.391,
    end: 379.003,
    sequence: 155,
  },
  {
    start: 379.003,
    end: 381.328,
    sequence: 156,
  },
  {
    start: 381.328,
    end: 383.065,
    sequence: 157,
  },
  {
    start: 383.065,
    end: 385.12,
    sequence: 158,
  },
  {
    start: 385.12,
    end: 386.669,
    sequence: 159,
  },
  {
    start: 386.669,
    end: 388.836,
    sequence: 160,
  },
  {
    start: 388.836,
    end: 391.166,
    sequence: 161,
  },
  {
    start: 391.166,
    end: 393.126,
    sequence: 162,
  },
  {
    start: 393.126,
    end: 395.019,
    sequence: 163,
  },
  {
    start: 395.019,
    end: 396.821,
    sequence: 164,
  },
  {
    start: 396.821,
    end: 398.412,
    sequence: 165,
  },
  {
    start: 398.412,
    end: 400.587,
    sequence: 166,
  },
  {
    start: 400.587,
    end: 403.34,
    sequence: 167,
  },
  {
    start: 403.34,
    end: 405.386,
    sequence: 168,
  },
  {
    start: 405.386,
    end: 407.539,
    sequence: 169,
  },
  {
    start: 407.539,
    end: 410.437,
    sequence: 170,
  },
  {
    start: 410.437,
    end: 412.652,
    sequence: 171,
  },
  {
    start: 412.652,
    end: 414.919,
    sequence: 172,
  },
  {
    start: 414.919,
    end: 416.481,
    sequence: 173,
  },
  {
    start: 416.481,
    end: 418.634,
    sequence: 174,
  },
  {
    start: 418.634,
    end: 420.539,
    sequence: 175,
  },
  {
    start: 420.539,
    end: 422.143,
    sequence: 176,
  },
  {
    start: 422.143,
    end: 424.623,
    sequence: 177,
  },
  {
    start: 424.623,
    end: 426.59,
    sequence: 178,
  },
  {
    start: 426.59,
    end: 428.413,
    sequence: 179,
  },
  {
    start: 428.413,
    end: 430.367,
    sequence: 180,
  },
  {
    start: 430.367,
    end: 432.218,
    sequence: 181,
  },
  {
    start: 432.218,
    end: 434.835,
    sequence: 182,
  },
  {
    start: 434.835,
    end: 437.531,
    sequence: 183,
  },
  {
    start: 437.531,
    end: 439.464,
    sequence: 184,
  },
  {
    start: 439.464,
    end: 441.281,
    sequence: 185,
  },
  {
    start: 441.281,
    end: 442.929,
    sequence: 186,
  },
  {
    start: 442.929,
    end: 444.624,
    sequence: 187,
  },
  {
    start: 444.624,
    end: 447.38,
    sequence: 188,
  },
  {
    start: 447.38,
    end: 450.976,
    sequence: 189,
  },
  {
    start: 450.976,
    end: 454.229,
    sequence: 190,
  },
  {
    start: 454.229,
    end: 456.985,
    sequence: 191,
  },
  {
    start: 456.985,
    end: 459.591,
    sequence: 192,
  },
  {
    start: 459.591,
    end: 463.508,
    sequence: 193,
  },
  {
    start: 463.508,
    end: 466.498,
    sequence: 194,
  },
  {
    start: 466.498,
    end: 469.493,
    sequence: 195,
  },
  {
    start: 469.493,
    end: 472.086,
    sequence: 196,
  },
  {
    start: 472.086,
    end: 477.016,
    sequence: 197,
  },
  {
    start: 477.016,
    end: 479.862,
    sequence: 198,
  },
  {
    start: 479.862,
    end: 483.029,
    sequence: 199,
  },
  {
    start: 483.029,
    end: 485.844,
    sequence: 200,
  },
  {
    start: 485.844,
    end: 489.73,
    sequence: 201,
  },
  {
    start: 489.73,
    end: 492.398,
    sequence: 202,
  },
  {
    start: 492.398,
    end: 494.781,
    sequence: 203,
  },
  {
    start: 494.781,
    end: 496.909,
    sequence: 204,
  },
  {
    start: 496.909,
    end: 498,
    sequence: 205,
  },
  {
    start: 498,
    end: 500.997,
    sequence: 206,
  },
  {
    start: 500.997,
    end: 504.009,
    sequence: 207,
  },
  {
    start: 504.009,
    end: 507.204,
    sequence: 208,
  },
  {
    start: 507.204,
    end: 510.243,
    sequence: 209,
  },
  {
    start: 510.243,
    end: 512.316,
    sequence: 210,
  },
  {
    start: 512.316,
    end: 514.261,
    sequence: 211,
  },
  {
    start: 514.261,
    end: 516.154,
    sequence: 212,
  },
  {
    start: 516.154,
    end: 518.236,
    sequence: 213,
  },
  {
    start: 518.236,
    end: 520.6,
    sequence: 214,
  },
  {
    start: 520.6,
    end: 522.835,
    sequence: 215,
  },
  {
    start: 522.835,
    end: 524.537,
    sequence: 216,
  },
  {
    start: 524.537,
    end: 526.153,
    sequence: 217,
  },
  {
    start: 526.153,
    end: 527.82,
    sequence: 218,
  },
  {
    start: 527.82,
    end: 529.51,
    sequence: 219,
  },
  {
    start: 529.51,
    end: 530.818,
    sequence: 220,
  },
  {
    start: 530.818,
    end: 532.324,
    sequence: 221,
  },
  {
    start: 532.324,
    end: 534.419,
    sequence: 222,
  },
  {
    start: 534.419,
    end: 537.902,
    sequence: 223,
  },
  {
    start: 537.902,
    end: 539.748,
    sequence: 224,
  },
  {
    start: 539.748,
    end: 541.544,
    sequence: 225,
  },
  {
    start: 541.544,
    end: 543.357,
    sequence: 226,
  },
  {
    start: 543.357,
    end: 545.089,
    sequence: 227,
  },
  {
    start: 545.089,
    end: 546.776,
    sequence: 228,
  },
  {
    start: 546.776,
    end: 548.691,
    sequence: 229,
  },
  {
    start: 548.691,
    end: 550.255,
    sequence: 230,
  },
  {
    start: 550.255,
    end: 552.553,
    sequence: 231,
  },
  {
    start: 552.553,
    end: 555.527,
    sequence: 232,
  },
  {
    start: 555.527,
    end: 557.804,
    sequence: 233,
  },
  {
    start: 557.804,
    end: 559.49,
    sequence: 234,
  },
  {
    start: 559.49,
    end: 561.301,
    sequence: 235,
  },
  {
    start: 561.301,
    end: 562.954,
    sequence: 236,
  },
  {
    start: 562.954,
    end: 565.236,
    sequence: 237,
  },
  {
    start: 565.236,
    end: 567.708,
    sequence: 238,
  },
  {
    start: 567.708,
    end: 569.781,
    sequence: 239,
  },
  {
    start: 569.781,
    end: 571.489,
    sequence: 240,
  },
  {
    start: 571.489,
    end: 573.574,
    sequence: 241,
  },
  {
    start: 573.574,
    end: 575.405,
    sequence: 242,
  },
  {
    start: 575.405,
    end: 577.559,
    sequence: 243,
  },
  {
    start: 577.559,
    end: 579.098,
    sequence: 244,
  },
  {
    start: 579.098,
    end: 580.481,
    sequence: 245,
  },
  {
    start: 580.481,
    end: 583.833,
    sequence: 246,
  },
  {
    start: 583.833,
    end: 585.407,
    sequence: 247,
  },
  {
    start: 585.407,
    end: 587.298,
    sequence: 248,
  },
  {
    start: 587.298,
    end: 589.051,
    sequence: 249,
  },
  {
    start: 589.051,
    end: 590.5,
    sequence: 250,
  },
  {
    start: 590.5,
    end: 592.015,
    sequence: 251,
  },
  {
    start: 592.015,
    end: 595.006,
    sequence: 252,
  },
  {
    start: 595.006,
    end: 596.749,
    sequence: 253,
  },
  {
    start: 596.749,
    end: 598.291,
    sequence: 254,
  },
  {
    start: 598.291,
    end: 599.978,
    sequence: 255,
  },
  {
    start: 599.978,
    end: 601.559,
    sequence: 256,
  },
  {
    start: 601.559,
    end: 603.519,
    sequence: 257,
  },
  {
    start: 603.519,
    end: 605.881,
    sequence: 258,
  },
  {
    start: 605.881,
    end: 608.078,
    sequence: 259,
  },
  {
    start: 608.078,
    end: 610.044,
    sequence: 260,
  },
  {
    start: 610.044,
    end: 611.67,
    sequence: 261,
  },
  {
    start: 611.67,
    end: 612.993,
    sequence: 262,
  },
  {
    start: 612.993,
    end: 615.334,
    sequence: 263,
  },
  {
    start: 615.334,
    end: 617.909,
    sequence: 264,
  },
  {
    start: 617.909,
    end: 619.564,
    sequence: 265,
  },
  {
    start: 619.564,
    end: 621.564,
    sequence: 266,
  },
  {
    start: 621.564,
    end: 624.176,
    sequence: 267,
  },
  {
    start: 624.176,
    end: 627.91,
    sequence: 268,
  },
  {
    start: 627.91,
    end: 630.991,
    sequence: 269,
  },
  {
    start: 630.991,
    end: 633.957,
    sequence: 270,
  },
  {
    start: 633.957,
    end: 639.559,
    sequence: 271,
  },
  {
    start: 639.559,
    end: 643.062,
    sequence: 272,
  },
  {
    start: 643.062,
    end: 645.881,
    sequence: 273,
  },
  {
    start: 645.881,
    end: 650.073,
    sequence: 274,
  },
  {
    start: 650.073,
    end: 653.061,
    sequence: 275,
  },
  {
    start: 653.061,
    end: 656.062,
    sequence: 276,
  },
  {
    start: 656.062,
    end: 658.799,
    sequence: 277,
  },
  {
    start: 658.799,
    end: 662.615,
    sequence: 278,
  },
  {
    start: 662.615,
    end: 665.769,
    sequence: 279,
  },
  {
    start: 665.769,
    end: 668.778,
    sequence: 280,
  },
  {
    start: 668.778,
    end: 671.796,
    sequence: 281,
  },
  {
    start: 671.796,
    end: 676.929,
    sequence: 282,
  },
  {
    start: 676.929,
    end: 680.963,
    sequence: 283,
  },
  {
    start: 680.963,
    end: 685.02,
    sequence: 284,
  },
  {
    start: 685.02,
    end: 687.929,
    sequence: 285,
  },
  {
    start: 687.929,
    end: 691.168,
    sequence: 286,
  },
  {
    start: 691.168,
    end: 695.239,
    sequence: 287,
  },
  {
    start: 695.239,
    end: 698.107,
    sequence: 288,
  },
  {
    start: 698.107,
    end: 702.301,
    sequence: 289,
  },
  {
    start: 702.301,
    end: 708.03,
    sequence: 290,
  },
  {
    start: 708.03,
    end: 711.452,
    sequence: 291,
  },
  {
    start: 711.452,
    end: 714.368,
    sequence: 292,
  },
  {
    start: 714.368,
    end: 717.163,
    sequence: 293,
  },
  {
    start: 717.163,
    end: 721.116,
    sequence: 294,
  },
  {
    start: 721.116,
    end: 725.287,
    sequence: 295,
  },
  {
    start: 725.287,
    end: 729.136,
    sequence: 296,
  },
  {
    start: 729.136,
    end: 733.198,
    sequence: 297,
  },
  {
    start: 733.198,
    end: 736.28,
    sequence: 298,
  },
  {
    start: 736.28,
    end: 740.201,
    sequence: 299,
  },
  {
    start: 740.201,
    end: 742.952,
    sequence: 300,
  },
  {
    start: 742.952,
    end: 745.921,
    sequence: 301,
  },
  {
    start: 745.921,
    end: 750.037,
    sequence: 302,
  },
  {
    start: 750.037,
    end: 753.79,
    sequence: 303,
  },
  {
    start: 753.79,
    end: 756.879,
    sequence: 304,
  },
  {
    start: 756.879,
    end: 758.649,
    sequence: 305,
  },
  {
    start: 758.649,
    end: 763.746,
    sequence: 306,
  },
  {
    start: 763.746,
    end: 766.305,
    sequence: 307,
  },
  {
    start: 766.305,
    end: 767.656,
    sequence: 308,
  },
  {
    start: 767.656,
    end: 769.843,
    sequence: 309,
  },
  {
    start: 769.843,
    end: 771.963,
    sequence: 310,
  },
  {
    start: 771.963,
    end: 773.572,
    sequence: 311,
  },
  {
    start: 773.572,
    end: 777.463,
    sequence: 312,
  },
  {
    start: 777.463,
    end: 781.107,
    sequence: 313,
  },
  {
    start: 781.107,
    end: 784.077,
    sequence: 314,
  },
  {
    start: 784.077,
    end: 787.891,
    sequence: 315,
  },
  {
    start: 787.891,
    end: 790.873,
    sequence: 316,
  },
  {
    start: 790.873,
    end: 794.699,
    sequence: 317,
  },
  {
    start: 794.699,
    end: 796.854,
    sequence: 318,
  },
  {
    start: 796.854,
    end: 798.901,
    sequence: 319,
  },
  {
    start: 798.901,
    end: 800.88,
    sequence: 320,
  },
  {
    start: 800.88,
    end: 803.897,
    sequence: 321,
  },
  {
    start: 803.897,
    end: 806.038,
    sequence: 322,
  },
  {
    start: 806.038,
    end: 808.046,
    sequence: 323,
  },
  {
    start: 808.046,
    end: 810.658,
    sequence: 324,
  },
  {
    start: 810.658,
    end: 813.171,
    sequence: 325,
  },
  {
    start: 813.171,
    end: 814.606,
    sequence: 326,
  },
  {
    start: 814.606,
    end: 816.453,
    sequence: 327,
  },
  {
    start: 816.453,
    end: 819.499,
    sequence: 328,
  },
  {
    start: 819.499,
    end: 821.553,
    sequence: 329,
  },
  {
    start: 821.553,
    end: 823.408,
    sequence: 330,
  },
  {
    start: 823.408,
    end: 825.303,
    sequence: 331,
  },
  {
    start: 825.303,
    end: 827.569,
    sequence: 332,
  },
  {
    start: 827.569,
    end: 829.971,
    sequence: 333,
  },
  {
    start: 829.971,
    end: 831.596,
    sequence: 334,
  },
  {
    start: 831.596,
    end: 833.196,
    sequence: 335,
  },
  {
    start: 833.196,
    end: 834.529,
    sequence: 336,
  },
  {
    start: 834.529,
    end: 836.683,
    sequence: 337,
  },
  {
    start: 836.683,
    end: 838.932,
    sequence: 338,
  },
  {
    start: 838.932,
    end: 841.418,
    sequence: 339,
  },
  {
    start: 841.418,
    end: 844.48,
    sequence: 340,
  },
  {
    start: 844.48,
    end: 849.092,
    sequence: 341,
  },
  {
    start: 849.092,
    end: 852.399,
    sequence: 342,
  },
  {
    start: 852.399,
    end: 855.538,
    sequence: 343,
  },
  {
    start: 855.538,
    end: 859.491,
    sequence: 344,
  },
  {
    start: 859.491,
    end: 862.864,
    sequence: 345,
  },
  {
    start: 862.864,
    end: 866.974,
    sequence: 346,
  },
  {
    start: 866.974,
    end: 869.702,
    sequence: 347,
  },
  {
    start: 869.702,
    end: 872.138,
    sequence: 348,
  },
  {
    start: 872.138,
    end: 873.836,
    sequence: 349,
  },
  {
    start: 873.836,
    end: 876.242,
    sequence: 350,
  },
  {
    start: 876.242,
    end: 878.54,
    sequence: 351,
  },
  {
    start: 878.54,
    end: 879.977,
    sequence: 352,
  },
  {
    start: 879.977,
    end: 882.433,
    sequence: 353,
  },
  {
    start: 882.433,
    end: 884.609,
    sequence: 354,
  },
  {
    start: 884.609,
    end: 886.993,
    sequence: 355,
  },
  {
    start: 886.993,
    end: 888.779,
    sequence: 356,
  },
  {
    start: 888.779,
    end: 890.433,
    sequence: 357,
  },
  {
    start: 890.433,
    end: 892.568,
    sequence: 358,
  },
  {
    start: 892.568,
    end: 894.893,
    sequence: 359,
  },
  {
    start: 894.893,
    end: 896.687,
    sequence: 360,
  },
  {
    start: 896.687,
    end: 898.481,
    sequence: 361,
  },
  {
    start: 898.481,
    end: 900.592,
    sequence: 362,
  },
  {
    start: 900.592,
    end: 903.814,
    sequence: 363,
  },
  {
    start: 903.814,
    end: 905.817,
    sequence: 364,
  },
  {
    start: 905.817,
    end: 908.001,
    sequence: 365,
  },
  {
    start: 908.001,
    end: 909.507,
    sequence: 366,
  },
  {
    start: 909.507,
    end: 911.926,
    sequence: 367,
  },
  {
    start: 911.926,
    end: 914.014,
    sequence: 368,
  },
  {
    start: 914.014,
    end: 916.219,
    sequence: 369,
  },
  {
    start: 916.219,
    end: 918.089,
    sequence: 370,
  },
  {
    start: 918.089,
    end: 919.91,
    sequence: 371,
  },
  {
    start: 919.91,
    end: 922.325,
    sequence: 372,
  },
  {
    start: 922.325,
    end: 925.106,
    sequence: 373,
  },
  {
    start: 925.106,
    end: 927.09,
    sequence: 374,
  },
  {
    start: 927.09,
    end: 928.87,
    sequence: 375,
  },
  {
    start: 928.87,
    end: 931.39,
    sequence: 376,
  },
  {
    start: 931.39,
    end: 934.267,
    sequence: 377,
  },
  {
    start: 934.267,
    end: 936.13,
    sequence: 378,
  },
  {
    start: 936.13,
    end: 938.073,
    sequence: 379,
  },
  {
    start: 938.073,
    end: 939.55,
    sequence: 380,
  },
  {
    start: 939.55,
    end: 942.389,
    sequence: 381,
  },
  {
    start: 942.389,
    end: 945.703,
    sequence: 382,
  },
  {
    start: 945.703,
    end: 948.81,
    sequence: 383,
  },
  {
    start: 948.81,
    end: 951.944,
    sequence: 384,
  },
  {
    start: 951.944,
    end: 980.558,
    sequence: 385,
  },
];

export default baniTimestamps;
