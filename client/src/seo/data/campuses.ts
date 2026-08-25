export interface CampusData {
  slug: string;
  name: string;
  shortName: string;
  location: string;
  country: 'India' | 'United States' | 'United Kingdom' | 'Canada' | 'Australia';
  type: 'Private' | 'Government' | 'Deemed' | 'Public' | 'Ivy League' | 'Collegiate' | 'Russell Group';
  studentsCount: string;
  popularTopics: string[];
}

export const campusList: CampusData[] = [
  // ==============================================================================
  // 🇺🇸 UNITED STATES (USA) — TOP CAMPUSES
  // ==============================================================================
  {
    slug: 'nyu',
    name: 'New York University (NYU)',
    shortName: 'NYU',
    location: 'New York City, New York',
    country: 'United States',
    type: 'Private',
    studentsCount: '58,000+',
    popularTopics: ['Washington Square Park', 'Bobst Library', 'Stern School', 'Greenwich Village', 'Kimmel Center']
  },
  {
    slug: 'ucla',
    name: 'University of California, Los Angeles (UCLA)',
    shortName: 'UCLA',
    location: 'Los Angeles, California',
    country: 'United States',
    type: 'Public',
    studentsCount: '46,000+',
    popularTopics: ['Royce Hall', 'Westwood Village', 'Bruin Walk', 'Diddy Riese', 'Powell Library']
  },
  {
    slug: 'usc',
    name: 'University of Southern California (USC)',
    shortName: 'USC',
    location: 'Los Angeles, California',
    country: 'United States',
    type: 'Private',
    studentsCount: '49,000+',
    popularTopics: ['The Row (Frat Row)', 'Trojan Shrine', 'USC Village', 'Leavey Library', 'McCarthy Quad']
  },
  {
    slug: 'ut-austin',
    name: 'University of Texas at Austin (UT Austin)',
    shortName: 'UT Austin',
    location: 'Austin, Texas',
    country: 'United States',
    type: 'Public',
    studentsCount: '52,000+',
    popularTopics: ['The Drag', 'West Campus', 'Speedway Mall', 'Darrell K Royal', 'PCL Library']
  },
  {
    slug: 'harvard',
    name: 'Harvard University',
    shortName: 'Harvard',
    location: 'Cambridge, Massachusetts',
    country: 'United States',
    type: 'Ivy League',
    studentsCount: '25,000+',
    popularTopics: ['Harvard Yard', 'Annenberg Hall', 'Widener Library', 'Harvard Square', 'River Houses']
  },
  {
    slug: 'stanford',
    name: 'Stanford University',
    shortName: 'Stanford',
    location: 'Stanford, California',
    country: 'United States',
    type: 'Private',
    studentsCount: '17,000+',
    popularTopics: ['The Oval', 'Main Quad', 'White Plaza', 'Green Library', 'CoHo Café']
  },
  {
    slug: 'uc-berkeley',
    name: 'University of California, Berkeley (UC Berkeley)',
    shortName: 'UC Berkeley',
    location: 'Berkeley, California',
    country: 'United States',
    type: 'Public',
    studentsCount: '45,000+',
    popularTopics: ['Telegraph Ave', 'Sather Gate', 'Memorial Glade', 'Moffitt Library', 'Sproul Plaza']
  },
  {
    slug: 'columbia',
    name: 'Columbia University',
    shortName: 'Columbia',
    location: 'New York City, New York',
    country: 'United States',
    type: 'Ivy League',
    studentsCount: '33,000+',
    popularTopics: ['Morningside Heights', 'Butler Library', 'Low Steps', 'College Walk', 'Broadway Diners']
  },
  {
    slug: 'umich',
    name: 'University of Michigan (UMich)',
    shortName: 'UMich',
    location: 'Ann Arbor, Michigan',
    country: 'United States',
    type: 'Public',
    studentsCount: '51,000+',
    popularTopics: ['The Diag', 'South University Ave', 'The Big House', 'Shapiro Library', 'State Street']
  },
  {
    slug: 'uiuc',
    name: 'University of Illinois Urbana-Champaign (UIUC)',
    shortName: 'UIUC',
    location: 'Urbana-Champaign, Illinois',
    country: 'United States',
    type: 'Public',
    studentsCount: '56,000+',
    popularTopics: ['Green Street', 'The Main Quad', 'Grainger Engineering Library', 'KAMS', 'Alma Mater']
  },
  {
    slug: 'uf',
    name: 'University of Florida (UF)',
    shortName: 'UF',
    location: 'Gainesville, Florida',
    country: 'United States',
    type: 'Public',
    studentsCount: '55,000+',
    popularTopics: ['Midtown', 'Plaza of the Americas', 'Ben Hill Griffin Stadium', 'Turlington Plaza', 'Library West']
  },
  {
    slug: 'gatech',
    name: 'Georgia Institute of Technology (Georgia Tech)',
    shortName: 'Georgia Tech',
    location: 'Atlanta, Georgia',
    country: 'United States',
    type: 'Public',
    studentsCount: '45,000+',
    popularTopics: ['Tech Square', 'Tech Green', 'CULC', 'Bobby Dodd Stadium', 'Midnight Breakfast']
  },

  // ==============================================================================
  // 🇬🇧 UNITED KINGDOM (UK) — TOP CAMPUSES
  // ==============================================================================
  {
    slug: 'oxford',
    name: 'University of Oxford',
    shortName: 'Oxford',
    location: 'Oxford, United Kingdom',
    country: 'United Kingdom',
    type: 'Collegiate',
    studentsCount: '26,000+',
    popularTopics: ['Radcliffe Camera', 'Bodleian Library', 'Park End', 'Cowley Road', 'High Street']
  },
  {
    slug: 'cambridge',
    name: 'University of Cambridge',
    shortName: 'Cambridge',
    location: 'Cambridge, United Kingdom',
    country: 'United Kingdom',
    type: 'Collegiate',
    studentsCount: '24,000+',
    popularTopics: ['King’s Parade', 'The Backs', 'Market Square', 'Punting on the Cam', 'Mash / Cindies']
  },
  {
    slug: 'imperial',
    name: 'Imperial College London',
    shortName: 'Imperial',
    location: 'London, United Kingdom',
    country: 'United Kingdom',
    type: 'Russell Group',
    studentsCount: '22,000+',
    popularTopics: ['South Kensington', 'Queen’s Tower', 'Imperial Union Bar', 'Exhibition Road', 'Central Library']
  },
  {
    slug: 'ucl',
    name: 'University College London (UCL)',
    shortName: 'UCL',
    location: 'London, United Kingdom',
    country: 'United Kingdom',
    type: 'Russell Group',
    studentsCount: '51,000+',
    popularTopics: ['Bloomsbury', 'UCL Main Quad', 'Gower Street', 'Phineas Bar', 'Student Centre']
  },
  {
    slug: 'lse',
    name: 'London School of Economics (LSE)',
    shortName: 'LSE',
    location: 'London, United Kingdom',
    country: 'United Kingdom',
    type: 'Russell Group',
    studentsCount: '13,000+',
    popularTopics: ['Houghton Street', 'Saw Swee Hock', 'The George IV', 'Holborn', 'Lincoln’s Inn Fields']
  },
  {
    slug: 'kcl',
    name: 'King’s College London (KCL)',
    shortName: 'KCL',
    location: 'London, United Kingdom',
    country: 'United Kingdom',
    type: 'Russell Group',
    studentsCount: '33,000+',
    popularTopics: ['Strand Campus', 'Guy’s Campus', 'The Vault Bar', 'Waterloo Bridge', 'Bush House']
  },
  {
    slug: 'edinburgh',
    name: 'University of Edinburgh',
    shortName: 'Edinburgh',
    location: 'Edinburgh, Scotland',
    country: 'United Kingdom',
    type: 'Russell Group',
    studentsCount: '49,000+',
    popularTopics: ['George Square', 'The Meadows', 'Teviot Row House', 'Cowgate', 'Old College']
  },
  {
    slug: 'manchester',
    name: 'University of Manchester',
    shortName: 'Manchester',
    location: 'Manchester, United Kingdom',
    country: 'United Kingdom',
    type: 'Russell Group',
    studentsCount: '46,000+',
    popularTopics: ['Fallowfield', 'Oxford Road Corridor', 'Northern Quarter', 'Ali G Library', 'Whitworth Hall']
  },
  {
    slug: 'warwick',
    name: 'University of Warwick',
    shortName: 'Warwick',
    location: 'Coventry, United Kingdom',
    country: 'United Kingdom',
    type: 'Russell Group',
    studentsCount: '29,000+',
    popularTopics: ['The Piazza', 'Copper Rooms', 'Leamington Spa Hangouts', 'Rootes Grocery', 'Oculus']
  },
  {
    slug: 'bristol',
    name: 'University of Bristol',
    shortName: 'Bristol',
    location: 'Bristol, United Kingdom',
    country: 'United Kingdom',
    type: 'Russell Group',
    studentsCount: '30,000+',
    popularTopics: ['Clifton Village', 'Park Street', 'The Triangle', 'Harbourside', 'Wills Memorial Building']
  },
  {
    slug: 'leeds',
    name: 'University of Leeds',
    shortName: 'Leeds',
    location: 'Leeds, United Kingdom',
    country: 'United Kingdom',
    type: 'Russell Group',
    studentsCount: '39,000+',
    popularTopics: ['Hyde Park', 'The Otley Run', 'Leeds University Union (LUU)', 'Headingley', 'Brotherton Library']
  },

  // ==============================================================================
  // 🇨🇦 CANADA — TOP CAMPUSES
  // ==============================================================================
  {
    slug: 'uoft',
    name: 'University of Toronto (U of T)',
    shortName: 'U of T',
    location: 'Toronto, Ontario',
    country: 'Canada',
    type: 'Public',
    studentsCount: '97,000+',
    popularTopics: ['St. George Campus', 'Robarts Library (Fort Book)', 'King’s College Circle', 'Queen’s Park', 'Kensington Market']
  },
  {
    slug: 'mcgill',
    name: 'McGill University',
    shortName: 'McGill',
    location: 'Montreal, Quebec',
    country: 'Canada',
    type: 'Public',
    studentsCount: '39,000+',
    popularTopics: ['The McGill Ghetto (Milton Parc)', 'Lower Field', 'Boulevard Saint-Laurent', 'Redpath Library', 'OAP']
  },
  {
    slug: 'ubc',
    name: 'University of British Columbia (UBC)',
    shortName: 'UBC',
    location: 'Vancouver, British Columbia',
    country: 'Canada',
    type: 'Public',
    studentsCount: '70,000+',
    popularTopics: ['Wreck Beach', 'The Nest', 'Main Mall', 'Kitsilano', 'IKB Library']
  },
  {
    slug: 'waterloo',
    name: 'University of Waterloo',
    shortName: 'Waterloo',
    location: 'Waterloo, Ontario',
    country: 'Canada',
    type: 'Public',
    studentsCount: '42,000+',
    popularTopics: ['DC Library', 'Student Life Centre (SLC)', 'University Ave', 'Phil’s Grandson’s Place', 'Co-op Grind']
  },
  {
    slug: 'mcmaster',
    name: 'McMaster University',
    shortName: 'McMaster',
    location: 'Hamilton, Ontario',
    country: 'Canada',
    type: 'Public',
    studentsCount: '37,000+',
    popularTopics: ['Westdale', 'MUSC Student Centre', 'Cootes Paradise', 'Thode Library', 'The Phoenix Pub']
  },
  {
    slug: 'western',
    name: 'Western University',
    shortName: 'Western',
    location: 'London, Ontario',
    country: 'Canada',
    type: 'Public',
    studentsCount: '40,000+',
    popularTopics: ['Richmond Row', 'UC Hill', 'The Spoke Bar', 'The Ceeps', 'Weldon Library']
  },
  {
    slug: 'queens',
    name: 'Queen’s University',
    shortName: 'Queen’s',
    location: 'Kingston, Ontario',
    country: 'Canada',
    type: 'Public',
    studentsCount: '31,000+',
    popularTopics: ['University District', 'The Hub', 'Stauffer Library', 'The Ale House', 'Homecoming Lore']
  },
  {
    slug: 'ualberta',
    name: 'University of Alberta (UAlberta)',
    shortName: 'UAlberta',
    location: 'Edmonton, Alberta',
    country: 'Canada',
    type: 'Public',
    studentsCount: '40,000+',
    popularTopics: ['Whyte Avenue', 'Main Quad', 'HUB Mall', 'Rutherford Library', 'SUB Food Court']
  },
  {
    slug: 'sfu',
    name: 'Simon Fraser University (SFU)',
    shortName: 'SFU',
    location: 'Burnaby, British Columbia',
    country: 'Canada',
    type: 'Public',
    studentsCount: '35,000+',
    popularTopics: ['Burnaby Mountain', 'Academic Quadrangle (AQ)', 'SFU SUB', 'Cornerstone Plaza', 'Convocation Mall']
  },
  {
    slug: 'ucalgary',
    name: 'University of Calgary (UCalgary)',
    shortName: 'UCalgary',
    location: 'Calgary, Alberta',
    country: 'Canada',
    type: 'Public',
    studentsCount: '36,000+',
    popularTopics: ['MacEwan Student Centre (MacHall)', 'TFDL Library', 'University District', 'Bermuda Shorts Day (BSD)', 'Prairie Lounge']
  },

  // ==============================================================================
  // 🇦🇺 AUSTRALIA — TOP CAMPUSES
  // ==============================================================================
  {
    slug: 'usyd',
    name: 'University of Sydney (USYD)',
    shortName: 'USYD',
    location: 'Sydney, New South Wales',
    country: 'Australia',
    type: 'Public',
    studentsCount: '74,000+',
    popularTopics: ['The Quadrangle', 'Newtown King Street', 'Manning Bar', 'Fisher Library', 'Eastern Avenue']
  },
  {
    slug: 'unimelb',
    name: 'University of Melbourne (UniMelb)',
    shortName: 'UniMelb',
    location: 'Melbourne, Victoria',
    country: 'Australia',
    type: 'Public',
    studentsCount: '54,000+',
    popularTopics: ['Parkville Campus', 'Lygon Street Cafés', 'South Lawn', 'Rowden White Library', 'Union House']
  },
  {
    slug: 'unsw',
    name: 'UNSW Sydney (University of New South Wales)',
    shortName: 'UNSW',
    location: 'Sydney, New South Wales',
    country: 'Australia',
    type: 'Public',
    studentsCount: '65,000+',
    popularTopics: ['Kensington Campus', 'The UNSW Walkway (Basser Steps)', 'Roundhouse Bar', 'Coogee Beach', 'Anzac Parade']
  },
  {
    slug: 'monash',
    name: 'Monash University',
    shortName: 'Monash',
    location: 'Melbourne, Victoria',
    country: 'Australia',
    type: 'Public',
    studentsCount: '86,000+',
    popularTopics: ['Clayton Campus', 'Campus Centre', 'Sir John’s Bar', 'Caulfield Plaza', 'Matheson Library']
  },
  {
    slug: 'uq',
    name: 'University of Queensland (UQ)',
    shortName: 'UQ',
    location: 'Brisbane, Queensland',
    country: 'Australia',
    type: 'Public',
    studentsCount: '55,000+',
    popularTopics: ['St Lucia Campus', 'The Great Court', 'UQ Lakes & Ferry', 'The Red Room Bar', 'Duhig Library']
  },
  {
    slug: 'anu',
    name: 'Australian National University (ANU)',
    shortName: 'ANU',
    location: 'Canberra, ACT',
    country: 'Australia',
    type: 'Public',
    studentsCount: '26,000+',
    popularTopics: ['Acton Campus', 'Kambri Precinct', 'Badger & Co Pub', 'Sullivan’s Creek', 'Chifley Library']
  },
  {
    slug: 'uwa',
    name: 'University of Western Australia (UWA)',
    shortName: 'UWA',
    location: 'Perth, Western Australia',
    country: 'Australia',
    type: 'Public',
    studentsCount: '25,000+',
    popularTopics: ['Crawley Campus', 'Winthrop Hall', 'Sunken Garden', 'Matilda Bay', 'UWA Tavern']
  },
  {
    slug: 'adelaide',
    name: 'University of Adelaide',
    shortName: 'Adelaide',
    location: 'Adelaide, South Australia',
    country: 'Australia',
    type: 'Public',
    studentsCount: '28,000+',
    popularTopics: ['North Terrace', 'The UniBar', 'Barr Smith Library', 'River Torrens', 'Rundle Mall']
  },
  {
    slug: 'uts',
    name: 'University of Technology Sydney (UTS)',
    shortName: 'UTS',
    location: 'Sydney, New South Wales',
    country: 'Australia',
    type: 'Public',
    studentsCount: '45,000+',
    popularTopics: ['Broadway Tower', 'Central Park Mall', 'UTS Underground Bar', 'Frank Gehry Building', 'Chippendale']
  },
  {
    slug: 'rmit',
    name: 'RMIT University',
    shortName: 'RMIT',
    location: 'Melbourne, Victoria',
    country: 'Australia',
    type: 'Public',
    studentsCount: '97,000+',
    popularTopics: ['Swanston Street', 'Building 80', 'Melbourne CBD Cafés', 'A’Beckett Urban Square', 'State Library Lawn']
  },

  // ==============================================================================
  // 🇮🇳 INDIA — AMITY & NATIONAL CAMPUSES
  // ==============================================================================
  {
    slug: 'amity-noida',
    name: 'Amity University Noida',
    shortName: 'Amity Noida',
    location: 'Noida, Uttar Pradesh',
    country: 'India',
    type: 'Private',
    studentsCount: '35,000+',
    popularTopics: ['H-Block', 'Amity Street', 'Sangathan Fest', 'Food Plaza']
  },
  {
    slug: 'amity-raipur',
    name: 'Amity University Raipur',
    shortName: 'Amity Raipur',
    location: 'Raipur, Chhattisgarh',
    country: 'India',
    type: 'Private',
    studentsCount: '6,000+',
    popularTopics: ['Manthan Fest', 'Math Kharora Campus', 'Student Lounge', 'Canteen Chai']
  },
  {
    slug: 'amity-gurgaon',
    name: 'Amity University Gurgaon',
    shortName: 'Amity Gurgaon',
    location: 'Gurgaon, Haryana',
    country: 'India',
    type: 'Private',
    studentsCount: '10,000+',
    popularTopics: ['Manesar', 'Hostel Circle', 'Amiphoria Fest', 'Sports Complex']
  },
  {
    slug: 'amity-jaipur',
    name: 'Amity University Jaipur',
    shortName: 'Amity Jaipur',
    location: 'Jaipur, Rajasthan',
    country: 'India',
    type: 'Private',
    studentsCount: '8,000+',
    popularTopics: ['Kant Kalwar', 'Lake View', 'Odyssey Fest', 'Amity Amphitheatre']
  },
  {
    slug: 'amity-lucknow',
    name: 'Amity University Lucknow',
    shortName: 'Amity Lucknow',
    location: 'Lucknow, Uttar Pradesh',
    country: 'India',
    type: 'Private',
    studentsCount: '12,000+',
    popularTopics: ['Gomti Nagar Extension', 'Auditorium Lawn', 'Amiphoria', 'Nawab Canteen']
  },
  {
    slug: 'amity-mumbai',
    name: 'Amity University Mumbai',
    shortName: 'Amity Mumbai',
    location: 'Panvel, Mumbai',
    country: 'India',
    type: 'Private',
    studentsCount: '9,000+',
    popularTopics: ['Panvel Campus', 'Aminova Fest', 'Western Express', 'Central Plaza']
  },
  {
    slug: 'amity-kolkata',
    name: 'Amity University Kolkata',
    shortName: 'Amity Kolkata',
    location: 'New Town, Kolkata',
    country: 'India',
    type: 'Private',
    studentsCount: '7,000+',
    popularTopics: ['Action Area II', 'Eco Park Hangouts', 'Amiphoria East', 'Rooftop Lawn']
  },
  {
    slug: 'sharda-university',
    name: 'Sharda University',
    shortName: 'Sharda',
    location: 'Greater Noida, Uttar Pradesh',
    country: 'India',
    type: 'Private',
    studentsCount: '20,000+',
    popularTopics: ['The World is Here', 'Chorus Fest', 'Knowledge Park III', 'Food Court']
  },
  {
    slug: 'kiit-university',
    name: 'KIIT University (Kalinga Institute)',
    shortName: 'KIIT',
    location: 'Bhubaneswar, Odisha',
    country: 'India',
    type: 'Deemed',
    studentsCount: '30,000+',
    popularTopics: ['Campus 6', 'KIIT Fest', 'Rose Garden', 'Patia Hangouts']
  },
  {
    slug: 'nit-raipur',
    name: 'NIT Raipur',
    shortName: 'NITRR',
    location: 'Raipur, Chhattisgarh',
    country: 'India',
    type: 'Government',
    studentsCount: '5,000+',
    popularTopics: ['Eclectika Fest', 'GE Road', 'Amul Parlour', 'Central Library']
  },
  {
    slug: 'aiims-raipur',
    name: 'AIIMS Raipur',
    shortName: 'AIIMS RPR',
    location: 'Tatibandh, Raipur',
    country: 'India',
    type: 'Government',
    studentsCount: '2,500+',
    popularTopics: ['Tatibandh', 'Oriana Fest', 'Doctor Mess', 'Night Canteen']
  },
  {
    slug: 'hnlu-raipur',
    name: 'Hidayatullah National Law University (HNLU)',
    shortName: 'HNLU',
    location: 'Naya Raipur, Chhattisgarh',
    country: 'India',
    type: 'Government',
    studentsCount: '1,500+',
    popularTopics: ['Naya Raipur', 'Colossus Fest', 'Law Library', 'Moot Court']
  },
  {
    slug: 'bit-durg',
    name: 'Bhilai Institute of Technology (BIT Durg/Bhilai)',
    shortName: 'BIT Bhilai',
    location: 'Durg/Bhilai, Chhattisgarh',
    country: 'India',
    type: 'Private',
    studentsCount: '6,000+',
    popularTopics: ['Ojas Fest', 'Padmanabhpur', 'Civic Center Bhilai', 'BIT Lawn']
  },
  {
    slug: 'ssipmt-raipur',
    name: 'SSIPMT Raipur',
    shortName: 'SSIPMT',
    location: 'Mujgahan, Raipur',
    country: 'India',
    type: 'Private',
    studentsCount: '4,000+',
    popularTopics: ['Seva Fest', 'Mujgahan Campus', 'Library Block', 'Sports Ground']
  },
  {
    slug: 'csvtu-bhilai',
    name: 'CSVTU Bhilai',
    shortName: 'CSVTU',
    location: 'Bhilai, Chhattisgarh',
    country: 'India',
    type: 'Government',
    studentsCount: '15,000+',
    popularTopics: ['New Campus', 'Civic Center', 'Engineering Wing', 'Tech Fest']
  },
  {
    slug: 'mats-university',
    name: 'MATS University Raipur',
    shortName: 'MATS',
    location: 'Raipur, Chhattisgarh',
    country: 'India',
    type: 'Private',
    studentsCount: '5,000+',
    popularTopics: ['Pandri Campus', 'Aangneya Fest', 'Gullu Campus', 'Student Lounge']
  },
  {
    slug: 'itm-university-raipur',
    name: 'ITM University Raipur',
    shortName: 'ITM Raipur',
    location: 'Naya Raipur, Chhattisgarh',
    country: 'India',
    type: 'Private',
    studentsCount: '3,500+',
    popularTopics: ['Uparwara', 'ITM Fest', 'Knowledge Hub', 'Central Canteen']
  },
  {
    slug: 'delhi-university',
    name: 'Delhi University (DU)',
    shortName: 'DU',
    location: 'New Delhi, India',
    country: 'India',
    type: 'Government',
    studentsCount: '130,000+',
    popularTopics: ['North Campus', 'South Campus', 'Fest Season', 'Maggi Points']
  },
  {
    slug: 'iit-delhi',
    name: 'IIT Delhi',
    shortName: 'IITD',
    location: 'New Delhi, India',
    country: 'India',
    type: 'Government',
    studentsCount: '11,000+',
    popularTopics: ['Hauz Khas', 'Rendezvous Fest', 'Library All-Nighters', 'SDA Market']
  },
  {
    slug: 'iit-bombay',
    name: 'IIT Bombay',
    shortName: 'IITB',
    location: 'Mumbai, India',
    country: 'India',
    type: 'Government',
    studentsCount: '12,000+',
    popularTopics: ['Mood Indigo', 'Powai Lake', 'Hostel Nights', 'Mi Fest']
  },
  {
    slug: 'bits-pilani',
    name: 'BITS Pilani',
    shortName: 'BITS',
    location: 'Pilani, Rajasthan',
    country: 'India',
    type: 'Deemed',
    studentsCount: '15,000+',
    popularTopics: ['Oasis Fest', 'APOGEE', 'Rotunda', 'C-Not']
  },
  {
    slug: 'christ-university',
    name: 'Christ University',
    shortName: 'Christ',
    location: 'Bengaluru, India',
    country: 'India',
    type: 'Deemed',
    studentsCount: '25,000+',
    popularTopics: ['Hosur Road', 'Inbloom Fest', 'Central Campus', 'Gourmet Street']
  },
  {
    slug: 'manipal-university',
    name: 'Manipal University (MAHE)',
    shortName: 'Manipal',
    location: 'Manipal, Karnataka',
    country: 'India',
    type: 'Deemed',
    studentsCount: '30,000+',
    popularTopics: ['End Point', 'Revel Fest', 'Deetee', 'KMC Greens']
  },
  {
    slug: 'vit-vellore',
    name: 'VIT Vellore',
    shortName: 'VIT',
    location: 'Vellore, Tamil Nadu',
    country: 'India',
    type: 'Deemed',
    studentsCount: '35,000+',
    popularTopics: ['Riviera Fest', 'gravitas', 'Food Street', 'Gazebo']
  },
  {
    slug: 'srm-chennai',
    name: 'SRM Institute of Science and Technology',
    shortName: 'SRM',
    location: 'Kattankulathur, Chennai',
    country: 'India',
    type: 'Deemed',
    studentsCount: '40,000+',
    popularTopics: ['Milan Fest', 'Java Canteen', 'Abode Valley', 'UB Tower']
  },
  {
    slug: 'lpu-punjab',
    name: 'Lovely Professional University (LPU)',
    shortName: 'LPU',
    location: 'Phagwara, Punjab',
    country: 'India',
    type: 'Private',
    studentsCount: '45,000+',
    popularTopics: ['Uni Mall', 'YouthVibe Fest', 'Open Air Theatre', 'Block 34']
  }
];
