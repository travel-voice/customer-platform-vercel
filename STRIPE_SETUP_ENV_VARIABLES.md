# Stripe Environment Variables Setup

Copy these variables to your `.env.local` file and fill in the actual values.

## How to Create .env.local

Run this command in your terminal:

```bash
touch .env.local
```

Then copy the content below into that file.

---

## Environment Variables Template

```bash
# ============================================
# STRIPE CONFIGURATION (LIVE MODE)
# ============================================

# Stripe Secret Key (Server-side only)
# Find at: https://dashboard.stripe.com/apikeys
# Starts with: sk_live_...
# ⚠️ KEEP THIS SECRET - Never expose in frontend code
STRIPE_SECRET_KEY=sk_live_your_secret_key_here

# Stripe Webhook Secret
# Find at: https://dashboard.stripe.com/webhooks
# 1. Create webhook endpoint: https://yourdomain.com/api/stripe/webhook
# 2. Select events: checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted
# 3. Copy the "Signing secret" - starts with: whsec_...
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# ============================================
# STRIPE PRICE IDs (Public - safe for frontend)
# ============================================

# Lite Plan Price ID (£50/month - 200 minutes, 1 phone number)
# Get this from running: node scripts/seed-stripe.js
# OR find at: https://dashboard.stripe.com/products
# Starts with: price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_LITE=price_lite_plan_id_here

# Standard Plan Price ID (£400/month - 1,000 minutes, 3 phone numbers)
# Get this from running: node scripts/seed-stripe.js
# OR find at: https://dashboard.stripe.com/products
# Starts with: price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_STANDARD=price_standard_plan_id_here

# Professional Plan Price ID (£1,650/month - 5,000 minutes, 10 phone numbers)
# Get this from running: node scripts/seed-stripe.js
# OR find at: https://dashboard.stripe.com/products
# Starts with: price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL=price_professional_plan_id_here

# Phone Number Add-on Price ID
# Create manually at: https://dashboard.stripe.com/products
# Click "+ Add product", set as recurring monthly in GBP
# Starts with: price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_PHONE_NUMBER=price_phone_number_id_here

# ============================================
# APPLICATION URL
# ============================================

# Your production application URL (used for Stripe redirects)
# Example: https://app.travelvoice.co.uk
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# ============================================
# OTHER REQUIRED ENVIRONMENT VARIABLES
# ============================================
# Note: You may have other env vars needed for:
# - Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.)
# - VAPI
# - Twilio
# - OpenAI
# - Resend (email)
# Make sure to add those as well!
```

---

## Quick Setup Steps

1. **Create the .env.local file**:
   ```bash
   touch .env.local
   ```

2. **Copy the template above** into `.env.local`

3. **Run the Stripe seed script** to create products and get Price IDs:
   ```bash
   node scripts/seed-stripe.js
   ```

4. **Get your Stripe API keys** from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

5. **Create webhook endpoint** at [Stripe Webhooks](https://dashboard.stripe.com/webhooks)

6. **Replace all placeholder values** in `.env.local` with your actual keys

7. **Restart your development server** to load the new environment variables

