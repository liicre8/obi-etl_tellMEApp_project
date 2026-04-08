import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  // 1. Unique key
  source_id:   { type: String, required: true, index: true },  

  // 2. URL back to the Coles page
  source_url:  { type: String, required: true },                

  // 3. Human-readable fields
  name:        { type: String, default: 'N/A' },                
  image_url:   { type: String, default: 'N/A' },                
  barcode:     { type: String, default: null },                

  // 4. Category metadata
  category_id: { type: String, default: null },                 
  level1:      { type: String, default: null },                 
  level2:      { type: String, default: null },                 
  level3:      { type: String, default: null },                 

  // 5. Shop, weight, pricing
  shop:        { type: String, default: 'coles' },              
  weight:      { type: String, default: null },                

  prices: [
    {
      state:          { type: String, required: true },   // e.g. "NSW"
      price:          { type: String, required: true },   // cents as string, e.g. "1200"
      price_per_unit: { type: String, required: true },   // e.g. "2400"
      price_unit:     { type: String, required: true }    // e.g. "1kg"
    }
  ]
}, {
  timestamps: true
});

export default mongoose.model('Product', ProductSchema);
