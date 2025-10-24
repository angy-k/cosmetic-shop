#!/usr/bin/env node
const { MongoClient } = require('mongodb');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI is not set in .env file');
  process.exit(1);
}

// Sample products data
const sampleProducts = [
  {
    name: "Hydrating Face Serum",
    description: "A lightweight, fast-absorbing serum that delivers intense hydration to all skin types. Formulated with hyaluronic acid and vitamin B5 to plump and smooth the skin.",
    shortDescription: "Lightweight hydrating serum with hyaluronic acid",
    price: 29.99,
    originalPrice: 39.99,
    category: "skincare",
    subcategory: "serums",
    brand: "GlowLab",
    sku: "GL-HS-001",
    images: [
      {
        url: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop",
        alt: "Hydrating Face Serum bottle",
        isPrimary: true
      }
    ],
    inventory: {
      quantity: 50,
      lowStockThreshold: 10,
      trackInventory: true
    },
    specifications: {
      weight: { value: 30, unit: "ml" },
      skinType: ["all", "dry", "normal"],
      concerns: ["dryness"]
    },
    tags: ["hydrating", "serum", "hyaluronic-acid"],
    isActive: true,
    isFeatured: true,
    rating: { average: 4.5, count: 23 }
  },
  {
    name: "Vitamin C Brightening Cream",
    description: "A rich, nourishing cream infused with vitamin C to brighten and even skin tone. Perfect for daily use to achieve a radiant, glowing complexion.",
    shortDescription: "Brightening cream with vitamin C for radiant skin",
    price: 34.99,
    category: "skincare",
    subcategory: "moisturizers",
    brand: "RadiantSkin",
    sku: "RS-VC-002",
    images: [
      {
        url: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400&h=400&fit=crop",
        alt: "Vitamin C Brightening Cream jar",
        isPrimary: true
      }
    ],
    inventory: {
      quantity: 30,
      lowStockThreshold: 5,
      trackInventory: true
    },
    specifications: {
      weight: { value: 50, unit: "ml" },
      skinType: ["normal", "dry", "combination"],
      concerns: ["pigmentation", "dryness"]
    },
    tags: ["vitamin-c", "brightening", "moisturizer"],
    isActive: true,
    rating: { average: 4.2, count: 18 }
  },
  {
    name: "Gentle Cleansing Oil",
    description: "A luxurious cleansing oil that effectively removes makeup and impurities while nourishing the skin. Suitable for all skin types, including sensitive skin.",
    shortDescription: "Gentle oil cleanser for makeup removal",
    price: 24.99,
    category: "skincare",
    subcategory: "cleansers",
    brand: "PureSkin",
    sku: "PS-CO-003",
    images: [
      {
        url: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=400&fit=crop",
        alt: "Gentle Cleansing Oil bottle",
        isPrimary: true
      }
    ],
    inventory: {
      quantity: 25,
      lowStockThreshold: 8,
      trackInventory: true
    },
    specifications: {
      weight: { value: 100, unit: "ml" },
      skinType: ["all", "sensitive"],
      concerns: ["sensitivity"]
    },
    tags: ["cleansing", "oil", "gentle", "makeup-remover"],
    isActive: true,
    rating: { average: 4.7, count: 31 }
  },
  {
    name: "Matte Liquid Lipstick",
    description: "Long-lasting matte liquid lipstick with intense color payoff. Comfortable formula that doesn't dry out lips. Available in multiple shades.",
    shortDescription: "Long-lasting matte liquid lipstick",
    price: 18.99,
    originalPrice: 22.99,
    category: "makeup",
    subcategory: "lips",
    brand: "ColorPop",
    sku: "CP-MLL-004",
    images: [
      {
        url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop",
        alt: "Matte Liquid Lipstick tube",
        isPrimary: true
      }
    ],
    inventory: {
      quantity: 40,
      lowStockThreshold: 12,
      trackInventory: true
    },
    specifications: {
      weight: { value: 3.5, unit: "ml" }
    },
    tags: ["lipstick", "matte", "long-lasting"],
    isActive: true,
    isOnSale: true,
    rating: { average: 4.3, count: 45 }
  },
  {
    name: "Nourishing Hair Mask",
    description: "Intensive treatment mask for dry and damaged hair. Enriched with natural oils and proteins to restore shine and softness.",
    shortDescription: "Intensive nourishing treatment for damaged hair",
    price: 27.99,
    category: "haircare",
    subcategory: "treatments",
    brand: "HairLux",
    sku: "HL-NHM-005",
    images: [
      {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
        alt: "Nourishing Hair Mask jar",
        isPrimary: true
      }
    ],
    inventory: {
      quantity: 20,
      lowStockThreshold: 6,
      trackInventory: true
    },
    specifications: {
      weight: { value: 200, unit: "ml" }
    },
    tags: ["hair-mask", "nourishing", "treatment"],
    isActive: true,
    rating: { average: 4.6, count: 27 }
  },
  {
    name: "Refreshing Body Mist",
    description: "Light and refreshing body mist with a delicate floral scent. Perfect for a quick refresh throughout the day.",
    shortDescription: "Light floral body mist for daily refresh",
    price: 15.99,
    category: "fragrance",
    subcategory: "body-mist",
    brand: "FloralEssence",
    sku: "FE-RBM-006",
    images: [
      {
        url: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop",
        alt: "Refreshing Body Mist spray bottle",
        isPrimary: true
      }
    ],
    inventory: {
      quantity: 35,
      lowStockThreshold: 10,
      trackInventory: true
    },
    specifications: {
      weight: { value: 150, unit: "ml" }
    },
    tags: ["body-mist", "floral", "refreshing"],
    isActive: true,
    rating: { average: 4.1, count: 19 }
  },
  {
    name: "Luxury Makeup Brush Set",
    description: "Professional makeup brush set with synthetic bristles. Includes brushes for foundation, powder, eyeshadow, and more. Perfect for creating flawless makeup looks.",
    shortDescription: "Professional makeup brush set with synthetic bristles",
    price: 45.99,
    originalPrice: 59.99,
    category: "tools",
    subcategory: "brushes",
    brand: "ProBeauty",
    sku: "PB-MBS-007",
    images: [], // No images - will show default
    inventory: {
      quantity: 15,
      lowStockThreshold: 5,
      trackInventory: true
    },
    tags: ["brushes", "makeup", "professional"],
    isActive: true,
    isOnSale: true,
    rating: { average: 4.8, count: 52 }
  },
  {
    name: "Organic Face Cleanser",
    description: "Gentle organic face cleanser made with natural ingredients. Suitable for all skin types, removes impurities while maintaining skin's natural moisture barrier.",
    shortDescription: "Gentle organic cleanser for all skin types",
    price: 22.99,
    category: "skincare",
    subcategory: "cleansers",
    brand: "NaturePure",
    sku: "NP-OFC-008",
    images: [], // No images - will show default
    inventory: {
      quantity: 28,
      lowStockThreshold: 8,
      trackInventory: true
    },
    specifications: {
      weight: { value: 150, unit: "ml" },
      skinType: ["all", "sensitive"],
      concerns: ["sensitivity"]
    },
    tags: ["organic", "gentle", "cleanser"],
    isActive: true,
    isFeatured: true,
    rating: { average: 4.4, count: 33 }
  }
];

