import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { createAuthClient } from "@neondatabase/auth";

config({ path: ".env.local" });
config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;
const authBaseUrl = process.env.NEON_AUTH_BASE_URL;
const seedPassword = process.env.DEMO_SEED_PASSWORD ?? "Password123!";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

if (!databaseUrl) throw new Error("DATABASE_URL is required.");
if (!authBaseUrl) throw new Error("NEON_AUTH_BASE_URL is required.");

const sql = neon(databaseUrl);
const auth = createAuthClient(authBaseUrl);

const seedUsers = [
  {
    name: "LocalLink Admin",
    email: "admin@locallink.test",
    role: "admin",
  },
  {
    name: "Maya Customer",
    email: "customer@locallink.test",
    role: "customer",
  },
  {
    name: "Ama Green",
    email: "vendor@locallink.test",
    role: "vendor",
    businessName: "Green Acres Produce",
    bio: "Fresh vegetables and herbs harvested for city customers.",
    city: "Provo",
    state: "UT",
    products: [
      {
        name: "Organic Tomatoes",
        description: "Vine-ripened tomatoes packed for same-day local pickup.",
        price: "4.50",
        category: "Fresh produce",
        city: "Provo",
        stockQuantity: 42,
        imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea",
      },
      {
        name: "Sweet Corn Bundle",
        description: "A dozen ears of sweet corn from the weekly harvest.",
        price: "8.00",
        category: "Fresh produce",
        city: "Provo",
        stockQuantity: 28,
        imageUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076",
      },
    ],
  },
  {
    name: "Noah Fields",
    email: "vendor2@locallink.test",
    role: "vendor",
    businessName: "Wasatch Valley Farm",
    bio: "Seasonal fruit, eggs, and pantry staples from local growers.",
    city: "Orem",
    state: "UT",
    products: [
      {
        name: "Free-Range Eggs",
        description: "One dozen eggs from pasture-raised hens.",
        price: "6.25",
        category: "Dairy and eggs",
        city: "Orem",
        stockQuantity: 35,
        imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f",
      },
      {
        name: "Honeycrisp Apples",
        description: "Crisp local apples sold in a five-pound bag.",
        price: "9.75",
        category: "Fruit",
        city: "Orem",
        stockQuantity: 20,
        imageUrl: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce",
      },
    ],
  },
];

async function findAuthUser(email) {
  const rows = await sql`
    select id, email, name
    from neon_auth.user
    where email = ${email}
    limit 1
  `;

  return rows[0] ?? null;
}

async function ensureAuthUser(user) {
  let authUser = await findAuthUser(user.email);

  if (!authUser) {
    const result = await auth.signUp.email({
      name: user.name,
      email: user.email,
      password: seedPassword,
      fetchOptions: {
        headers: {
          Origin: appUrl,
        },
      },
    });

    if (result.error) {
      throw new Error(`Could not create ${user.email}: ${result.error.message}`);
    }

    authUser = await findAuthUser(user.email);
  }

  if (!authUser) {
    throw new Error(`Neon Auth user was not found after signup: ${user.email}`);
  }

  await sql`
    update neon_auth.user
    set "emailVerified" = true, "updatedAt" = now()
    where id = ${authUser.id}
  `;

  return authUser;
}

async function ensureUserProfile(authUser, user) {
  const rows = await sql`
    insert into user_profiles (auth_user_id, name, email, role)
    values (${authUser.id}, ${user.name}, ${user.email}, ${user.role})
    on conflict (auth_user_id)
    do update set
      name = excluded.name,
      email = excluded.email,
      role = excluded.role,
      updated_at = now()
    returning id, role
  `;

  return rows[0];
}

async function ensureVendorProfile(profileId, user) {
  if (!user.businessName) return null;

  const existing = await sql`
    select id
    from vendor_profiles
    where user_profile_id = ${profileId}
    limit 1
  `;

  if (existing[0]) return existing[0];

  const rows = await sql`
    insert into vendor_profiles (user_profile_id, business_name, bio, city, state)
    values (${profileId}, ${user.businessName}, ${user.bio}, ${user.city}, ${user.state})
    returning id
  `;

  return rows[0];
}

async function ensureProduct(vendorId, product) {
  const existing = await sql`
    select id
    from products
    where vendor_id = ${vendorId} and name = ${product.name}
    limit 1
  `;

  if (existing[0]) return existing[0];

  const rows = await sql`
    insert into products (
      vendor_id,
      name,
      description,
      price,
      category,
      city,
      image_url,
      stock_quantity,
      is_available
    )
    values (
      ${vendorId},
      ${product.name},
      ${product.description},
      ${product.price},
      ${product.category},
      ${product.city},
      ${product.imageUrl},
      ${product.stockQuantity},
      true
    )
    returning id
  `;

  return rows[0];
}

for (const user of seedUsers) {
  const authUser = await ensureAuthUser(user);
  const profile = await ensureUserProfile(authUser, user);
  const vendor = await ensureVendorProfile(profile.id, user);

  if (vendor && user.products) {
    for (const product of user.products) {
      await ensureProduct(vendor.id, product);
    }
  }
}

console.log("Seed complete.");
console.table(
  seedUsers.map((user) => ({
    email: user.email,
    password: seedPassword,
    role: user.role,
  }))
);
