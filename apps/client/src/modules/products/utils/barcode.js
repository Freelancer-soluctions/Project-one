export function generateRandomBarcode(length = 10) {
  return Math.floor(Math.random() * 10 ** length)
    .toString()
    .padStart(length, '0');
}
