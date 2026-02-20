// app/lib/data.ts
export interface Drug {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  inStock: boolean;
}

export const drugsData: Drug[] = [
  { id: 1, name: "Artemether-Lumefantrine", category: "Anti-malaria", price: 4850, image: "https://image.made-in-china.com/2f0j00kWDlApJKGwCL/Artemether-Lumefantrine-Tablet-80mg-480mg.webp", inStock: true },
  { id: 2, name: "Chloroquine", category: "Anti-malaria", price: 3200, image: "https://nestoronline.in/product_image/images/CHANGE/Screenshot%202022-08-01%20123811.png", inStock: true },
  { id: 3, name: "Mefloquine", category: "Anti-malaria", price: 6700, image: "https://schwitzbiotech.in/wp-content/uploads/elementor/thumbs/mefloquine-250mg-qio32deb0ywrhi093cxsze43ptbh7e00uivr3btrqa.jpg", inStock: false },
  { id: 4, name: "Vitamin C 1000mg", category: "Vitamins and Supplements", price: 2500, image: "https://m.media-amazon.com/images/I/61mpEXbBXoL._UF1000,1000_QL80_.jpg", inStock: true },
  { id: 5, name: "Multivitamin Tablets", category: "Vitamins and Supplements", price: 4200, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:%9GcTElWo67MZx5BUN2t4UpWkFH4bo9I3HPWxluw&s", inStock: true },
  { id: 6, name: "Omega-3 Fish Oil", category: "Vitamins and Supplements", price: 5800, image: "https://bfasset.costco-static.com/U447IH35/as/b5mz23pxzmbmw5c6w6b3sk4/1683859-847__1?auto=webp&format=jpg&width=600&height=600&fit=bounds&canvas=600,600", inStock: true },
  { id: 7, name: "Paracetamol 500mg", category: "Pain reliever", price: 1500, image: "https://www.supermart.ng/cdn/shop/files/medp109_emzor_paracetamol_96_tablets.jpg?v=1688995960", inStock: true },
  { id: 8, name: "Ibuprofen 400mg", category: "Pain reliever", price: 2300, image: "https://d3ckuu7lxvlwp2.cloudfront.net/products/GKGVdg3irQpTay421qExkpk5x7Ubu5kmOzZvPMje.jpeg", inStock: true },
  { id: 9, name: "Diclofenac Gel", category: "Pain reliever", price: 3100, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:%9GcTkMUeY0PBZVbeDvdMpDWRO9MnV071pyCnoMA&s", inStock: true },
  { id: 10, name: "Amoxicillin 500mg", category: "Anti Biotics", price: 3800, image: "https://deshabpharmacy.com/shop/wp-content/uploads/2022/09/amoxicillin-capsule-unbrand-500mg.jpg", inStock: true },
  { id: 11, name: "Salbutamol Inhaler", category: "Anti-Asthma", price: 7800, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:%9GcRskjbPkkSdz7QOY57_F7KPf5f_rU9sUoirIw&s", inStock: true },
  { id: 12, name: "Ciprofloxacin 500mg", category: "Anti Biotics", price: 5200, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:%9GcShsDfdiDTBZd1btYrEmdEVVU4rgyIv9pb-Zg&s", inStock: true },
  { id: 13, name: "Budesonide Inhaler", category: "Anti-Asthma", price: 9200, image: "https://allschoolabs.com/wp-content/uploads/2024/05/budesonide-inhaler_1618837892.jpg", inStock: false },
  { id: 14, name: "Montelukast 10mg", category: "Anti-Asthma", price: 6700, image: "https://www.aetospharma.com/wp-content/uploads/2023/09/Montelukast-10-mg-Tablets-jpg.webp", inStock: true },
  { id: 15, name: "Diaper Rash Cream", category: "Baby care", price: 2900, image: "https://babyshopnigeria.com/wp-content/uploads/2019/12/Aquaphor-3-in-1-diaper-rash-cream.jpeg", inStock: true },
  { id: 16, name: "Baby Multivitamin Drops", category: "Baby care", price: 3400, image: "https://www.supermart.ng/cdn/shop/files/download__7___1_-removebg-preview.png?v=1735032982", inStock: true },
  { id: 17, name: "Gripe Water", category: "Baby care", price: 2200, image: "https://assetpharmacy.com/wp-content/uploads/2017/09/Woodwards-Gripe-Water-100ml-2.jpg", inStock: true },
  { id: 18, name: "Quinine Sulfate", category: "Anti-malaria", price: 5100, image: "https://bristol-labs.co.uk/wp-content/uploads/2015/02/Quinine-sulphate2.jpg?i=83289", inStock: true },
  { id: 19, name: "Vitamin D3 2000IU", category: "Vitamins and Supplements", price: 3600, image: "https://m.media-amazon.com/images/I/41z2wFvPmHL._SS400_.jpg", inStock: true },
];

export const categories: string[] = [
  "All Category",
  "Anti-malaria",
  "Vitamins and Supplements",
  "Pain reliever",
  "Anti Biotics",
  "Anti-Asthma",
  "Baby care",
];