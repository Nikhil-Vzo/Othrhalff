export interface CampusData {
  slug: string;
  name: string;
  shortName: string;
  location: string;
  type: 'Private' | 'Government' | 'Deemed';
  studentsCount: string;
  popularTopics: string[];
}

export const campusList: CampusData[] = [
  // --- Amity University Campuses ---
  { slug: 'amity-noida', name: 'Amity University Noida', shortName: 'Amity Noida', location: 'Noida, Uttar Pradesh', type: 'Private', studentsCount: '35,000+', popularTopics: ['H-Block', 'Amity Street', 'Sangathan Fest', 'Food Plaza'] },
  { slug: 'amity-raipur', name: 'Amity University Raipur', shortName: 'Amity Raipur', location: 'Raipur, Chhattisgarh', type: 'Private', studentsCount: '6,000+', popularTopics: ['Manthan Fest', 'Math Kharora Campus', 'Student Lounge', 'Canteen Chai'] },
  { slug: 'amity-gurgaon', name: 'Amity University Gurgaon', shortName: 'Amity Gurgaon', location: 'Gurgaon, Haryana', type: 'Private', studentsCount: '10,000+', popularTopics: ['Manesar', 'Hostel Circle', 'Amiphoria Fest', 'Sports Complex'] },
  { slug: 'amity-jaipur', name: 'Amity University Jaipur', shortName: 'Amity Jaipur', location: 'Jaipur, Rajasthan', type: 'Private', studentsCount: '8,000+', popularTopics: ['Kant Kalwar', 'Lake View', 'Odyssey Fest', 'Amity Amphitheatre'] },
  { slug: 'amity-lucknow', name: 'Amity University Lucknow', shortName: 'Amity Lucknow', location: 'Lucknow, Uttar Pradesh', type: 'Private', studentsCount: '12,000+', popularTopics: ['Gomti Nagar Extension', 'Auditorium Lawn', 'Amiphoria', 'Nawab Canteen'] },
  { slug: 'amity-mumbai', name: 'Amity University Mumbai', shortName: 'Amity Mumbai', location: 'Panvel, Mumbai', type: 'Private', studentsCount: '9,000+', popularTopics: ['Panvel Campus', 'Aminova Fest', 'Western Express', 'Central Plaza'] },
  { slug: 'amity-kolkata', name: 'Amity University Kolkata', shortName: 'Amity Kolkata', location: 'New Town, Kolkata', type: 'Private', studentsCount: '7,000+', popularTopics: ['Action Area II', 'Eco Park Hangouts', 'Amiphoria East', 'Rooftop Lawn'] },

  // --- Sharda & KIIT Universities ---
  { slug: 'sharda-university', name: 'Sharda University', shortName: 'Sharda', location: 'Greater Noida, Uttar Pradesh', type: 'Private', studentsCount: '20,000+', popularTopics: ['The World is Here', 'Chorus Fest', 'Knowledge Park III', 'Food Court'] },
  { slug: 'kiit-university', name: 'KIIT University (Kalinga Institute)', shortName: 'KIIT', location: 'Bhubaneswar, Odisha', type: 'Deemed', studentsCount: '30,000+', popularTopics: ['Campus 6', 'KIIT Fest', 'Rose Garden', 'Patia Hangouts'] },

  // --- Raipur & Bhilai Institutions ---
  { slug: 'nit-raipur', name: 'NIT Raipur', shortName: 'NITRR', location: 'Raipur, Chhattisgarh', type: 'Government', studentsCount: '5,000+', popularTopics: ['Eclectika Fest', 'GE Road', 'Amul Parlour', 'Central Library'] },
  { slug: 'aiims-raipur', name: 'AIIMS Raipur', shortName: 'AIIMS RPR', location: 'Tatibandh, Raipur', type: 'Government', studentsCount: '2,500+', popularTopics: ['Tatibandh', 'Oriana Fest', 'Doctor Mess', 'Night Canteen'] },
  { slug: 'hnlu-raipur', name: 'Hidayatullah National Law University (HNLU)', shortName: 'HNLU', location: 'Naya Raipur, Chhattisgarh', type: 'Government', studentsCount: '1,500+', popularTopics: ['Naya Raipur', 'Colossus Fest', 'Law Library', 'Moot Court'] },
  { slug: 'bit-durg', name: 'Bhilai Institute of Technology (BIT Durg/Bhilai)', shortName: 'BIT Bhilai', location: 'Durg/Bhilai, Chhattisgarh', type: 'Private', studentsCount: '6,000+', popularTopics: ['Ojas Fest', 'Padmanabhpur', 'Civic Center Bhilai', 'BIT Lawn'] },
  { slug: 'ssipmt-raipur', name: 'SSIPMT Raipur', shortName: 'SSIPMT', location: 'Mujgahan, Raipur', type: 'Private', studentsCount: '4,000+', popularTopics: ['Seva Fest', 'Mujgahan Campus', 'Library Block', 'Sports Ground'] },
  { slug: 'csvtu-bhilai', name: 'CSVTU Bhilai', shortName: 'CSVTU', location: 'Bhilai, Chhattisgarh', type: 'Government', studentsCount: '15,000+', popularTopics: ['New Campus', 'Civic Center', 'Engineering Wing', 'Tech Fest'] },
  { slug: 'mats-university', name: 'MATS University Raipur', shortName: 'MATS', location: 'Raipur, Chhattisgarh', type: 'Private', studentsCount: '5,000+', popularTopics: ['Pandri Campus', 'Aangneya Fest', 'Gullu Campus', 'Student Lounge'] },
  { slug: 'itm-university-raipur', name: 'ITM University Raipur', shortName: 'ITM Raipur', location: 'Naya Raipur, Chhattisgarh', type: 'Private', studentsCount: '3,500+', popularTopics: ['Uparwara', 'ITM Fest', 'Knowledge Hub', 'Central Canteen'] },

  // --- Major National Universities ---
  { slug: 'delhi-university', name: 'Delhi University (DU)', shortName: 'DU', location: 'New Delhi, India', type: 'Government', studentsCount: '130,000+', popularTopics: ['North Campus', 'South Campus', 'Fest Season', 'Maggi Points'] },
  { slug: 'iit-delhi', name: 'IIT Delhi', shortName: 'IITD', location: 'New Delhi, India', type: 'Government', studentsCount: '11,000+', popularTopics: ['Hauz Khas', 'Rendezvous Fest', 'Library All-Nighters', 'SDA Market'] },
  { slug: 'iit-bombay', name: 'IIT Bombay', shortName: 'IITB', location: 'Mumbai, India', type: 'Government', studentsCount: '12,000+', popularTopics: ['Mood Indigo', 'Powai Lake', 'Hostel Nights', 'Mi Fest'] },
  { slug: 'bits-pilani', name: 'BITS Pilani', shortName: 'BITS', location: 'Pilani, Rajasthan', type: 'Deemed', studentsCount: '15,000+', popularTopics: ['Oasis Fest', 'APOGEE', 'Rotunda', 'C-Not'] },
  { slug: 'christ-university', name: 'Christ University', shortName: 'Christ', location: 'Bengaluru, India', type: 'Deemed', studentsCount: '25,000+', popularTopics: ['Hosur Road', 'Inbloom Fest', 'Central Campus', 'Gourmet Street'] },
  { slug: 'manipal-university', name: 'Manipal University (MAHE)', shortName: 'Manipal', location: 'Manipal, Karnataka', type: 'Deemed', studentsCount: '30,000+', popularTopics: ['End Point', 'Revel Fest', 'Deetee', 'KMC Greens'] },
  { slug: 'vit-vellore', name: 'VIT Vellore', shortName: 'VIT', location: 'Vellore, Tamil Nadu', type: 'Deemed', studentsCount: '35,000+', popularTopics: ['Riviera Fest', 'gravitas', 'Food Street', 'Gazebo'] },
  { slug: 'srm-chennai', name: 'SRM Institute of Science and Technology', shortName: 'SRM', location: 'Kattankulathur, Chennai', type: 'Deemed', studentsCount: '40,000+', popularTopics: ['Milan Fest', 'Java Canteen', 'Abode Valley', 'UB Tower'] },
  { slug: 'lpu-punjab', name: 'Lovely Professional University (LPU)', shortName: 'LPU', location: 'Phagwara, Punjab', type: 'Private', studentsCount: '45,000+', popularTopics: ['Uni Mall', 'YouthVibe Fest', 'Open Air Theatre', 'Block 34'] }
];
