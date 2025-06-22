import { executeQuery } from '../setup/setup';

// Dutch names and places for realistic test data
const DUTCH_FIRST_NAMES = {
  male: ['Jan', 'Piet', 'Kees', 'Henk', 'Willem', 'Johannes', 'Gerrit', 'Cornelis', 'Antonius', 'Franciscus'],
  female: ['Anna', 'Maria', 'Johanna', 'Catharina', 'Wilhelmina', 'Hendrika', 'Cornelia', 'Elisabeth', 'Petronella', 'Jacoba']
};

const DUTCH_LAST_NAMES = [
  'de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer',
  'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'Dekker', 'van Leeuwen', 'Brouwer'
];

const DUTCH_CITIES = [
  'Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen',
  'Enschede', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort', 'Apeldoorn', 'Roosendaal', 'Almelo', 'Maastricht', 'Dordrecht'
];

const DUTCH_PROVINCES = [
  'Noord-Holland', 'Zuid-Holland', 'Utrecht', 'Noord-Brabant', 'Gelderland', 'Overijssel', 
  'Groningen', 'Friesland', 'Drenthe', 'Flevoland', 'Zeeland', 'Limburg'
];

const FUNERAL_SERVICES = [
  'Traditionele uitvaart', 'Crematie ceremonie', 'Natuurbegraving', 'Directe crematie', 
  'Kerkelijke uitvaart', 'Herdenkingsdienst', 'Celebration of Life', 'Zee-uitvaart'
];

const CULTURAL_BACKGROUNDS = [
  'Nederlands', 'Marokkaans-Nederlands', 'Turks-Nederlands', 'Surinaams-Nederlands', 
  'Antilliaans-Nederlands', 'Indonesisch-Nederlands', 'Pools-Nederlands', 'Duits-Nederlands'
];

const RELIGIONS = [
  'Protestants', 'Rooms-Katholiek', 'Islam', 'Joods', 'Hindoe', 'Boeddhist', 'Humanistisch', 'Geen'
];

// Helper functions
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateBSN(): string {
  // Generate a realistic but fake BSN (Dutch social security number)
  const digits = [];
  for (let i = 0; i < 8; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  
  // Calculate check digit using BSN algorithm
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * (9 - i);
  }
  const checkDigit = sum % 11;
  
  if (checkDigit < 10) {
    digits.push(checkDigit);
  } else {
    digits[7] = Math.floor(Math.random() * 10);
    digits.push(Math.floor(Math.random() * 10));
  }
  
  return digits.join('');
}

function generateKVK(): string {
  // Generate realistic KvK (Chamber of Commerce) number
  return Math.floor(10000000 + Math.random() * 89999999).toString();
}

function generatePostalCode(): string {
  // Dutch postal code format: 1234 AB
  const numbers = Math.floor(1000 + Math.random() * 9000);
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                  String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${numbers} ${letters}`;
}

// Mock data generators
export interface MockUserProfile {
  id?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type: 'family' | 'director' | 'venue' | 'admin';
  company?: string;
  specializations?: string[];
  created_at?: Date;
}

export interface MockDeceasedPerson {
  id?: string;
  full_name: string;
  first_name: string;
  last_name: string;
  maiden_name?: string;
  birth_date: Date;
  death_date: Date;
  death_location?: string;
  bsn?: string;
  birth_place: string;
  nationality: string;
  religion?: string;
  cultural_background?: string;
  preferred_service_type: 'burial' | 'cremation' | 'mixed';
  preferred_ceremony_type: 'traditional' | 'celebration' | 'simple' | 'direct' | 'religious';
}

export interface MockFuneralRequest {
  id?: string;
  deceased_id: string;
  primary_contact_id: string;
  assigned_director_id?: string;
  urgency_level: 'urgent' | 'normal' | 'flexible';
  service_type: 'burial' | 'cremation' | 'mixed';
  ceremony_type?: 'traditional' | 'celebration' | 'simple' | 'direct' | 'religious';
  expected_attendance?: number;
  funeral_deadline: Date;
  preferred_funeral_date?: Date;
  status: 'initiated' | 'gathering_info' | 'planning' | 'coordinating' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  preferred_municipality?: string;
  cultural_requirements?: any;
  language_preferences?: string[];
  gdpr_consent_given: boolean;
  gdpr_consent_date?: Date;
}

export interface MockVenue {
  id?: string;
  owner_id: string;
  name: string;
  description: string;
  venue_type: 'funeral_home' | 'church' | 'crematorium' | 'cemetery' | 'community_center' | 'hotel' | 'restaurant' | 'outdoor' | 'cultural_center' | 'other';
  address: string;
  city: string;
  province: string;
  postal_code: string;
  max_capacity: number;
  wheelchair_accessible: boolean;
  base_price_per_hour: number;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
}

/**
 * Generate mock user profiles
 */
export function generateMockUserProfiles(count: number = 10): MockUserProfile[] {
  const profiles: MockUserProfile[] = [];
  const userTypes: MockUserProfile['user_type'][] = ['family', 'director', 'venue'];
  
  for (let i = 0; i < count; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const firstName = randomChoice(DUTCH_FIRST_NAMES[gender]);
    const lastName = randomChoice(DUTCH_LAST_NAMES);
    const userType = randomChoice(userTypes);
    
    profiles.push({
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}${i}@example.nl`,
      first_name: firstName,
      last_name: lastName,
      phone: `06${Math.floor(10000000 + Math.random() * 90000000)}`,
      user_type: userType,
      company: userType === 'director' ? `${lastName} Uitvaartbegeleiding` : 
               userType === 'venue' ? `${randomChoice(DUTCH_CITIES)} Ceremoniehuis` : undefined,
      specializations: userType === 'director' ? [randomChoice(FUNERAL_SERVICES)] : undefined,
      created_at: randomDate(new Date(2023, 0, 1), new Date()),
    });
  }
  
  return profiles;
}