async function seedDatabase() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('cosmetic-shop');
    
    // Create collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('products')) {
      await db.createCollection('products');
      console.log('Created products collection');
    }
    
    if (!collectionNames.includes('users')) {
      await db.createCollection('users');
      console.log('Created users collection');
    }
    
    // Create indexes
    await db.collection('products').createIndex({ name: 1 });
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('products').createIndex({ sku: 1 }, { unique: true });
    
    // Insert admin user
    await db.collection('users').updateOne(
      { email: "admin@cosmeticshop.com" },
      {
        $set: {
          name: "Admin User",
          email: "admin@cosmeticshop.com",
          password: "$2a$12$ESpoVw8ACguB/p8enp.VQ.U1Sru9B3ayGSULrYNS8vvuqLK.cpBF6", // password: admin123
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log('Admin user created/updated');
    
    // Insert sample products
    for (const product of sampleProducts) {
      await db.collection('products').updateOne(
        { sku: product.sku },
        {
          $set: {
            ...product,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log(`Product ${product.name} created/updated`);
    }
    
    console.log(`\nDatabase seeded successfully!`);
    console.log(`${sampleProducts.length} products added`);
    console.log(`1 admin user added`);
    console.log(`Products with default images: ${sampleProducts.filter(p => p.images.length === 0).length}`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedDatabase();
