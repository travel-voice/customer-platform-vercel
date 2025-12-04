import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const countryCode = searchParams.get('countryCode') || 'US';
    const areaCode = searchParams.get('areaCode');
    const limit = parseInt(searchParams.get('limit') || '10');

    const options: any = {
      limit: limit,
    };

    if (areaCode) {
      options.areaCode = parseInt(areaCode);
    }

    const availableNumbers = await client.availablePhoneNumbers(countryCode)
      .local.list(options);

    const formattedNumbers = availableNumbers.map((number) => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      lata: number.lata,
      locality: number.locality,
      rateCenter: number.rateCenter,
      latitude: number.latitude,
      longitude: number.longitude,
      region: number.region,
      postalCode: number.postalCode,
      isoCountry: number.isoCountry,
      capabilities: number.capabilities,
    }));

    return NextResponse.json({ phoneNumbers: formattedNumbers });
  } catch (error: any) {
    console.error('Error searching phone numbers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search phone numbers' },
      { status: 500 }
    );
  }
}

