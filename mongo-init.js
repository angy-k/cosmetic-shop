// MongoDB initialization script
db = db.getSiblingDB('cosmetic-shop');

// Create collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.products.createIndex({ "name": 1 });
db.products.createIndex({ "category": 1 });
db.orders.createIndex({ "userId": 1 });
db.orders.createIndex({ "createdAt": 1 });

// Insert sample data
db.users.updateOne(
  { email: "admin@cosmeticshop.com" },
    {
    name: "Admin User",
    email: "admin@cosmeticshop.com",
    password: "$2a$12$ESpoVw8ACguB/p8enp.VQ.U1Sru9B3ayGSULrYNS8vvuqLK.cpBF6", // password: admin123
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { upsert: true }
);

console.log('Database initialized successfully');
