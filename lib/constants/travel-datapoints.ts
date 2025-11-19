import { IDataPoint } from "@/lib/types/agents";

// Comprehensive travel-focused datapoints for Vapi structured data schema.
// IDs use dot-notation namespaces to avoid collisions.

export const TRAVEL_DATAPOINTS: IDataPoint[] = [
  // Customer Basics
  { id: "customer.first_name", label: "First Name", category: "Customer", description: "The customer's given name or first name", type: "string" },
  { id: "customer.last_name", label: "Last Name", category: "Customer", description: "The customer's family name or surname", type: "string" },
  { id: "customer.full_name", label: "Full Name", category: "Customer", description: "The customer's complete name (first and last name combined)", type: "string" },
  { id: "customer.email", label: "Email", category: "Customer", description: "The customer's email address for communication and booking confirmations", type: "string" },
  { id: "customer.phone", label: "Phone Number", category: "Customer", description: "The customer's primary contact phone number", type: "string" },
  { id: "customer.country", label: "Country", category: "Customer", description: "The customer's country of residence", type: "string" },
  { id: "customer.city", label: "City", category: "Customer", description: "The customer's city of residence", type: "string" },
  { id: "customer.postcode", label: "Postcode / ZIP", category: "Customer", description: "The customer's postal code or ZIP code", type: "string" },
  { id: "customer.address_line1", label: "Address Line 1", category: "Customer", description: "The first line of the customer's address", type: "string" },
  { id: "customer.address_line2", label: "Address Line 2", category: "Customer", description: "The second line of the customer's address (optional)", type: "string" },
  { id: "customer.date_of_birth", label: "Date of Birth", category: "Customer", description: "The customer's date of birth for age verification and passport requirements", type: "string" },
  { id: "customer.passport_number", label: "Passport Number", category: "Customer", description: "The customer's passport number for international travel", type: "string" },

  // Trip Basics
  { id: "trip.type", label: "Trip Type", category: "Trip", description: "The type or purpose of the trip (e.g., leisure, business, honeymoon, family holiday)", type: "string" },
  { id: "trip.budget", label: "Budget", category: "Trip", description: "The total budget available for the trip in the specified currency", type: "number" },
  { id: "trip.currency", label: "Currency", category: "Trip", description: "The preferred currency for pricing and payments", type: "string" },
  { id: "trip.passengers_adults", label: "Number of Adults", category: "Trip", description: "The number of adult passengers (18+ years) travelling", type: "integer" },
  { id: "trip.passengers_children", label: "Number of Children", category: "Trip", description: "The number of child passengers (2-17 years) travelling", type: "integer" },
  { id: "trip.passengers_infants", label: "Number of Infants", category: "Trip", description: "The number of infant passengers (under 2 years) travelling", type: "integer" },
  { id: "trip.flexible_dates", label: "Flexible Dates", category: "Trip", description: "Whether the customer has flexible travel dates", type: "boolean" },
  { id: "trip.special_occasion", label: "Special Occasion", category: "Trip", description: "Any special occasion being celebrated during the trip", type: "string" },

  // Flights
  { id: "flight.departure_airport", label: "Departure Airport", category: "Flights", description: "The airport code (IATA) for the departure location", type: "string" },
  { id: "flight.destination_airport", label: "Destination Airport", category: "Flights", description: "The airport code (IATA) for the destination", type: "string" },
  { id: "flight.departure_city", label: "Departure City", category: "Flights", description: "The city or region for departure", type: "string" },
  { id: "flight.destination_city", label: "Destination City", category: "Flights", description: "The destination city or region", type: "string" },
  { id: "flight.preferred_airline", label: "Preferred Airline", category: "Flights", description: "The customer's preferred airline or alliance", type: "string" },
  { id: "flight.class", label: "Cabin Class", category: "Flights", description: "The preferred cabin class (Economy, Premium Economy, Business, First)", type: "string" },
  { id: "flight.non_stop_only", label: "Non-stop Only", category: "Flights", description: "Whether the customer requires non-stop flights only", type: "boolean" },
  { id: "flight.max_connections", label: "Max Connections", category: "Flights", description: "The maximum number of flight connections acceptable", type: "integer" },
  { id: "flight.max_layover_hours", label: "Max Layover (hours)", category: "Flights", description: "The maximum layover time in hours", type: "number" },
  { id: "flight.outbound_date", label: "Outbound Date", category: "Flights", description: "The departure date for the outbound flight", type: "string" },
  { id: "flight.return_date", label: "Return Date", category: "Flights", description: "The departure date for the return flight", type: "string" },
  { id: "flight.one_way", label: "One-way", category: "Flights", description: "Whether this is a one-way trip (no return flight)", type: "boolean" },
  { id: "flight.baggage_requirements", label: "Baggage Requirements", category: "Flights", description: "Specific baggage requirements or allowances needed", type: "string" },
  { id: "flight.loyalty_program", label: "Loyalty Program", category: "Flights", description: "The airline loyalty program the customer is enrolled in", type: "string" },
  { id: "flight.loyalty_number", label: "Loyalty Number", category: "Flights", description: "The customer's frequent flyer or loyalty program membership number", type: "string" },

  // Accommodation
  { id: "hotel.destination", label: "Destination (Area/City)", category: "Accommodation", description: "The destination city or area where accommodation is needed", type: "string" },
  { id: "hotel.name", label: "Hotel Name", category: "Accommodation", description: "The specific hotel or property name if known", type: "string" },
  { id: "hotel.check_in", label: "Check-in Date", category: "Accommodation", description: "The date for checking into the accommodation", type: "string" },
  { id: "hotel.check_out", label: "Check-out Date", category: "Accommodation", description: "The date for checking out of the accommodation", type: "string" },
  { id: "hotel.rooms", label: "Number of Rooms", category: "Accommodation", description: "The number of rooms required", type: "integer" },
  { id: "hotel.guests_per_room", label: "Guests per Room", category: "Accommodation", description: "The number of guests per room", type: "integer" },
  { id: "hotel.star_rating", label: "Star Rating", category: "Accommodation", description: "The preferred minimum star rating for the hotel", type: "integer" },
  { id: "hotel.board", label: "Board Basis", category: "Accommodation", description: "The meal plan preference (BB, HB, FB, AI)", type: "string" },
  { id: "hotel.room_type", label: "Room Type", category: "Accommodation", description: "The preferred room type (single, double, twin, suite, family)", type: "string" },
  { id: "hotel.amenities", label: "Required Amenities", category: "Accommodation", description: "Essential amenities required at the accommodation (pool, WiFi, spa, parking, gym)", type: "string" },

  // Ground Transport
  { id: "ground.transport_type", label: "Transport Type", category: "Ground Transport", description: "The type of ground transport needed (car hire, transfer, taxi, public transport)", type: "string" },
  { id: "ground.pickup_location", label: "Pickup Location", category: "Ground Transport", description: "The location where transport will be collected or pickup will occur", type: "string" },
  { id: "ground.dropoff_location", label: "Drop-off Location", category: "Ground Transport", description: "The destination location for drop-off", type: "string" },
  { id: "ground.pickup_date", label: "Pickup Date", category: "Ground Transport", description: "The date for transport collection or pickup", type: "string" },
  { id: "ground.dropoff_date", label: "Drop-off Date", category: "Ground Transport", description: "The date for transport return or drop-off", type: "string" },
  { id: "ground.driver_age", label: "Driver Age", category: "Ground Transport", description: "The age of the primary driver (required for car hire)", type: "integer" },
  { id: "ground.vehicle_type", label: "Vehicle Type", category: "Ground Transport", description: "The preferred vehicle type (economy car, SUV, minivan, automatic/manual)", type: "string" },

  // Activities & Preferences
  { id: "preferences.activities", label: "Preferred Activities", category: "Preferences", description: "The customer's preferred activities or experiences (sightseeing, skiing, beach, adventure, theme parks, culture)", type: "string" },
  { id: "preferences.travel_pace", label: "Travel Pace", category: "Preferences", description: "The customer's preferred travel pace (relaxed, balanced, packed itinerary)", type: "string" },
  { id: "preferences.accessibility", label: "Accessibility Needs", category: "Preferences", description: "Any accessibility requirements (wheelchair access, mobility assistance)", type: "string" },
  { id: "preferences.dietary", label: "Dietary Requirements", category: "Preferences", description: "Dietary restrictions or requirements (vegan, vegetarian, halal, kosher, allergies)", type: "string" },
  { id: "preferences.pet_friendly", label: "Pet-friendly Required", category: "Preferences", description: "Whether pet-friendly accommodation or services are required", type: "boolean" },
  { id: "preferences.seat_preference", label: "Seat Preference", category: "Preferences", description: "Seating preference for flights or transport (aisle, window, front, back)", type: "string" },

  // Compliance & Docs
  { id: "compliance.visa_required", label: "Visa Required", category: "Compliance", description: "Whether a visa is required for the destination", type: "boolean" },
  { id: "compliance.travel_insurance", label: "Travel Insurance", category: "Compliance", description: "Whether travel insurance is required or preferred", type: "boolean" },
  { id: "compliance.medical_notes", label: "Medical Notes", category: "Compliance", description: "Any medical conditions or notes relevant to travel", type: "string" },

  // Payment & Booking
  { id: "booking.preferred_payment_method", label: "Preferred Payment Method", category: "Booking", description: "The customer's preferred method of payment (card, bank transfer, finance)", type: "string" },
  { id: "booking.deposit_ready", label: "Ready to Pay Deposit", category: "Booking", description: "Whether the customer is ready to pay a deposit to secure the booking", type: "boolean" },
  { id: "booking.time_to_book", label: "When to Book", category: "Booking", description: "The customer's timeline for making the booking (immediately, within days, weeks)", type: "string" },

  // Customer Extras
  { id: "customer.nationality", label: "Nationality", category: "Customer", description: "The customer's nationality or citizenship", type: "string" },
  { id: "customer.passport_expiry", label: "Passport Expiry", category: "Customer", description: "The expiry date of the customer's passport", type: "string" },
  { id: "customer.emergency_contact_name", label: "Emergency Contact Name", category: "Customer", description: "The name of the customer's emergency contact", type: "string" },
  { id: "customer.emergency_contact_phone", label: "Emergency Contact Phone", category: "Customer", description: "The phone number of the customer's emergency contact", type: "string" },
  { id: "customer.emergency_contact_email", label: "Emergency Contact Email", category: "Customer", description: "The email address of the customer's emergency contact", type: "string" },
  { id: "customer.known_traveler_number", label: "Known Traveler Number", category: "Customer", description: "The customer's TSA Known Traveler Number for expedited security", type: "string" },
  { id: "customer.redress_number", label: "Redress Number", category: "Customer", description: "The customer's TSA Redress Number for identity verification", type: "string" },

  // Trip Extras
  { id: "trip.window_start", label: "Earliest Start Date", category: "Trip", description: "The earliest possible departure date for flexible date searches", type: "string" },
  { id: "trip.window_end", label: "Latest Return Date", category: "Trip", description: "The latest acceptable return date for flexible date searches", type: "string" },
  { id: "trip.purpose", label: "Trip Purpose", category: "Trip", description: "The primary purpose of the trip (leisure, business, bleisure, event)", type: "string" },
  { id: "trip.region_preference", label: "Region Preference", category: "Trip", description: "The preferred geographical region or continent for travel", type: "string" },
  { id: "trip.climate_preference", label: "Climate Preference", category: "Trip", description: "The preferred climate conditions (hot, cold, mild, tropical)", type: "string" },
  { id: "trip.sustainability_priority", label: "Sustainability Priority", category: "Trip", description: "Whether eco-friendly and sustainable travel options are prioritised", type: "boolean" },
  { id: "trip.budget_strict", label: "Budget Strict", category: "Trip", description: "Whether the budget is fixed and cannot be exceeded", type: "boolean" },

  // Flights - Expanded
  { id: "flight.departure_time_window", label: "Preferred Outbound Time", category: "Flights", description: "The preferred time of day for departure flights (morning, afternoon, evening)", type: "string" },
  { id: "flight.return_time_window", label: "Preferred Return Time", category: "Flights", description: "The preferred time of day for return flights (morning, afternoon, evening)", type: "string" },
  { id: "flight.alt_origin_airports", label: "Alternative Origin Airports", category: "Flights", description: "Alternative departure airports that can be considered for the journey", type: "string" },
  { id: "flight.alt_destination_airports", label: "Alternative Destination Airports", category: "Flights", description: "Alternative arrival airports that can be considered for the destination", type: "string" },
  { id: "flight.airline_alliance", label: "Airline Alliance", category: "Flights", description: "The preferred airline alliance (Star Alliance, Oneworld, SkyTeam) for booking flights", type: "string" },
  { id: "flight.fare_type", label: "Fare Type", category: "Flights", description: "The type of fare required (basic economy, standard, flexible, fully refundable)", type: "string" },
  { id: "flight.seat_preference_detail", label: "Seat Preference Detail", category: "Flights", description: "Specific seating preferences (aisle, window, exit row, bulkhead, extra legroom)", type: "string" },
  { id: "flight.special_assistance", label: "Special Assistance", category: "Flights", description: "Any special assistance required (wheelchair, medical equipment, unaccompanied minor)", type: "string" },
  { id: "flight.meal_preference", label: "Meal Preference", category: "Flights", description: "Special meal requirements for the flight (vegetarian, vegan, kosher, halal, allergy-free)", type: "string" },
  { id: "flight.checked_bags", label: "Checked Bags", category: "Flights", description: "The number of checked bags required for the journey", type: "integer" },
  { id: "flight.carry_on_bags", label: "Carry-on Bags", category: "Flights", description: "The number of carry-on bags to be taken aboard the aircraft", type: "integer" },
  { id: "flight.sports_equipment", label: "Sports Equipment", category: "Flights", description: "Whether sports equipment (skis, golf clubs, surfboards, bikes) needs to be transported", type: "boolean" },
  { id: "flight.tsa_precheck", label: "TSA PreCheck", category: "Flights", description: "Whether the customer has TSA PreCheck for expedited security screening", type: "boolean" },
  { id: "flight.global_entry", label: "Global Entry", category: "Flights", description: "Whether the customer has Global Entry for expedited customs and immigration", type: "boolean" },
  { id: "flight.avoid_airports", label: "Airports to Avoid", category: "Flights", description: "Specific airports that should be avoided for connections or routing", type: "string" },

  // Accommodation - Expanded
  { id: "hotel.chain", label: "Hotel Chain", category: "Accommodation", description: "The preferred hotel chain or brand for accommodation", type: "string" },
  { id: "hotel.loyalty_program", label: "Hotel Loyalty Program", category: "Accommodation", description: "The hotel loyalty program the customer is enrolled in for points and benefits", type: "string" },
  { id: "hotel.loyalty_number", label: "Hotel Loyalty Number", category: "Accommodation", description: "The customer's hotel loyalty program membership number", type: "string" },
  { id: "hotel.bed_configuration", label: "Bed Configuration", category: "Accommodation", description: "The preferred bed arrangement (king, queen, twin beds, sofa bed)", type: "string" },
  { id: "hotel.connecting_rooms", label: "Connecting Rooms", category: "Accommodation", description: "Whether connecting or adjacent rooms are required for families or groups", type: "boolean" },
  { id: "hotel.smoking_preference", label: "Smoking Preference", category: "Accommodation", description: "Smoking room preference (smoking, non-smoking, no preference)", type: "string" },
  { id: "hotel.late_check_in", label: "Late Check-in", category: "Accommodation", description: "Expected late check-in time if arriving after standard hours", type: "string" },
  { id: "hotel.late_check_out", label: "Late Check-out", category: "Accommodation", description: "Required late check-out time if departing after standard hours", type: "string" },
  { id: "hotel.accessibility_features", label: "Accessibility Features", category: "Accommodation", description: "Specific accessibility features required (wheelchair access, roll-in shower, lift access)", type: "string" },
  { id: "hotel.view_preference", label: "View Preference", category: "Accommodation", description: "Preferred room view (sea view, city view, garden view, mountain view)", type: "string" },
  { id: "hotel.proximity_landmark", label: "Proximity to Landmark", category: "Accommodation", description: "Specific landmark or attraction the hotel should be near or within walking distance of", type: "string" },
  { id: "hotel.neighbourhood", label: "Preferred Neighbourhood", category: "Accommodation", description: "The preferred area or district within the destination city", type: "string" },
  { id: "hotel.parking_required", label: "Parking Required", category: "Accommodation", description: "Whether parking facilities are required at the accommodation", type: "boolean" },
  { id: "hotel.kitchenette", label: "Kitchen/Kitchenette", category: "Accommodation", description: "Whether kitchen or kitchenette facilities are required for self-catering", type: "boolean" },
  { id: "hotel.child_friendly", label: "Child-friendly Amenities", category: "Accommodation", description: "Specific child-friendly amenities required (kids club, crib, high chair, children's menu)", type: "string" },
  { id: "hotel.pet_friendly", label: "Pet-friendly Required", category: "Accommodation", description: "Whether pet-friendly accommodation is required for travelling with animals", type: "boolean" },
  { id: "hotel.refundable_only", label: "Refundable Only", category: "Accommodation", description: "Whether only refundable or flexible cancellation rates should be booked", type: "boolean" },

  // Ground Transport - Expanded
  { id: "ground.automatic_transmission", label: "Automatic Transmission", category: "Ground Transport", description: "Whether automatic transmission is required for car hire", type: "boolean" },
  { id: "ground.insurance_type", label: "Insurance Type", category: "Ground Transport", description: "The type of insurance coverage required for rental vehicles (CDW, SLI, excess reduction)", type: "string" },
  { id: "ground.fuel_policy", label: "Fuel Policy", category: "Ground Transport", description: "The preferred fuel policy for car hire (full-to-full, prepaid fuel, return empty)", type: "string" },
  { id: "ground.mileage_policy", label: "Mileage Policy", category: "Ground Transport", description: "The mileage allowance required (unlimited, limited daily allowance, per-kilometre rate)", type: "string" },
  { id: "ground.child_seats", label: "Child Seats", category: "Ground Transport", description: "The number of child safety seats required for the rental vehicle", type: "integer" },
  { id: "ground.pickup_time", label: "Pickup Time", category: "Ground Transport", description: "The specific time for vehicle collection or transfer pickup", type: "string" },
  { id: "ground.dropoff_time", label: "Drop-off Time", category: "Ground Transport", description: "The specific time for vehicle return or transfer drop-off", type: "string" },
  { id: "ground.pickup_flight_number", label: "Pickup Flight Number", category: "Ground Transport", description: "The flight number for airport pickup or meet and greet services", type: "string" },
  { id: "ground.meet_and_greet", label: "Meet & Greet", category: "Ground Transport", description: "Whether meet and greet service with name sign is required for transfers", type: "boolean" },

  // Activities & Experiences - Expanded
  { id: "activities.type", label: "Activity Type", category: "Activities", description: "The type of activity or experience required (tour, tickets, excursion, attraction entry)", type: "string" },
  { id: "activities.date", label: "Activity Date", category: "Activities", description: "The specific date when the activity or experience is required", type: "string" },
  { id: "activities.time_window", label: "Preferred Time of Day", category: "Activities", description: "The preferred time of day for activities (morning, afternoon, evening, full day)", type: "string" },
  { id: "activities.group_type", label: "Private or Group", category: "Activities", description: "Whether private tours or shared group experiences are preferred", type: "string" },
  { id: "activities.guide_language", label: "Guide Language", category: "Activities", description: "The preferred language for tour guides and activity instruction", type: "string" },
  { id: "activities.equipment_rental", label: "Equipment Rental", category: "Activities", description: "Whether equipment rental is required for activities (ski gear, snorkeling equipment, bikes)", type: "boolean" },
  { id: "activities.restaurant_reservation", label: "Restaurant Reservation", category: "Activities", description: "Specific restaurants or dining experiences that require advance booking", type: "string" },
  { id: "activities.spa_reservation", label: "Spa Reservation", category: "Activities", description: "Spa treatments or wellness experiences that require advance booking", type: "string" },
  
  // Compliance & Docs - Expanded
  { id: "compliance.esta_required", label: "ESTA Required", category: "Compliance", description: "Whether ESTA authorisation is required for travel to the USA under visa waiver program", type: "boolean" },
  { id: "compliance.eta_required", label: "eTA Required", category: "Compliance", description: "Whether Electronic Travel Authorisation (eTA) is required for travel to Canada", type: "boolean" },
  { id: "compliance.vaccination_status", label: "Vaccination Status", category: "Compliance", description: "Current vaccination status including COVID-19, yellow fever, and other required immunisations", type: "string" },
  { id: "compliance.visa_type", label: "Visa Type", category: "Compliance", description: "The type of visa required (tourist, business, student, transit, working holiday)", type: "string" },
  { id: "compliance.passport_country", label: "Passport Country", category: "Compliance", description: "The country of issue for the customer's passport", type: "string" },
  { id: "compliance.medical_clearance", label: "Medical Clearance Required", category: "Compliance", description: "Whether medical clearance or 'fit to fly' certification is required from a doctor", type: "boolean" },

  // Booking & Payment - Expanded
  { id: "booking.promo_code", label: "Promo Code", category: "Booking", description: "Any promotional codes or discount vouchers to be applied to the booking", type: "string" },
  { id: "booking.deposit_amount", label: "Deposit Amount", category: "Booking", description: "The specific deposit amount the customer is prepared to pay upfront", type: "number" },
  { id: "booking.installments", label: "Pay in Installments", category: "Booking", description: "Whether the customer prefers to pay for the booking in installments rather than full payment", type: "boolean" },
  { id: "booking.billing_company", label: "Billing Company Name", category: "Booking", description: "The company name to appear on invoices and billing documents", type: "string" },
  { id: "booking.billing_email", label: "Billing Email", category: "Booking", description: "The email address where invoices and billing information should be sent", type: "string" },
  { id: "booking.billing_address", label: "Billing Address", category: "Booking", description: "The complete billing address for invoices and payment processing", type: "string" },
  { id: "booking.hold_option", label: "Hold Option Preferred", category: "Booking", description: "Whether the customer prefers to hold bookings with a deadline rather than immediate confirmation", type: "boolean" },

  // Business Travel
  { id: "business.company_name", label: "Company Name", category: "Business Travel", description: "The name of the company or organisation the traveller works for", type: "string" },
  { id: "business.department", label: "Department", category: "Business Travel", description: "The specific department or division within the company", type: "string" },
  { id: "business.cost_center", label: "Cost Center", category: "Business Travel", description: "The cost centre code for charging travel expenses", type: "string" },
  { id: "business.project_code", label: "Project Code", category: "Business Travel", description: "The specific project code to which travel costs should be allocated", type: "string" },
  { id: "business.trip_purpose", label: "Business Trip Purpose", category: "Business Travel", description: "The specific business purpose of the trip (client meeting, conference, site visit, training)", type: "string" },
  { id: "business.approver_name", label: "Approver Name", category: "Business Travel", description: "The name of the person who approves business travel bookings", type: "string" },
  { id: "business.approval_status", label: "Approval Status", category: "Business Travel", description: "The current approval status of the business travel request", type: "string" },
  { id: "business.policy_exception_reason", label: "Policy Exception Reason", category: "Business Travel", description: "The reason for any exceptions to standard company travel policy", type: "string" },
  { id: "business.profile_id", label: "Traveler Profile ID", category: "Business Travel", description: "The unique identifier for the traveller's corporate profile in the booking system", type: "string" },

  // Cruise
  { id: "cruise.line", label: "Cruise Line", category: "Cruise", description: "The preferred cruise line or shipping company for the voyage", type: "string" },
  { id: "cruise.ship", label: "Ship", category: "Cruise", description: "The specific cruise ship or vessel name if known", type: "string" },
  { id: "cruise.sailing_date", label: "Sailing Date", category: "Cruise", description: "The departure date when the cruise begins", type: "string" },
  { id: "cruise.nights", label: "Nights", category: "Cruise", description: "The total number of nights for the cruise duration", type: "integer" },
  { id: "cruise.embarkation_port", label: "Embarkation Port", category: "Cruise", description: "The port where passengers board the cruise ship", type: "string" },
  { id: "cruise.disembarkation_port", label: "Disembarkation Port", category: "Cruise", description: "The final port where passengers disembark from the cruise ship", type: "string" },
  { id: "cruise.cabin_category", label: "Cabin Category", category: "Cruise", description: "The preferred cabin type (interior, oceanview, balcony, suite)", type: "string" },
  { id: "cruise.cabin_location", label: "Cabin Location Preference", category: "Cruise", description: "The preferred location of the cabin on the ship (midship, forward, aft, upper/lower deck)", type: "string" },
  { id: "cruise.dining_time", label: "Dining Seating Time", category: "Cruise", description: "The preferred dining time for main restaurant seating (early, late, anytime dining)", type: "string" },
  { id: "cruise.drinks_package", label: "Drinks Package", category: "Cruise", description: "Whether a beverage package or all-inclusive drinks upgrade is required", type: "boolean" },
  { id: "cruise.shore_excursions", label: "Shore Excursions Interests", category: "Cruise", description: "Types of shore excursions and activities of interest at ports of call", type: "string" },

  // Rail
  { id: "rail.origin_station", label: "Origin Station", category: "Rail", description: "The departure railway station for the journey", type: "string" },
  { id: "rail.destination_station", label: "Destination Station", category: "Rail", description: "The arrival railway station for the journey", type: "string" },
  { id: "rail.class", label: "Rail Class", category: "Rail", description: "The preferred class of rail travel (standard, first class, business class)", type: "string" },
  { id: "rail.seat_preference", label: "Rail Seat Preference", category: "Rail", description: "Specific seating preferences for rail travel (aisle, window, quiet coach, forward/backward facing)", type: "string" },
  { id: "rail.sleeper", label: "Sleeper Berth", category: "Rail", description: "Whether sleeping accommodation is required for overnight rail journeys", type: "boolean" },
  { id: "rail.pass_type", label: "Rail Pass Type", category: "Rail", description: "The type of rail pass required (Eurail, Interrail, monthly/season ticket)", type: "string" },
  { id: "rail.discount_card", label: "Rail Discount Card", category: "Rail", description: "Any rail discount cards that can be applied (youth railcard, senior railcard, family railcard)", type: "string" },
  { id: "rail.flexible", label: "Flexible Ticket", category: "Rail", description: "Whether flexible or open tickets are required that allow changes to travel times", type: "boolean" },

  // Kids & Pets
  { id: "family.children_ages", label: "Children Ages (youngest/oldest)", category: "Family", description: "The ages of all children travelling, typically specified as youngest to oldest", type: "string" },
  { id: "family.stroller_required", label: "Stroller Required", category: "Family", description: "Whether a stroller or pushchair is required for infant/toddler transport", type: "boolean" },
  { id: "family.car_seat_type", label: "Car Seat Type", category: "Family", description: "The specific type of car seat required (infant carrier, child seat, booster seat)", type: "string" },
  { id: "pets.species", label: "Pet Species", category: "Pets", description: "The type of pet travelling (dog, cat, bird, other animals)", type: "string" },
  { id: "pets.size", label: "Pet Size", category: "Pets", description: "The size category of the pet (small, medium, large) for transport regulations", type: "string" },
  { id: "pets.in_cabin", label: "Pet In Cabin", category: "Pets", description: "Whether the pet is small enough to travel in the passenger cabin rather than cargo hold", type: "boolean" },

  // Ski & Snow
  { id: "ski.resort", label: "Ski Resort", category: "Ski", description: "The specific ski resort or mountain area for the skiing holiday", type: "string" },
  { id: "ski.passes", label: "Lift Pass Type", category: "Ski", description: "The type and duration of ski lift passes required (daily, weekly, season pass)", type: "string" },
  { id: "ski.rental", label: "Ski Equipment Rental", category: "Ski", description: "Whether ski or snowboard equipment rental is required at the resort", type: "boolean" },
  { id: "ski.lessons", label: "Ski Lessons", category: "Ski", description: "Whether ski or snowboard lessons with an instructor are required", type: "boolean" },
  { id: "ski.skill_level", label: "Ski Skill Level", category: "Ski", description: "The skiing ability level (beginner, intermediate, advanced, expert)", type: "string" },

  // Theme Parks
  { id: "parks.park_name", label: "Park Name", category: "Theme Parks", description: "The specific theme park or attraction to visit (Disney World, Universal Studios, etc.)", type: "string" },
  { id: "parks.ticket_type", label: "Ticket Type", category: "Theme Parks", description: "The type of theme park tickets required (single day, multi-day, park hopper)", type: "string" },
  { id: "parks.days", label: "Number of Days", category: "Theme Parks", description: "The total number of days to visit theme parks", type: "integer" },
  { id: "parks.fast_pass", label: "Fast Pass/Express", category: "Theme Parks", description: "Whether fast pass or express lane access is required to skip queues", type: "boolean" },
  // Meta
  { id: "meta.referral_source", label: "Referral Source", category: "Meta", description: "How the customer found or was referred to the travel service", type: "string" },
  { id: "meta.notes", label: "Agent Notes", category: "Meta", description: "Free-form notes and additional context captured by the agent during the conversation", type: "string" },
];

// Categories list to aid UI grouping/filtering
export const TRAVEL_CATEGORIES = Array.from(new Set(TRAVEL_DATAPOINTS.map(d => d.category))).sort();


