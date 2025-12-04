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

      console.log(`✅ Created ${plan.name}:`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Price ID:   ${price.id}`);
      console.log(`   (Add this Price ID to your .env as NEXT_PUBLIC_STRIPE_PRICE_ID_${plan.id.toUpperCase()})\n`);
    }

    console.log('🎉 All plans created successfully!');
    console.log('\nCopy these Price IDs into your .env.local file:');
    
  } catch (error) {
    console.error('❌ Error creating plans:', error.message);
  } finally {
    rl.close();
  }
});

