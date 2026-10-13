export interface UnitPairPreset {
  id: string;
  label: string;
  purchase_unit: string;
  recipe_unit: string;
  purchaseUnit: string;
  recipeUnit: string;
  default_conversion: number;
  defaultConversionFactor: number;
  description: string;
}

export const STANDARD_UNIT_PRESETS: UnitPairPreset[] = [
  {
    id: 'kg-g',
    label: 'Khối lượng: Kg ➔ Gram (g)',
    purchase_unit: 'kg',
    recipe_unit: 'g',
    purchaseUnit: 'kg',
    recipeUnit: 'g',
    default_conversion: 1000,
    defaultConversionFactor: 1000,
    description: '1 kg = 1.000 gram (Thịt, cá, bột, rau củ...)',
  },
  {
    id: 'lit-ml',
    label: 'Thể tích: Lít ➔ Mililit (ml)',
    purchase_unit: 'lít',
    recipe_unit: 'ml',
    purchaseUnit: 'lít',
    recipeUnit: 'ml',
    default_conversion: 1000,
    defaultConversionFactor: 1000,
    description: '1 lít = 1.000 ml (Sữa, siro, dầu ăn, nước mắm...)',
  },
  {
    id: 'chai-ml',
    label: 'Chai rượu / siro: Chai ➔ Mililit (ml)',
    purchase_unit: 'chai',
    recipe_unit: 'ml',
    purchaseUnit: 'chai',
    recipeUnit: 'ml',
    default_conversion: 750,
    defaultConversionFactor: 750,
    description: '1 chai = 750 ml (Rượu vang, rượu mạnh, siro pha chế...)',
  },
  {
    id: 'thung-lon',
    label: 'Đóng thùng: Thùng ➔ Lon / Chai',
    purchase_unit: 'thùng',
    recipe_unit: 'lon',
    purchaseUnit: 'thùng',
    recipeUnit: 'lon',
    default_conversion: 24,
    defaultConversionFactor: 24,
    description: '1 thùng = 24 lon / chai (Bia, nước ngọt đóng lon...)',
  },
  {
    id: 'hop-cai',
    label: 'Đóng hộp: Hộp ➔ Cái / Miếng',
    purchase_unit: 'hộp',
    recipe_unit: 'cái',
    purchaseUnit: 'hộp',
    recipeUnit: 'cái',
    default_conversion: 10,
    defaultConversionFactor: 10,
    description: '1 hộp = 10 cái / miếng (Bơ viên, phô mai lát...)',
  },
  {
    id: 'bao-kg',
    label: 'Đóng bao: Bao ➔ Kg',
    purchase_unit: 'bao',
    recipe_unit: 'kg',
    purchaseUnit: 'bao',
    recipeUnit: 'kg',
    default_conversion: 25,
    defaultConversionFactor: 25,
    description: '1 bao = 25 kg (Gạo, bột mì, đường cát...)',
  },
  {
    id: 'goi-g',
    label: 'Đóng gói: Gói ➔ Gram (g)',
    purchase_unit: 'gói',
    recipe_unit: 'g',
    purchaseUnit: 'gói',
    recipeUnit: 'g',
    default_conversion: 500,
    defaultConversionFactor: 500,
    description: '1 gói = 500 gram (Mì khô, trà túi lọc, nấm khô...)',
  },
  {
    id: 'qua-lat',
    label: 'Đếm chiếc: Quả / Trái ➔ Lát / Phần',
    purchase_unit: 'quả',
    recipe_unit: 'lát',
    purchaseUnit: 'quả',
    recipeUnit: 'lát',
    default_conversion: 6,
    defaultConversionFactor: 6,
    description: '1 quả = 6 lát / phần (Chanh, cam vàng, bưởi...)',
  },
  {
    id: 'cai-cai',
    label: 'Đơn vị đơn lẻ: Cái / Lon ➔ Cái / Lon',
    purchase_unit: 'cái',
    recipe_unit: 'cái',
    purchaseUnit: 'cái',
    recipeUnit: 'cái',
    default_conversion: 1,
    defaultConversionFactor: 1,
    description: '1 cái = 1 cái (Trứng gà, bánh làm sẵn...)',
  },
];

export function getPresetByUnits(
  purchaseUnit?: string,
  recipeUnit?: string
): UnitPairPreset | undefined {
  if (!purchaseUnit && !recipeUnit) return STANDARD_UNIT_PRESETS[0];

  const pClean = (purchaseUnit || '').toLowerCase().trim();
  const rClean = (recipeUnit || '').toLowerCase().trim();

  return (
    STANDARD_UNIT_PRESETS.find(
      (preset) =>
        preset.purchase_unit.toLowerCase() === pClean &&
        (preset.recipe_unit.toLowerCase() === rClean ||
          (rClean === 'gram' && preset.recipe_unit === 'g') ||
          (rClean === 'g' && preset.recipe_unit === 'gram'))
    ) ||
    STANDARD_UNIT_PRESETS.find(
      (preset) =>
        preset.purchase_unit.toLowerCase() === pClean ||
        preset.recipe_unit.toLowerCase() === rClean
    ) ||
    STANDARD_UNIT_PRESETS[0]
  );
}
