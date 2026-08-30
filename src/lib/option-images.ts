/**
 * Option image library — curated, eye-verified stock photos (hosted on the
 * Sanity CDN) that option presets use as default choice images, and that the
 * builder's image picker offers as a "Library" alongside Upload.
 *
 * Every image has a `key` (stable id a preset choice points at via
 * `image_key`) and `tags` for search. Multiple images may share a subject —
 * the first match for a key is the default; the rest are alternates.
 */

export interface OptionImage {
  key: string;          // e.g. 'roof-shingle-charcoal'
  url: string;          // Sanity CDN URL
  label: string;        // human label shown in the picker
  tags: string[];       // search terms: 'roof', 'shingle', 'charcoal', 'dark'
  division?: string;    // preset division this belongs to (for filtering)
}

// Filled by the sourcing pass (Pexels → verified → Sanity). Keep keys stable.
export const OPTION_IMAGES: OptionImage[] = [
  { key: "bath-frameless-glass", url: "https://cdn.sanity.io/images/3at2yyx0/production/025f05a6131a6b22d9d33bd4b619af2e68adbde4-1200x900.jpg", label: "Frameless Glass", division: "residential", tags: ["bath","frameless","glass","shower","door"] },
  { key: "bath-freestanding-tub", url: "https://cdn.sanity.io/images/3at2yyx0/production/586bc43c1736412a6b2fde5e86c9df1075ba5cbe-1200x900.jpg", label: "Freestanding Tub", division: "residential", tags: ["bath","freestanding","tub","bathtub","bathroom"] },
  { key: "cabinet-custom", url: "https://cdn.sanity.io/images/3at2yyx0/production/4e9d59cef37349ce4e30de4cca5dab779ddd894d-1200x900.jpg", label: "Custom", division: "residential", tags: ["cabinet","custom","kitchen","cabinetry","luxury"] },
  { key: "cabinet-inset", url: "https://cdn.sanity.io/images/3at2yyx0/production/7b1b119d7baa551228e44b51a539ee9a8d930b34-1200x900.jpg", label: "Inset", division: "residential", tags: ["cabinet","inset","kitchen","cabinets","custom"] },
  { key: "cabinet-island", url: "https://cdn.sanity.io/images/3at2yyx0/production/d9d104c1058fb71b24c13fc8614bb21cfcc1e7ed-1200x900.jpg", label: "Island", division: "residential", tags: ["cabinet","island","kitchen","cabinets"] },
  { key: "cabinet-navy", url: "https://cdn.sanity.io/images/3at2yyx0/production/dcae9be78f49bcee663dcfe19952f743236a65ce-1200x900.jpg", label: "Navy", division: "residential", tags: ["cabinet","navy","blue","kitchen","cabinets"] },
  { key: "cabinet-raised-panel", url: "https://cdn.sanity.io/images/3at2yyx0/production/99f9bab552b6008e9023271f0bce7686c863d456-1200x900.jpg", label: "Raised Panel", division: "residential", tags: ["cabinet","raised","panel","traditional","kitchen","cabinets"] },
  { key: "cabinet-semi-custom", url: "https://cdn.sanity.io/images/3at2yyx0/production/26dd468e2344caea11d92fd6d12ef876141dcb8c-1200x900.jpg", label: "Semi Custom", division: "residential", tags: ["cabinet","semi","custom","new","kitchen","cabinetry"] },
  { key: "cabinet-slab", url: "https://cdn.sanity.io/images/3at2yyx0/production/39133289a8d1630ccc86d93fc7a202f1ff800c7c-1200x900.jpg", label: "Slab", division: "residential", tags: ["cabinet","slab","modern","flat","panel","kitchen","cabinets"] },
  { key: "cabinet-stained-dark", url: "https://cdn.sanity.io/images/3at2yyx0/production/324915088c94f84224d700768a3430d6803b372c-1200x900.jpg", label: "Stained Dark", division: "residential", tags: ["cabinet","stained","dark","wood","kitchen","cabinets"] },
  { key: "cabinet-stained-oak", url: "https://cdn.sanity.io/images/3at2yyx0/production/1a7b46c03beb7bad92644cc9e36d290c7d0b6a27-1200x900.jpg", label: "Stained Oak", division: "residential", tags: ["cabinet","stained","oak","wood","kitchen","cabinets"] },
  { key: "cabinet-stock", url: "https://cdn.sanity.io/images/3at2yyx0/production/e7c86b167f76844e6255dfbcc062ad87de20501c-1200x900.jpg", label: "Stock", division: "residential", tags: ["cabinet","stock","simple","kitchen","cabinets"] },
  { key: "cabinet-two-tone", url: "https://cdn.sanity.io/images/3at2yyx0/production/0dd15bd32180ed374cd8e309b288b80de540d250-1200x900.jpg", label: "Two Tone", division: "residential", tags: ["cabinet","two","tone","kitchen","island","cabinets"] },
  { key: "cabinet-white", url: "https://cdn.sanity.io/images/3at2yyx0/production/6c5f7d616adf0f8854ad16117882576be3107847-1200x900.jpg", label: "White", division: "residential", tags: ["cabinet","white","kitchen","cabinets"] },
  { key: "concrete-broom", url: "https://cdn.sanity.io/images/3at2yyx0/production/589dd1d1af99721d7f89ebac1cb4222dbb5e4a21-1200x900.jpg", label: "Broom", division: "concrete", tags: ["concrete","commercial","slab","pour"] },
  { key: "concrete-color-charcoal", url: "https://cdn.sanity.io/images/3at2yyx0/production/90805ab7092cf2b9291c450d1c9923b84a927dc5-1200x900.jpg", label: "Color Charcoal", division: "concrete", tags: ["concrete","color","charcoal","dark","gray","floor"] },
  { key: "concrete-color-red", url: "https://cdn.sanity.io/images/3at2yyx0/production/08ed0b7482b8acedd4ea8d730ada1b920220ec95-1200x900.jpg", label: "Color Red", division: "concrete", tags: ["concrete","color","red","colored","surface"] },
  { key: "concrete-color-tan", url: "https://cdn.sanity.io/images/3at2yyx0/production/7ea292493111aff72fc95ab33ec56f6d49ba5c56-1200x900.jpg", label: "Color Tan", division: "concrete", tags: ["concrete","color","tan","colored","patio"] },
  { key: "concrete-commercial-slab", url: "https://cdn.sanity.io/images/3at2yyx0/production/589dd1d1af99721d7f89ebac1cb4222dbb5e4a21-1200x900.jpg", label: "Commercial Slab", division: "concrete", tags: ["concrete","commercial","slab","pour"] },
  { key: "concrete-driveway", url: "https://cdn.sanity.io/images/3at2yyx0/production/83c9996c0877ca4160efd1c3e4f069c38fece099-1200x900.jpg", label: "Driveway", division: "concrete", tags: ["concrete","driveway","new","house"] },
  { key: "concrete-exposed-aggregate", url: "https://cdn.sanity.io/images/3at2yyx0/production/907b8141305efd21a5d60516adb5ea17141df5ff-1200x900.jpg", label: "Exposed Aggregate", division: "concrete", tags: ["concrete","exposed","aggregate","surface"] },
  { key: "concrete-footing", url: "https://cdn.sanity.io/images/3at2yyx0/production/ece9aaecca1f5eea12c41c0fd2f39619214af00d-1200x900.jpg", label: "Footing", division: "concrete", tags: ["concrete","footing","foundation","trench"] },
  { key: "concrete-forms-prep", url: "https://cdn.sanity.io/images/3at2yyx0/production/597d3ba78c0206997b3172e56871fb4c50b0c62d-1200x900.jpg", label: "Forms Prep", division: "concrete", tags: ["concrete","pour","pouring","construction"] },
  { key: "concrete-pour", url: "https://cdn.sanity.io/images/3at2yyx0/production/597d3ba78c0206997b3172e56871fb4c50b0c62d-1200x900.jpg", label: "Pour", division: "concrete", tags: ["concrete","pour","pouring","construction"] },
  { key: "concrete-rebar-grid", url: "https://cdn.sanity.io/images/3at2yyx0/production/758096dd8692e66eae1b13b85fc729afd502d7c0-1200x900.jpg", label: "Rebar Grid", division: "concrete", tags: ["concrete","rebar","grid","slab","construction"] },
  { key: "concrete-salt-finish", url: "https://cdn.sanity.io/images/3at2yyx0/production/c69ebbd86d03abe8f869779dc649aa8be726f065-1200x900.jpg", label: "Salt Finish", division: "concrete", tags: ["concrete","salt","finish","pool","deck","texture"] },
  { key: "concrete-sealer", url: "https://cdn.sanity.io/images/3at2yyx0/production/543a624aba3ac4a1305777586bd910d2001c3229-1200x900.jpg", label: "Sealer", division: "concrete", tags: ["concrete","sealer","sealing","driveway"] },
  { key: "concrete-trowel-smooth", url: "https://cdn.sanity.io/images/3at2yyx0/production/db9aa1961f75d453f1d26f7fb16c1f9c09464d6c-1200x900.jpg", label: "Trowel Smooth", division: "concrete", tags: ["concrete","trowel","smooth","polished","floor","garage"] },
  { key: "counter-butcher-block", url: "https://cdn.sanity.io/images/3at2yyx0/production/43570e686a16c63eadd76ba5ca9eb9c4be355497-1200x900.jpg", label: "Butcher Block", division: "residential", tags: ["counter","butcher","block","countertop","kitchen"] },
  { key: "counter-color-black", url: "https://cdn.sanity.io/images/3at2yyx0/production/a75a4f5720423188d11b5254f6ae8bbece01619e-1200x900.jpg", label: "Color Black", division: "residential", tags: ["counter","color","black","countertop","kitchen"] },
  { key: "counter-color-gray", url: "https://cdn.sanity.io/images/3at2yyx0/production/ede68b3409b4d48e2ce8f5d0efb5db475b90475a-1200x900.jpg", label: "Color Gray", division: "residential", tags: ["counter","color","gray","countertop","kitchen"] },
  { key: "counter-color-tan", url: "https://cdn.sanity.io/images/3at2yyx0/production/8b1c13bc5e2ecd715ebc9210005afca64544601b-1200x900.jpg", label: "Color Tan", division: "residential", tags: ["counter","color","tan","beige","granite","countertop"] },
  { key: "counter-color-white", url: "https://cdn.sanity.io/images/3at2yyx0/production/3ec507d87254040605ce5d1ef8cdb64d8d8af129-1200x900.jpg", label: "Color White", division: "residential", tags: ["counter","color","white","countertop","kitchen"] },
  { key: "counter-color-white-vein", url: "https://cdn.sanity.io/images/3at2yyx0/production/f4f32f604992a00c90d0421d0b471776a7d0b624-1200x900.jpg", label: "Color White Vein", division: "residential", tags: ["counter","color","white","vein","marble","countertop","veining"] },
  { key: "counter-granite", url: "https://cdn.sanity.io/images/3at2yyx0/production/5dc4fc53de0d1ed2b0b89f6a289642ed16c99284-1200x900.jpg", label: "Granite", division: "residential", tags: ["counter","granite","kitchen","countertop"] },
  { key: "counter-granite-premium", url: "https://cdn.sanity.io/images/3at2yyx0/production/5dc4fc53de0d1ed2b0b89f6a289642ed16c99284-1200x900.jpg", label: "Granite Premium", division: "residential", tags: ["counter","granite","premium","countertop","kitchen","island"] },
  { key: "counter-laminate", url: "https://cdn.sanity.io/images/3at2yyx0/production/c4d6f024db004b6e677505bfac08f4ccb0f11fe7-1200x900.jpg", label: "Laminate", division: "residential", tags: ["counter","laminate","kitchen","countertop"] },
  { key: "counter-quartz", url: "https://cdn.sanity.io/images/3at2yyx0/production/015ddccd77d21849b2ba243bb0a3f8b4eed080f3-1200x900.jpg", label: "Quartz", division: "residential", tags: ["counter","quartz","kitchen","countertop","white"] },
  { key: "counter-quartz-premium", url: "https://cdn.sanity.io/images/3at2yyx0/production/70f8f9fcdad464bf682680260d86b78f831d9c5a-1200x900.jpg", label: "Quartz Premium", division: "residential", tags: ["counter","quartz","premium","marble","look","countertop","kitchen"] },
  { key: "counter-solid-surface", url: "https://cdn.sanity.io/images/3at2yyx0/production/d6b4387d175cead2ccb3f026b377814f52d35d11-1200x900.jpg", label: "Solid Surface", division: "residential", tags: ["counter","solid","surface","white","countertop"] },
  { key: "counter-waterfall", url: "https://cdn.sanity.io/images/3at2yyx0/production/16032112168f002b5a2542f83c03f49a012a9d0f-1200x900.jpg", label: "Waterfall", division: "residential", tags: ["counter","waterfall","edge","kitchen","island"] },
  { key: "deck-color-dark", url: "https://cdn.sanity.io/images/3at2yyx0/production/27df4f1d3716bf7d07253c75e0e3b7708847292b-1200x900.jpg", label: "Color Dark", division: "repairs", tags: ["deck","color","dark","brown"] },
  { key: "deck-color-driftwood", url: "https://cdn.sanity.io/images/3at2yyx0/production/becfa1a40055d76f95fd54d9c31ea26c68b667bc-1200x900.jpg", label: "Color Driftwood", division: "repairs", tags: ["deck","color","driftwood","weathered","gray","decking"] },
  { key: "deck-color-gray", url: "https://cdn.sanity.io/images/3at2yyx0/production/8196ecc5ebc4c84f46ad5a583fe6333da3331296-1200x900.jpg", label: "Color Gray", division: "repairs", tags: ["deck","color","gray","boards"] },
  { key: "deck-composite-entry", url: "https://cdn.sanity.io/images/3at2yyx0/production/36545305015e49c0f4d413e6577fd2a728149b4a-1200x900.jpg", label: "Composite Entry", division: "repairs", tags: ["deck","composite","entry","backyard"] },
  { key: "deck-composite-premium", url: "https://cdn.sanity.io/images/3at2yyx0/production/6f12db419917f508243bde5dd5cc7c6784df563f-1200x900.jpg", label: "Composite Premium", division: "repairs", tags: ["deck","composite","premium","modern","patio"] },
  { key: "deck-ipe", url: "https://cdn.sanity.io/images/3at2yyx0/production/28375dbfb61d91781e89417c3b514af6753de3de-1200x900.jpg", label: "Ipe", division: "repairs", tags: ["deck","ipe","hardwood"] },
  { key: "deck-lighting", url: "https://cdn.sanity.io/images/3at2yyx0/production/bd34b6b1d3698138427295070f50ee8c2bda5e49-1200x900.jpg", label: "Lighting", division: "repairs", tags: ["deck","lighting","evening"] },
  { key: "deck-pergola", url: "https://cdn.sanity.io/images/3at2yyx0/production/365afd496534193e089fd4e9791dd81d1993898e-1200x900.jpg", label: "Pergola", division: "repairs", tags: ["deck","pergola","backyard","patio"] },
  { key: "deck-pvc", url: "https://cdn.sanity.io/images/3at2yyx0/production/c31997ed027f347f424a673c2e68634a508ace26-1200x900.jpg", label: "Pvc", division: "repairs", tags: ["deck","pvc","white","railing"] },
  { key: "deck-rail-aluminum", url: "https://cdn.sanity.io/images/3at2yyx0/production/4289bfc9a4e0500da7db56e61e68766094d845cd-1200x900.jpg", label: "Rail Aluminum", division: "repairs", tags: ["deck","rail","aluminum","black","railing"] },
  { key: "deck-rail-composite", url: "https://cdn.sanity.io/images/3at2yyx0/production/4289bfc9a4e0500da7db56e61e68766094d845cd-1200x900.jpg", label: "Rail Composite", division: "repairs", tags: ["deck","rail","composite","railing"] },
  { key: "deck-rail-glass", url: "https://cdn.sanity.io/images/3at2yyx0/production/b283ae1ec10e549e51be3b44ea3ec4804f13850a-1200x900.jpg", label: "Rail Glass", division: "repairs", tags: ["deck","rail","glass","railing"] },
  { key: "deck-screened", url: "https://cdn.sanity.io/images/3at2yyx0/production/2b07e43a7f5745341a9cb2a7650492d7ad0f4195-1200x900.jpg", label: "Screened", division: "repairs", tags: ["deck","screened","porch","backyard"] },
  { key: "deck-stairs", url: "https://cdn.sanity.io/images/3at2yyx0/production/a8decdb82719d3003fac7833b7cfb5a1d8e28620-1200x900.jpg", label: "Stairs", division: "repairs", tags: ["deck","stairs","wooden"] },
  { key: "door-barn", url: "https://cdn.sanity.io/images/3at2yyx0/production/e48016664a0b91134e36774cdeadfcf69b99d13d-1200x900.jpg", label: "Barn", division: "repairs", tags: ["door","barn","sliding","interior"] },
  { key: "door-exterior-fiberglass", url: "https://cdn.sanity.io/images/3at2yyx0/production/27b1890399b0521eecb2f63bb6d1acdb88e430f3-1200x900.jpg", label: "Exterior Fiberglass", division: "repairs", tags: ["door","exterior","fiberglass","front","with","glass"] },
  { key: "door-exterior-steel", url: "https://cdn.sanity.io/images/3at2yyx0/production/99c5d1db3ea8b0022855d091fef92d6bbe458f63-1200x900.jpg", label: "Exterior Steel", division: "repairs", tags: ["door","exterior","steel","front","house"] },
  { key: "door-exterior-wood", url: "https://cdn.sanity.io/images/3at2yyx0/production/79397669299f323537a822afecf343f72efcd799-1200x900.jpg", label: "Exterior Wood", division: "repairs", tags: ["door","exterior","wood","front","sidelights"] },
  { key: "door-interior-6panel", url: "https://cdn.sanity.io/images/3at2yyx0/production/d36982eae170039642ad2820dd5ce757b0a74d96-1200x900.jpg", label: "Interior 6panel", division: "repairs", tags: ["door","interior","6panel","white"] },
  { key: "door-interior-shaker", url: "https://cdn.sanity.io/images/3at2yyx0/production/d36982eae170039642ad2820dd5ce757b0a74d96-1200x900.jpg", label: "Interior Shaker", division: "repairs", tags: ["door","interior","shaker","modern","white"] },
  { key: "door-sliding-patio", url: "https://cdn.sanity.io/images/3at2yyx0/production/8bc47d2a17553c6a671c7489b5b97c0710d3ae34-1200x900.jpg", label: "Sliding Patio", division: "repairs", tags: ["door","sliding","patio","glass"] },
  { key: "elec-panel-200a", url: "https://cdn.sanity.io/images/3at2yyx0/production/5204edb9aa62e8ad4e0316ac565d50621c4fa788-1200x900.jpg", label: "Panel 200a", division: "electrical", tags: ["elec","panel","200a","electrical","breaker","box"] },
  { key: "fence-aluminum-6", url: "https://cdn.sanity.io/images/3at2yyx0/production/f5e2a2fe991f31170f1e46fdf03607875ef8e58b-1200x900.jpg", label: "Aluminum 6", division: "repairs", tags: ["fence","aluminum","black","metal","commercial"] },
  { key: "fence-cedar", url: "https://cdn.sanity.io/images/3at2yyx0/production/9805fde067c74918db72c7b1d6835c047216fc32-1200x900.jpg", label: "Cedar", division: "repairs", tags: ["fence","cedar","backyard"] },
  { key: "fence-chain-link", url: "https://cdn.sanity.io/images/3at2yyx0/production/39318dd83cbb01c6f067fc0dbcb69220472a72aa-1200x900.jpg", label: "Chain Link", division: "repairs", tags: ["fence","chain","link"] },
  { key: "fence-chain-link-6", url: "https://cdn.sanity.io/images/3at2yyx0/production/39318dd83cbb01c6f067fc0dbcb69220472a72aa-1200x900.jpg", label: "Chain Link 6", division: "repairs", tags: ["fence","chain","link","tall"] },
  { key: "fence-field-wire", url: "https://cdn.sanity.io/images/3at2yyx0/production/883c737d885ca6ee428450b535264bc7c9ffa303-1200x900.jpg", label: "Field Wire", division: "repairs", tags: ["fence","field","wire","pasture"] },
  { key: "fence-gate-wood", url: "https://cdn.sanity.io/images/3at2yyx0/production/af91495eb76f0f443b6bbc6b6893f7fe7e692a54-1200x900.jpg", label: "Gate Wood", division: "repairs", tags: ["fence","gate","wood","wooden"] },
  { key: "fence-ranch-rail", url: "https://cdn.sanity.io/images/3at2yyx0/production/5c1f82759e8c4a36154234ea88179b001f55bc06-1200x900.jpg", label: "Ranch Rail", division: "repairs", tags: ["fence","ranch","rail","wood","farm"] },
  { key: "fence-vinyl-picket", url: "https://cdn.sanity.io/images/3at2yyx0/production/98650553e368b038d072262ef64d902f7efcc949-1200x900.jpg", label: "Vinyl Picket", division: "repairs", tags: ["fence","vinyl","picket","white"] },
  { key: "fence-wood-picket", url: "https://cdn.sanity.io/images/3at2yyx0/production/b0e16f0f71dbdcffe1a0de0fba0be3137d01b7d3-1200x900.jpg", label: "Wood Picket", division: "repairs", tags: ["fence","wood","picket","yard"] },
  { key: "fence-wood-privacy", url: "https://cdn.sanity.io/images/3at2yyx0/production/9805fde067c74918db72c7b1d6835c047216fc32-1200x900.jpg", label: "Wood Privacy", division: "repairs", tags: ["fence","wood","privacy","wooden","backyard"] },
  { key: "floor-color-dark", url: "https://cdn.sanity.io/images/3at2yyx0/production/e9de9051091b2d20de90fe28ab437bbacbc31ea7-1200x900.jpg", label: "Color Dark", division: "residential", tags: ["floor","color","dark","walnut","wood"] },
  { key: "floor-color-gray", url: "https://cdn.sanity.io/images/3at2yyx0/production/fcdf7c948386f48bd85a5f0dc64e826c51b3693a-1200x900.jpg", label: "Color Gray", division: "residential", tags: ["floor","color","gray","wood","room"] },
  { key: "floor-color-honey", url: "https://cdn.sanity.io/images/3at2yyx0/production/80831568d6e4e12955113aee876ead01fcd28f33-1200x900.jpg", label: "Color Honey", division: "residential", tags: ["floor","color","honey","colored","wood"] },
  { key: "floor-color-natural-oak", url: "https://cdn.sanity.io/images/3at2yyx0/production/023bc692995595cdd4ba0cbb0725830b0836a163-1200x900.jpg", label: "Color Natural Oak", division: "residential", tags: ["floor","color","natural","oak","light","wood"] },
  { key: "floor-color-whitewash", url: "https://cdn.sanity.io/images/3at2yyx0/production/398fc570fd0822493a6e3fbf261754a23a8f4a22-1200x900.jpg", label: "Color Whitewash", division: "residential", tags: ["floor","color","whitewash","whitewashed","wood"] },
  { key: "floor-engineered-hardwood", url: "https://cdn.sanity.io/images/3at2yyx0/production/46244f2260869c281a92344938a5ae8f0b851a17-1200x900.jpg", label: "Engineered Hardwood", division: "residential", tags: ["floor","engineered","hardwood","room"] },
  { key: "floor-laminate", url: "https://cdn.sanity.io/images/3at2yyx0/production/f9e6560afeb328b89f0df5d80ab6654f465bed83-1200x900.jpg", label: "Laminate", division: "residential", tags: ["floor","laminate","wood","flooring"] },
  { key: "floor-lvp", url: "https://cdn.sanity.io/images/3at2yyx0/production/06e0df0b6ee00032970c0a8ce108e5f1c6a917dc-1200x900.jpg", label: "Lvp", division: "residential", tags: ["floor","lvp","luxury","vinyl","plank","flooring","room"] },
  { key: "floor-lvp-premium", url: "https://cdn.sanity.io/images/3at2yyx0/production/06e0df0b6ee00032970c0a8ce108e5f1c6a917dc-1200x900.jpg", label: "Lvp Premium", division: "residential", tags: ["floor","lvp","premium","vinyl","plank","living","room"] },
  { key: "floor-oak-site-finished", url: "https://cdn.sanity.io/images/3at2yyx0/production/a1866607bcd0c9ad7acec8cf780b0c07b64af328-1200x900.jpg", label: "Oak Site Finished", division: "residential", tags: ["floor","oak","site","finished","wood","sanded"] },
  { key: "floor-polished-concrete", url: "https://cdn.sanity.io/images/3at2yyx0/production/03ac57b1dc28faf6a1c7476dd8bea7317d056b8a-1200x900.jpg", label: "Polished Concrete", division: "residential", tags: ["floor","polished","concrete","interior"] },
  { key: "floor-solid-hardwood", url: "https://cdn.sanity.io/images/3at2yyx0/production/21dddb6aeb2003a7f168ebcd6c20a03d72e13abb-1200x900.jpg", label: "Solid Hardwood", division: "residential", tags: ["floor","solid","hardwood","living","room"] },
  { key: "floor-tile-wood-look", url: "https://cdn.sanity.io/images/3at2yyx0/production/7681708006aa47f4246a763539ccab0a4d4853ed-1200x900.jpg", label: "Tile Wood Look", division: "residential", tags: ["floor","tile","wood","look"] },
  { key: "garage-door-faux-wood", url: "https://cdn.sanity.io/images/3at2yyx0/production/9915c7b84b94325ba97b6d191da75c57ebc1a14e-1200x900.jpg", label: "Door Faux Wood", division: "residential", tags: ["garage","door","faux","wood","look"] },
  { key: "garage-door-single", url: "https://cdn.sanity.io/images/3at2yyx0/production/2c72b0c71b44fa561c2f4edfcbce67af5f90990e-1200x900.jpg", label: "Door Single", division: "residential", tags: ["garage","door","single","house"] },
  { key: "garage-door-steel", url: "https://cdn.sanity.io/images/3at2yyx0/production/2c72b0c71b44fa561c2f4edfcbce67af5f90990e-1200x900.jpg", label: "Door Steel", division: "residential", tags: ["garage","door","steel","house","exterior"] },
  { key: "grease-3comp-sink", url: "/images/utilities/subs/grease-fog-source.jpg", label: "Kitchen FOG Source", division: "grease_traps", tags: ["3comp","sink","kitchen","fog","source"] },
  { key: "grease-indoor-hgi", url: "/images/utilities/subs/grease-commercial-kitchen.jpg", label: "Commercial Kitchen", division: "grease_traps", tags: ["indoor","hgi","commercial","kitchen"] },
  { key: "grease-precast-concrete", url: "/images/utilities/jr-grease-interceptor.jpg", label: "JR — Grease Interceptor", division: "grease_traps", tags: ["precast","concrete","grease","interceptor"] },
  { key: "masonry-brick-brown", url: "https://cdn.sanity.io/images/3at2yyx0/production/3ca2e37f136f10ade0f16dbb986c3e97dcb9c9a8-1200x900.jpg", label: "Brick Brown", division: "concrete", tags: ["masonry","brick","brown","wall","texture"] },
  { key: "masonry-brick-gray", url: "https://cdn.sanity.io/images/3at2yyx0/production/4ece6950bf6569af282821e0f563064652ea422c-1200x900.jpg", label: "Brick Gray", division: "concrete", tags: ["masonry","brick","gray","wall"] },
  { key: "masonry-brick-tumbled", url: "https://cdn.sanity.io/images/3at2yyx0/production/b4727cf43b436b43455c725f676649b05cfcac6d-1200x900.jpg", label: "Brick Tumbled", division: "concrete", tags: ["masonry","brick","tumbled","old","reclaimed","wall"] },
  { key: "masonry-brick-veneer", url: "https://cdn.sanity.io/images/3at2yyx0/production/ef52b6907d33542a380d281f59c52ddbb0ed7dd8-1200x900.jpg", label: "Brick Veneer", division: "concrete", tags: ["masonry","brick","veneer","wall","house","exterior"] },
  { key: "masonry-brick-white", url: "https://cdn.sanity.io/images/3at2yyx0/production/098316d708e6ba98446afb5bd37a177257295618-1200x900.jpg", label: "Brick White", division: "concrete", tags: ["masonry","brick","white","painted","wall"] },
  { key: "masonry-cmu", url: "https://cdn.sanity.io/images/3at2yyx0/production/5b6f5edfaf68f7279f41b55bafb93237a6478e0f-1200x900.jpg", label: "Cmu", division: "concrete", tags: ["masonry","cmu","concrete","block","wall","construction"] },
  { key: "masonry-column", url: "https://cdn.sanity.io/images/3at2yyx0/production/2b8943bc5f93825b79f8ec1a84f3f6179964ee7f-1200x900.jpg", label: "Column", division: "concrete", tags: ["masonry","column","brick","porch"] },
  { key: "masonry-natural-stone", url: "https://cdn.sanity.io/images/3at2yyx0/production/ecc929d6e01bb35a5df5c91900a02893b166de88-1200x900.jpg", label: "Natural Stone", division: "concrete", tags: ["masonry","natural","stone","wall","exterior"] },
  { key: "masonry-splitface", url: "https://cdn.sanity.io/images/3at2yyx0/production/5b6f5edfaf68f7279f41b55bafb93237a6478e0f-1200x900.jpg", label: "Splitface", division: "concrete", tags: ["masonry","splitface","split","face","concrete","block","wall"] },
  { key: "masonry-stone-veneer", url: "https://cdn.sanity.io/images/3at2yyx0/production/0a3d0561c5a82b0f857337eaf576a039966fb320-1200x900.jpg", label: "Stone Veneer", division: "concrete", tags: ["masonry","stone","veneer","wall","house"] },
  { key: "masonry-stucco", url: "https://cdn.sanity.io/images/3at2yyx0/production/645158ce7082333823a172daf1e0e48ef4428717-1200x900.jpg", label: "Stucco", division: "concrete", tags: ["masonry","stucco","wall","house","exterior"] },
  { key: "paint-cabinets", url: "https://cdn.sanity.io/images/3at2yyx0/production/36506e36fae90c9fa242627eef16df3ad32b7882-1200x900.jpg", label: "Cabinets", division: "repairs", tags: ["paint","cabinets","painted","kitchen","white"] },
  { key: "paint-can", url: "https://cdn.sanity.io/images/3at2yyx0/production/ef12e68cbd234d106febc27f19dcbaf09269b76c-1200x900.jpg", label: "Can", division: "repairs", tags: ["paint","can","cans","and","brushes"] },
  { key: "paint-exterior", url: "https://cdn.sanity.io/images/3at2yyx0/production/7448b18555c5c18a3c5f596dc92e74ed0b881866-1200x900.jpg", label: "Exterior", division: "repairs", tags: ["paint","exterior","painting","house"] },
  { key: "paint-interior-walls", url: "https://cdn.sanity.io/images/3at2yyx0/production/9afc70f75d688dcf82bb77c91c01e3b727beeb26-1200x900.jpg", label: "Interior Walls", division: "repairs", tags: ["paint","interior","walls","painting","wall","roller"] },
  { key: "plumb-copper", url: "https://cdn.sanity.io/images/3at2yyx0/production/8e36b0862753809a567b9dc00d31c32805f00d3e-1200x900.jpg", label: "Copper", division: "plumbing", tags: ["plumb","copper","plumbing","pipes"] },
  { key: "plumb-faucet-black", url: "https://cdn.sanity.io/images/3at2yyx0/production/80cc24b4ff450184234b51bf8f65f131b46dc2df-1200x900.jpg", label: "Faucet Black", division: "plumbing", tags: ["plumb","faucet","black","matte","kitchen"] },
  { key: "plumb-faucet-chrome", url: "https://cdn.sanity.io/images/3at2yyx0/production/27a39c6647e867b9fb08075c62b1a5f90514f4ae-1200x900.jpg", label: "Faucet Chrome", division: "plumbing", tags: ["plumb","faucet","chrome","kitchen"] },
  { key: "plumb-faucet-gold", url: "https://cdn.sanity.io/images/3at2yyx0/production/26b530f26f38284e3afd3909e90fbc5f3622d3f2-1200x900.jpg", label: "Faucet Gold", division: "plumbing", tags: ["plumb","faucet","gold","bathroom"] },
  { key: "plumb-faucet-nickel", url: "https://cdn.sanity.io/images/3at2yyx0/production/78b144da6cbbe4beaf98ed00421d04609c3ed6fa-1200x900.jpg", label: "Faucet Nickel", division: "plumbing", tags: ["plumb","faucet","nickel","brushed","bathroom"] },
  { key: "plumb-fixture-premium", url: "https://cdn.sanity.io/images/3at2yyx0/production/ee8776be07f307d51d6580a6cc8f2fc6964491cd-1200x900.jpg", label: "Fixture Premium", division: "plumbing", tags: ["plumb","fixture","premium","modern","bathroom","fixtures","sink"] },
  { key: "plumb-pex", url: "/images/utilities/jr-underslab-rough.jpg", label: "JR — Under-Slab Rough-In", division: "plumbing", tags: ["pex","under","slab","rough"] },
  { key: "plumb-pex-manifold", url: "/images/utilities/jr-underslab-rough.jpg", label: "Pex Manifold", division: "plumbing", tags: ["pex","under","slab","rough"] },
  { key: "plumb-wh-gas", url: "https://cdn.sanity.io/images/3at2yyx0/production/91a38d070d89d1e864c3c0bfe1c7879a0a09e822-1200x900.jpg", label: "Wh Gas", division: "plumbing", tags: ["plumb","gas","water","heater","installation","basement"] },
  { key: "porch-columns", url: "https://cdn.sanity.io/images/3at2yyx0/production/9c23bafc14715a7c134193e50a81428f74b2ac98-1200x900.jpg", label: "Columns", division: "residential", tags: ["porch","columns","house","front"] },
  { key: "porch-covered", url: "https://cdn.sanity.io/images/3at2yyx0/production/e6eed480f21cfa08d4ff5c50343a12ddbc22784e-1200x900.jpg", label: "Covered", division: "residential", tags: ["porch","covered","front","house"] },
  { key: "porch-outdoor-kitchen", url: "https://cdn.sanity.io/images/3at2yyx0/production/d642b37c0888399885cea647e097383151564d27-1200x900.jpg", label: "Outdoor Kitchen", division: "residential", tags: ["porch","outdoor","kitchen","patio","grill"] },
  { key: "porch-screened", url: "https://cdn.sanity.io/images/3at2yyx0/production/fc13733d42a1d0abf4f8ed00839e1751ef484b24-1200x900.jpg", label: "Screened", division: "residential", tags: ["porch","screened"] },
  { key: "porch-tongue-groove", url: "https://cdn.sanity.io/images/3at2yyx0/production/6f9d4d9cbaaa5ea984cb09cd4f949abc37cc475a-1200x900.jpg", label: "Tongue Groove", division: "residential", tags: ["porch","tongue","groove","ceiling","wood"] },
  { key: "roof-architectural", url: "https://cdn.sanity.io/images/3at2yyx0/production/c94e570470b949fffe5f07406eb72e1d8ec51c58-1200x900.jpg", label: "Architectural", division: "roofing", tags: ["roof","architectural","asphalt","shingle","installation"] },
  { key: "roof-designer", url: "https://cdn.sanity.io/images/3at2yyx0/production/38fd54de2d73812700030af46295f7200217eb4d-1200x900.jpg", label: "Designer", division: "roofing", tags: ["roof","designer","luxury","shingle","large","house"] },
  { key: "roof-gutter-half-round", url: "https://cdn.sanity.io/images/3at2yyx0/production/93a5181473720dfb55dd9ffd1329d5aadb20aa73-1200x900.jpg", label: "Gutter Half Round", division: "roofing", tags: ["roof","gutter","half","round","house"] },
  { key: "roof-gutter-k-style", url: "https://cdn.sanity.io/images/3at2yyx0/production/06493db74868be62eea8d2f10e89837e58b2e0bf-1200x900.jpg", label: "Gutter K Style", division: "roofing", tags: ["roof","gutter","style","rain","house","roofline"] },
  { key: "roof-ice-water", url: "https://cdn.sanity.io/images/3at2yyx0/production/38fd54de2d73812700030af46295f7200217eb4d-1200x900.jpg", label: "Ice Water", division: "roofing", tags: ["roof","ice","water","roofers","installing","membrane"] },
  { key: "roof-metal-black", url: "https://cdn.sanity.io/images/3at2yyx0/production/7ab83a81c911e30a3a86e8fb125e018708546f2e-1200x900.jpg", label: "Metal Black", division: "roofing", tags: ["roof","metal","black","modern","house"] },
  { key: "roof-metal-exposed", url: "https://cdn.sanity.io/images/3at2yyx0/production/3581eac9b4a861b717a8ece679d23569d8403993-1200x900.jpg", label: "Metal Exposed", division: "roofing", tags: ["roof","metal","exposed","corrugated","barn"] },
  { key: "roof-metal-galvalume", url: "https://cdn.sanity.io/images/3at2yyx0/production/f03bb4435183dfc6347a737de23c7162b6223f7d-1200x900.jpg", label: "Metal Galvalume", division: "roofing", tags: ["roof","metal","galvalume","silver","panels"] },
  { key: "roof-metal-green", url: "https://cdn.sanity.io/images/3at2yyx0/production/7df987eeef9d5ed2229d70fcb27cdc969f3e6e15-1200x900.jpg", label: "Metal Green", division: "roofing", tags: ["roof","metal","green","building"] },
  { key: "roof-metal-red", url: "https://cdn.sanity.io/images/3at2yyx0/production/e76a62d48dc8f9df1ce52ded1d516ae994a1f65d-1200x900.jpg", label: "Metal Red", division: "roofing", tags: ["roof","metal","red","house"] },
  { key: "roof-metal-white", url: "https://cdn.sanity.io/images/3at2yyx0/production/746266247e34bd3c85dbf379e76fd701accae72f-1200x900.jpg", label: "Metal White", division: "roofing", tags: ["roof","metal","white"] },
  { key: "roof-shingle-black", url: "https://cdn.sanity.io/images/3at2yyx0/production/f891c70fcaa169a1611f0c4de10a34eedd034aa9-1200x900.jpg", label: "Shingle Black", division: "roofing", tags: ["roof","shingle","black","house","exterior"] },
  { key: "roof-shingle-charcoal", url: "https://cdn.sanity.io/images/3at2yyx0/production/f891c70fcaa169a1611f0c4de10a34eedd034aa9-1200x900.jpg", label: "Shingle Charcoal", division: "roofing", tags: ["roof","shingle","charcoal","dark","gray","asphalt","close"] },
  { key: "roof-shingle-pewter", url: "https://cdn.sanity.io/images/3at2yyx0/production/f891c70fcaa169a1611f0c4de10a34eedd034aa9-1200x900.jpg", label: "Shingle Pewter", division: "roofing", tags: ["roof","shingle","pewter","gray","texture"] },
  { key: "roof-shingle-slate", url: "https://cdn.sanity.io/images/3at2yyx0/production/32fc2f56b4dc416910b1858170e62d4052ac9b07-1200x900.jpg", label: "Shingle Slate", division: "roofing", tags: ["roof","shingle","slate","gray","shingles","house"] },
  { key: "roof-standing-seam", url: "https://cdn.sanity.io/images/3at2yyx0/production/d8e09009b9163a6bff7d353372efae2d5dee3857-1200x900.jpg", label: "Standing Seam", division: "roofing", tags: ["roof","standing","seam","metal"] },
  { key: "roof-synthetic-underlayment", url: "https://cdn.sanity.io/images/3at2yyx0/production/c94e570470b949fffe5f07406eb72e1d8ec51c58-1200x900.jpg", label: "Synthetic Underlayment", division: "roofing", tags: ["roof","synthetic","underlayment","installation"] },
  { key: "septic-soil-eval", url: "/images/utilities/subs/septic-soil-evaluation.jpg", label: "Soil Evaluation", division: "septic", tags: ["soil","eval","soil","evaluation"] },
  { key: "septic-tank-concrete", url: "/images/utilities/jr-septic-tank-set.jpg", label: "JR — Septic Tank Set", division: "septic", tags: ["tank","concrete","septic","tank","set"] },
  { key: "siding-board-batten", url: "https://cdn.sanity.io/images/3at2yyx0/production/720f7293cb9ff8c1d160bfb82c7efd98a33307a8-1200x900.jpg", label: "Board Batten", division: "residential", tags: ["siding","board","batten","and","house"] },
  { key: "siding-cedar", url: "https://cdn.sanity.io/images/3at2yyx0/production/5b7a99ed4ec7dc8558c6b359dcb947bdcfe0adc2-1200x900.jpg", label: "Cedar", division: "residential", tags: ["siding","cedar","shake","house"] },
  { key: "siding-color-black", url: "https://cdn.sanity.io/images/3at2yyx0/production/559e72abb86323a419c9f9ec9f90655dc8139cef-1200x900.jpg", label: "Color Black", division: "residential", tags: ["siding","color","black","house","exterior","modern","farmhouse"] },
  { key: "siding-color-charcoal", url: "https://cdn.sanity.io/images/3at2yyx0/production/e940b6118fb64ee9f5e542733a11b6847c8f988e-1200x900.jpg", label: "Color Charcoal", division: "residential", tags: ["siding","color","charcoal","dark","gray","house","exterior","modern"] },
  { key: "siding-color-green", url: "https://cdn.sanity.io/images/3at2yyx0/production/5d0d2204b968c4ac65419572ed62968715580214-1200x900.jpg", label: "Color Green", division: "residential", tags: ["siding","color","green","sage","house","exterior"] },
  { key: "siding-color-navy", url: "https://cdn.sanity.io/images/3at2yyx0/production/99c5c430b136bbda38f30f1437040be24fd880c8-1200x900.jpg", label: "Color Navy", division: "residential", tags: ["siding","color","navy","blue","house","exterior"] },
  { key: "siding-color-tan", url: "https://cdn.sanity.io/images/3at2yyx0/production/9c96e7ac542e838a01e35bb7527ee6f18be57d77-1200x900.jpg", label: "Color Tan", division: "residential", tags: ["siding","color","tan","beige","house","exterior"] },
  { key: "siding-color-white", url: "https://cdn.sanity.io/images/3at2yyx0/production/cbf2d3e13eeb3e2b47e17dc760092d647c4847c8-1200x900.jpg", label: "Color White", division: "residential", tags: ["siding","color","white","house","exterior"] },
  { key: "siding-hardie-colorplus", url: "https://cdn.sanity.io/images/3at2yyx0/production/328625d19c6ffd0029a7db8a399bf7dd36ece218-1200x900.jpg", label: "Hardie Colorplus", division: "residential", tags: ["siding","hardie","colorplus","modern","lap","home","exterior"] },
  { key: "siding-pvc-trim", url: "https://cdn.sanity.io/images/3at2yyx0/production/0746541dcce6020a459516f4ce2865a256131173-1200x900.jpg", label: "Pvc Trim", division: "residential", tags: ["siding","pvc","trim","white","house","exterior","detail"] },
  { key: "siding-shake-gable", url: "https://cdn.sanity.io/images/3at2yyx0/production/28e10028b3fb5cb3f07b28ce9b0fd520f772d45d-1200x900.jpg", label: "Shake Gable", division: "residential", tags: ["siding","shake","gable","shingle","house"] },
  { key: "siding-shutters", url: "https://cdn.sanity.io/images/3at2yyx0/production/54a5086f75e9143c871075486a5699db838555c6-1200x900.jpg", label: "Shutters", division: "residential", tags: ["siding","shutters","window","house","exterior"] },
  { key: "stairs-iron-baluster", url: "https://cdn.sanity.io/images/3at2yyx0/production/1d649b49f5757473171c8aa59d12d228c67df729-1200x900.jpg", label: "Iron Baluster", division: "residential", tags: ["stairs","iron","baluster","staircase"] },
  { key: "trim-builder", url: "https://cdn.sanity.io/images/3at2yyx0/production/f84ce9e33b2e5abc061eb86af454bc0f3e1d7a56-1200x900.jpg", label: "Builder", division: "residential", tags: ["trim","builder","white","baseboard","interior"] },
  { key: "trim-builtins", url: "https://cdn.sanity.io/images/3at2yyx0/production/25fc45e3dae543937581d52efbf413e861321b1e-1200x900.jpg", label: "Builtins", division: "residential", tags: ["trim","builtins","built","shelves","fireplace"] },
  { key: "trim-coffered", url: "https://cdn.sanity.io/images/3at2yyx0/production/74484d8b33ffe7e0591c50fd01990157e835c27a-1200x900.jpg", label: "Coffered", division: "residential", tags: ["trim","coffered","ceiling","room"] },
  { key: "trim-shiplap", url: "https://cdn.sanity.io/images/3at2yyx0/production/7284f3baed35945c8a6c45570cee2b86eb67858f-1200x900.jpg", label: "Shiplap", division: "residential", tags: ["trim","shiplap","accent","wall","interior"] },
  { key: "trim-upgraded", url: "https://cdn.sanity.io/images/3at2yyx0/production/4c873d4b70622cebfc6d86a23ef41c4b6dbc4baf-1200x900.jpg", label: "Upgraded", division: "residential", tags: ["trim","upgraded","interior","molding","door","casing"] },
  { key: "trim-wainscot", url: "https://cdn.sanity.io/images/3at2yyx0/production/14476ba69c348bf2eb96f3d5c75cd21d8f5e3541-1200x900.jpg", label: "Wainscot", division: "residential", tags: ["trim","wainscot","wainscoting","wall","interior"] },
  { key: "util-c900-pvc", url: "/images/utilities/subs/pvc-pipe-stock.jpg", label: "C900 PVC Pipe", division: "utilities", tags: ["c900","pvc","c900","pvc","pipe"] },
  { key: "util-catch-basin", url: "/images/utilities/subs/storm-catch-basin-grate.jpg", label: "Catch Basin & Grate", division: "utilities", tags: ["catch","basin","catch","basin","grate"] },
  { key: "util-drain-basin", url: "/images/utilities/subs/storm-clogged-inlet.jpg", label: "Yard Drain Inlet", division: "utilities", tags: ["drain","basin","yard","drain","inlet"] },
  { key: "util-ductile-iron", url: "/images/utilities/jr-tapping-sleeve.jpg", label: "JR — Tapping Sleeve & DIP", division: "utilities", tags: ["ductile","iron","tapping","sleeve","dip"] },
  { key: "util-ductile-iron-valve", url: "/images/utilities/jr-ductile-iron-valve.jpg", label: "JR — Ductile Iron Valve", division: "utilities", tags: ["ductile","iron","valve","ductile","iron","valve"] },
  { key: "util-gate-valve", url: "/images/utilities/jr-valve-trench.jpg", label: "JR — Valve in Trench", division: "utilities", tags: ["gate","valve","valve","trench"] },
  { key: "util-hdpe-storm", url: "/images/utilities/subs/storm-hdpe-outfall.jpg", label: "HDPE Storm Outfall", division: "utilities", tags: ["hdpe","storm","hdpe","storm","outfall"] },
  { key: "util-hot-tap", url: "/images/utilities/jr-hot-tap.jpg", label: "JR — Hot Tap Rig", division: "utilities", tags: ["hot","tap","hot","tap","rig"] },
  { key: "util-manhole", url: "/images/utilities/subs/sewer-structures-hdpe.jpg", label: "Sewer Structures", division: "utilities", tags: ["manhole","sewer","structures"] },
  { key: "util-rock-hammer", url: "https://cdn.sanity.io/images/3at2yyx0/production/4cdcb60d963545091e7904dfc5a1aeb65971aab9-1200x900.jpg", label: "Rock Hammer", division: "utilities", tags: ["util","rock","hammer","concrete","demolition","breaking"] },
  { key: "util-sdr35-sewer", url: "/images/utilities/jr-sewer-lateral.jpg", label: "JR — Sewer Lateral", division: "utilities", tags: ["sdr35","sewer","sewer","lateral"] },
  { key: "util-service-line", url: "/images/utilities/px-37627673.jpg", label: "Service Line Trench", division: "utilities", tags: ["service","line","service","line","trench"] },
  { key: "util-stone-bedding", url: "/images/utilities/subs/waterline-bedded-pipe.jpg", label: "Stone-Bedded Pipe", division: "utilities", tags: ["stone","bedding","stone","bedded","pipe"] },
  { key: "util-trench-backfill", url: "/images/utilities/px-37627672.jpg", label: "Trench & Backfill", division: "utilities", tags: ["trench","backfill","trench","backfill"] },
  { key: "util-trench-open", url: "/images/utilities/subs/waterline-trench-bedding.jpg", label: "Open Trench & Bedding", division: "utilities", tags: ["trench","open","open","trench","bedding"] },
  { key: "window-black", url: "https://cdn.sanity.io/images/3at2yyx0/production/2c7bdc7a0427bb660adaedb959468d8a2640c4f6-1200x900.jpg", label: "Black", division: "repairs", tags: ["window","black","frames","house","exterior"] },
  { key: "window-casement", url: "https://cdn.sanity.io/images/3at2yyx0/production/60d02bd73ed4cd3382621f8d4f963c0ecd3bee99-1200x900.jpg", label: "Casement", division: "repairs", tags: ["window","casement","open"] },
  { key: "window-grids", url: "https://cdn.sanity.io/images/3at2yyx0/production/a764ef3760415daf9e7a1c81483d46fd965845ab-1200x900.jpg", label: "Grids", division: "repairs", tags: ["window","grids","with","grilles","white"] },
  { key: "window-vinyl", url: "https://cdn.sanity.io/images/3at2yyx0/production/a013f51f6056b74dc412be04245a98d52756f00b-1200x900.jpg", label: "Vinyl", division: "repairs", tags: ["window","vinyl","double","hung","house"] },
  { key: "window-vinyl-premium", url: "https://cdn.sanity.io/images/3at2yyx0/production/2db9731428090f9281663f1742d0d93b3077064b-1200x900.jpg", label: "Vinyl Premium", division: "repairs", tags: ["window","vinyl","premium","new","installation","home"] },
  { key: "window-wood-clad", url: "https://cdn.sanity.io/images/3at2yyx0/production/80831568d6e4e12955113aee876ead01fcd28f33-1200x900.jpg", label: "Wood Clad", division: "repairs", tags: ["window","wood","clad","interior"] },
];

/** Default image for a preset choice key (first match), or null. */
export function imageForKey(key?: string | null): string | null {
  if (!key) return null;
  const hit = OPTION_IMAGES.find((im) => im.key === key);
  return hit ? hit.url : null;
}

/** Library search — matches key, label, tags, division. */
export function searchImages(q: string, division?: string): OptionImage[] {
  const needle = q.trim().toLowerCase();
  return OPTION_IMAGES.filter((im) => {
    if (division && im.division && im.division !== division) return false;
    if (!needle) return true;
    return (im.key + ' ' + im.label + ' ' + im.tags.join(' ') + ' ' + (im.division || '')).toLowerCase().includes(needle);
  });
}

/** Suggestions for a choice label — tokenized match against tags/labels. */
export function suggestImages(choiceLabel: string, groupLabel?: string, limit = 12): OptionImage[] {
  const tokens = (choiceLabel + ' ' + (groupLabel || ''))
    .toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  if (!tokens.length) return OPTION_IMAGES.slice(0, limit);
  const scored = OPTION_IMAGES.map((im) => {
    const hay = (im.key + ' ' + im.label + ' ' + im.tags.join(' ')).toLowerCase();
    const score = tokens.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
    return { im, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.im);
}
