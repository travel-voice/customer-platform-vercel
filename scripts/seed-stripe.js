const Stripe = require('stripe');
const readline = require('readline');

const plans = [
  {
    id: "lite",
    name: "Lite",
    description: "Basic AI voice features ideal for startup web and phone use",
    price: 5000, // in pence
    currency: "gbp",
    interval: "month",
    metadata: {
        minutes_included: "200"
    }
  },
  {
    id: "standard",
    name: "Standard",
    description: "Perfect for growing businesses with increased usage needs",
    price: 40000, // in pence
    currency: "gbp",
    interval: "month",
    metadata: {
        minutes_included: "1000"
    }
  },
  {
    id: "professional",
    name: "Professional",
    description: "For enterprises requiring high-volume usage and premium features",
    price: 165000, // in pence
    currency: "gbp",
    interval: "month",
    metadata: {
        minutes_included: "5000"
    }
  },
  {
    id: "phone_number",
    name: "Additional Phone Number",
    description: "Additional phone number for your plan",
    price: 1000, // in pence (£10/month - adjust as needed)
    currency: "gbp",
    interval: "month",
    metadata: {
        type: "phone_number_addon"
    }
  }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚀 Travel Voice Stripe Setup Script\n');

rl.question('Please enter your STRIPE_SECRET_KEY (starts with sk_...): ', async (secretKey) => {
  if (!secretKey.startsWith('sk_')) {
    console.error('❌ Invalid secret key. It should start with "sk_".');
    process.exit(1);
  }

  const stripe = new Stripe(secretKey.trim());

  console.log('\nCreating products and prices...\n');

  try {
    const priceIds = {};
    
    for (const plan of plans) {
      console.log(`Creating plan: ${plan.name}...`);
      
      // Create Product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: plan.metadata
      });

      // Create Price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: plan.currency,
        recurring: {
          interval: plan.interval,
        },
      });

      priceIds[plan.id] = price.id;

      console.log(`✅ Created ${plan.name}:`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Price ID:   ${price.id}\n`);
    }

    console.log('🎉 All plans created successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Copy these lines to your .env.local file:');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ID_LITE=${priceIds.lite}`);
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ID_STANDARD=${priceIds.standard}`);
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL=${priceIds.professional}`);
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ID_PHONE_NUMBER=${priceIds.phone_number}`);
    console.log('\n═══════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error creating plans:', error.message);
  } finally {
    rl.close();
  }
});