/**
 * Generate mock deceased persons
 */
export function generateMockDeceasedPersons(count: number = 5): MockDeceasedPerson[] {
  const deceased: MockDeceasedPerson[] = [];
  
  for (let i = 0; i < count; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const firstName = randomChoice(DUTCH_FIRST_NAMES[gender]);
    const lastName = randomChoice(DUTCH_LAST_NAMES);
    const birthDate = randomDate(new Date(1930, 0, 1), new Date(1990, 11, 31));
    const deathDate = randomDate(new Date(2024, 0, 1), new Date());
    
    deceased.push({
      full_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      maiden_name: gender === 'female' && Math.random() > 0.5 ? randomChoice(DUTCH_LAST_NAMES) : undefined,
      birth_date: birthDate,
      death_date: deathDate,
      death_location: randomChoice(DUTCH_CITIES),
      bsn: generateBSN(),
      birth_place: randomChoice(DUTCH_CITIES),
      nationality: 'Dutch',
      religion: randomChoice(RELIGIONS),
      cultural_background: randomChoice(CULTURAL_BACKGROUNDS),
      preferred_service_type: randomChoice(['burial', 'cremation', 'mixed']),
      preferred_ceremony_type: randomChoice(['traditional', 'celebration', 'simple', 'direct', 'religious']),
    });
  }
  
  return deceased;
}

/**
 * Generate mock venues
 */
export function generateMockVenues(ownerIds: string[], count: number = 8): MockVenue[] {
  const venues: MockVenue[] = [];
  const venueTypes: MockVenue['venue_type'][] = ['funeral_home', 'church', 'crematorium', 'cemetery', 'community_center'];
  
  for (let i = 0; i < count; i++) {
    const city = randomChoice(DUTCH_CITIES);
    const province = randomChoice(DUTCH_PROVINCES);
    const venueType = randomChoice(venueTypes);
    
    venues.push({
      owner_id: randomChoice(ownerIds),
      name: `${city} ${venueType === 'funeral_home' ? 'Uitvaartcentrum' : 
                     venueType === 'church' ? 'Kerk' :
                     venueType === 'crematorium' ? 'Crematorium' :
                     venueType === 'cemetery' ? 'Begraafplaats' : 'Ceremoniehuis'}`,
      description: `Een respectvolle en serene locatie voor uitvaartdiensten in ${city}. Volledig ingericht met moderne faciliteiten.`,
      venue_type: venueType,
      address: `${randomChoice(['Hoofdstraat', 'Kerkstraat', 'Wilhelminastraat', 'Dorpsstraat'])} ${Math.floor(1 + Math.random() * 200)}`,
      city,
      province,
      postal_code: generatePostalCode(),
      max_capacity: Math.floor(50 + Math.random() * 200),
      wheelchair_accessible: Math.random() > 0.3,
      base_price_per_hour: Math.floor(100 + Math.random() * 400),
      status: Math.random() > 0.2 ? 'approved' : 'pending',
    });
  }
  
  return venues;
}

/**
 * Insert mock data into database
 */
