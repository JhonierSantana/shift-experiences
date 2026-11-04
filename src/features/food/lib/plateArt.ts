/** Decorative "plate" art per category until real photography lands (no images shipped). */
const art: Record<string, string> = {
  parrilla:
    'radial-gradient(circle at 35% 40%, #7a2a12 0 22%, #c2311d 23% 38%, #ffd58a 39% 44%, #fff 45%)',
  bowls:
    'radial-gradient(circle at 60% 45%, #2f6b3a 0 20%, #ffd58a 21% 34%, #e9a24b 35% 44%, #fff 45%)',
  sanduches:
    'radial-gradient(circle at 50% 50%, #7a2a12 0 16%, #2f6b3a 17% 24%, #e9a24b 25% 40%, #fff 41%)',
  acompanantes: 'radial-gradient(circle at 45% 55%, #e9a24b 0 28%, #ffd58a 29% 42%, #fff 43%)',
  postres: 'radial-gradient(circle at 50% 50%, #4a2016 0 26%, #f7b7a8 27% 40%, #fff 41%)',
  bebidas: 'radial-gradient(circle at 50% 50%, #c2311d 0 18%, #f7b7a8 19% 40%, #fff 41%)',
}

const fallback = 'radial-gradient(circle at 50% 50%, #c2311d 0 24%, #ffd58a 25% 40%, #fff 41%)'

export const plateArt = (categoryId: string): string => art[categoryId] ?? fallback
