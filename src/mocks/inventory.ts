import type {
  InventoryCategory,
  InventoryProduct,
  InventoryStockByProduct,
  InventoryStockLocation,
  InventorySubcategory,
} from "../interfaces/inventory";

type InventoryStockEntry = InventoryStockByProduct & {
  by_location: InventoryStockLocation[];
};

export const mockCategories: InventoryCategory[] = [
  {
    id: "cat-001",
    name: "Electroterapia",
    slug: "electroterapia",
    requires_serial_number: true,
    is_returnable: true,
  },
  {
    id: "cat-002",
    name: "Consumibles",
    slug: "consumibles",
    requires_serial_number: false,
  },
  {
    id: "cat-003",
    name: "Rehabilitacion",
    slug: "rehabilitacion",
    requires_serial_number: false,
  },
];

export const mockSubcategories: InventorySubcategory[] = [
  {
    id: "sub-010",
    name: "Ultrasonido",
    slug: "ultrasonido",
    category: "cat-001",
  },
  { id: "sub-011", name: "TENS", slug: "tens", category: "cat-001" },
  { id: "sub-020", name: "Agujas", slug: "agujas", category: "cat-002" },
  {
    id: "sub-021",
    name: "Gel conductor",
    slug: "gel-conductor",
    category: "cat-002",
  },
  { id: "sub-030", name: "Pelotas", slug: "pelotas", category: "cat-003" },
];

export const mockProducts: InventoryProduct[] = [
  {
    id: "prod-001",
    name: "Ultrasonido 3MHz",
    sku: "CAN-US-007",
    category: "cat-001",
    subcategory: "sub-010",
    barcode: "770000000001",
    reorder_point: 2,
    requires_cold_chain: false,
  },
  {
    id: "prod-002",
    name: "TENS Bifasico Pro",
    sku: "CAN-TENS-003",
    category: "cat-001",
    subcategory: "sub-011",
    barcode: "770000000002",
    reorder_point: 3,
  },
  {
    id: "prod-003",
    name: "Agujas Puncion Seca 0.25mm",
    sku: "CAN-APS-001",
    category: "cat-002",
    subcategory: "sub-020",
    barcode: "770000000003",
    reorder_point: 15,
  },
  {
    id: "prod-004",
    name: "Gel Conductor 250ml",
    sku: "CAN-GEL-005",
    category: "cat-002",
    subcategory: "sub-021",
    barcode: "770000000004",
    reorder_point: 10,
  },
  {
    id: "prod-005",
    name: "Pelota Gel Ovalada",
    sku: "CAN-PGO-002",
    category: "cat-003",
    subcategory: "sub-030",
    barcode: "770000000005",
    reorder_point: 4,
  },
];

export const mockStockByProduct: Record<string, InventoryStockEntry> = {
  "prod-001": {
    product_id: "prod-001",
    sku: "CAN-US-007",
    total: 1,
    by_location: [
      {
        location_code: "BOD-01",
        location_name: "Bodega principal",
        quantity: 1,
      },
    ],
    per_location: [
      {
        location_code: "BOD-01",
        location_name: "Bodega principal",
        quantity: 1,
      },
    ],
  },
  "prod-002": {
    product_id: "prod-002",
    sku: "CAN-TENS-003",
    total: 3,
    by_location: [
      {
        location_code: "BOD-01",
        location_name: "Bodega principal",
        quantity: 2,
      },
      { location_code: "SAL-02", location_name: "Sala terapia", quantity: 1 },
    ],
    per_location: [
      {
        location_code: "BOD-01",
        location_name: "Bodega principal",
        quantity: 2,
      },
      { location_code: "SAL-02", location_name: "Sala terapia", quantity: 1 },
    ],
  },
  "prod-003": {
    product_id: "prod-003",
    sku: "CAN-APS-001",
    total: 50,
    by_location: [
      {
        location_code: "BOD-02",
        location_name: "Bodega consumibles",
        quantity: 30,
      },
      { location_code: "SAL-01", location_name: "Sala terapia", quantity: 20 },
    ],
    per_location: [
      {
        location_code: "BOD-02",
        location_name: "Bodega consumibles",
        quantity: 30,
      },
      { location_code: "SAL-01", location_name: "Sala terapia", quantity: 20 },
    ],
  },
  "prod-004": {
    product_id: "prod-004",
    sku: "CAN-GEL-005",
    total: 20,
    by_location: [
      {
        location_code: "BOD-02",
        location_name: "Bodega consumibles",
        quantity: 20,
      },
    ],
    per_location: [
      {
        location_code: "BOD-02",
        location_name: "Bodega consumibles",
        quantity: 20,
      },
    ],
  },
  "prod-005": {
    product_id: "prod-005",
    sku: "CAN-PGO-002",
    total: 2,
    by_location: [
      { location_code: "SAL-02", location_name: "Sala terapia", quantity: 2 },
    ],
    per_location: [
      { location_code: "SAL-02", location_name: "Sala terapia", quantity: 2 },
    ],
  },
};