export async function insertMockUserProfiles(profiles: MockUserProfile[]): Promise<string[]> {
  const ids: string[] = [];
  
  for (const profile of profiles) {
    const result = await executeQuery(`
      INSERT INTO user_profiles (email, first_name, last_name, phone, user_type, company, specializations)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      profile.email,
      profile.first_name,
      profile.last_name,
      profile.phone,
      profile.user_type,
      profile.company,
      profile.specializations
    ]);
    
    ids.push(result.rows[0].id);
  }
  
  return ids;
}

export async function insertMockDeceasedPersons(deceased: MockDeceasedPerson[]): Promise<string[]> {
  const ids: string[] = [];
  
  for (const person of deceased) {
    const result = await executeQuery(`
      INSERT INTO deceased_persons (
        full_name, first_name, last_name, maiden_name, birth_date, death_date,
        death_location, bsn, birth_place, nationality, religion, cultural_background,
        preferred_service_type, preferred_ceremony_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `, [
      person.full_name, person.first_name, person.last_name, person.maiden_name,
      person.birth_date, person.death_date, person.death_location, person.bsn,
      person.birth_place, person.nationality, person.religion, person.cultural_background,
      person.preferred_service_type, person.preferred_ceremony_type
    ]);
    
    ids.push(result.rows[0].id);
  }
  
  return ids;
}

export async function insertMockVenues(venues: MockVenue[]): Promise<string[]> {
  const ids: string[] = [];
  
  for (const venue of venues) {
    const result = await executeQuery(`
      INSERT INTO venues (
        owner_id, name, description, venue_type, address, city, province, postal_code,
        max_capacity, wheelchair_accessible, base_price_per_hour, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [
      venue.owner_id, venue.name, venue.description, venue.venue_type,
      venue.address, venue.city, venue.province, venue.postal_code,
      venue.max_capacity, venue.wheelchair_accessible, venue.base_price_per_hour, venue.status
    ]);
    
    ids.push(result.rows[0].id);
  }
  
  return ids;
}

/**
 * Create a complete test scenario with related data
 */
export async function createFullTestScenario() {
  // Generate and insert users
  const userProfiles = generateMockUserProfiles(15);
  const userIds = await insertMockUserProfiles(userProfiles);
  
  // Separate users by type
  const familyUserIds = userIds.slice(0, 5);
  const directorUserIds = userIds.slice(5, 10);
  const venueOwnerIds = userIds.slice(10, 15);
  
  // Generate and insert deceased persons
  const deceasedPersons = generateMockDeceasedPersons(5);
  const deceasedIds = await insertMockDeceasedPersons(deceasedPersons);
  
  // Generate and insert venues
  const venues = generateMockVenues(venueOwnerIds, 8);
  const venueIds = await insertMockVenues(venues);
  
  // Create funeral requests
  const funeralRequests: MockFuneralRequest[] = [];
  for (let i = 0; i < 5; i++) {
    const deathDate = deceasedPersons[i].death_date;
    const deadline = new Date(deathDate);
    deadline.setDate(deadline.getDate() + 6); // Dutch law: max 6 working days
    
    funeralRequests.push({
      deceased_id: deceasedIds[i],
      primary_contact_id: familyUserIds[i],
      assigned_director_id: Math.random() > 0.3 ? randomChoice(directorUserIds) : undefined,
      urgency_level: randomChoice(['urgent', 'normal', 'flexible']),
      service_type: deceasedPersons[i].preferred_service_type,
      ceremony_type: deceasedPersons[i].preferred_ceremony_type,
      expected_attendance: Math.floor(20 + Math.random() * 100),
      funeral_deadline: deadline,
      preferred_funeral_date: randomDate(new Date(), deadline),
      status: randomChoice(['initiated', 'gathering_info', 'planning', 'coordinating', 'confirmed']),
      preferred_municipality: randomChoice(DUTCH_CITIES),
      cultural_requirements: { dietary: ['halal', 'vegetarian'] },
      language_preferences: ['Dutch'],
      gdpr_consent_given: true,
      gdpr_consent_date: new Date(),
    });
  }
  
  // Insert funeral requests
  const funeralRequestIds: string[] = [];
  for (const request of funeralRequests) {
    const result = await executeQuery(`
      INSERT INTO funeral_requests (
        deceased_id, primary_contact_id, assigned_director_id, urgency_level,
        service_type, ceremony_type, expected_attendance, funeral_deadline,
        preferred_funeral_date, status, preferred_municipality, cultural_requirements,
        language_preferences, gdpr_consent_given, gdpr_consent_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
    `, [
      request.deceased_id, request.primary_contact_id, request.assigned_director_id,
      request.urgency_level, request.service_type, request.ceremony_type,
      request.expected_attendance, request.funeral_deadline, request.preferred_funeral_date,
      request.status, request.preferred_municipality, request.cultural_requirements,
      request.language_preferences, request.gdpr_consent_given, request.gdpr_consent_date
    ]);
    
    funeralRequestIds.push(result.rows[0].id);
  }
  
  return {
    userIds: {
      all: userIds,
      family: familyUserIds,
      directors: directorUserIds,
      venueOwners: venueOwnerIds,
    },
    deceasedIds,
    venueIds,
    funeralRequestIds,
  };
}