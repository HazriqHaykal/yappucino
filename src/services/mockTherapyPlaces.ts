// Real Malaysian counseling/psychology practices, curated by hand rather
// than pulled live from the Places API (see runTherapyNudge.ts for why the
// enum-based Nearby Search can't find these). Hours/ratings are a snapshot
// at the time this list was put together, not live data.
export interface TherapyPlace {
  id: string;
  name: string;
  type: string;
  address: string;
  phone?: string;
  rating?: number;
  hours?: string;
  blurb: string;
}

const THERAPY_PLACES: TherapyPlace[] = [
  {
    id: "the-mind-hub-mmha",
    name: "The Mind Hub, Malaysian Mental Health Association",
    type: "Non-profit Mental Health Organization",
    address: "TTDI Plaza, Block A Unit 2, 8, Jalan Wan Kadir 3, Taman Tun Dr Ismail, 60000 Kuala Lumpur",
    phone: "+60 3-2780 6803",
    hours: "Closed for the rest of today",
    blurb:
      "A well-established non-profit offering accessible mental health support, including sessions with registered clinical psychologists and trainee counselors — a good option for structured, reliable support. Fee structure varies between a registered psychologist and a trainee.",
  },
  {
    id: "serene-psychological-services",
    name: "Serene Psychological Services",
    type: "Medical clinic",
    address: "2-01B Level 2 Wisma Lifecare, Jalan Kerinchi, Bangsar South, 59200 Kuala Lumpur",
    phone: "+60 18-777 2242",
    rating: 4.2,
    hours: "Closed · Opens 9:00 AM Tue",
    blurb:
      "A private psychology center in Bangsar South focused on individualized stress management, with reviewers frequently highlighting the calming, professional environment.",
  },
  {
    id: "lavender-psychology-consultancy",
    name: "Lavender Psychology Consultancy",
    type: "Medical clinic",
    address: "27-09, Block C, The Hub, SS 2, 46400 Petaling Jaya, Selangor",
    phone: "+60 13-897 1268",
    rating: 5.0,
    hours: "Closed · Opens 10:00 AM Tue",
    blurb:
      "A boutique psychology practice in SS2, Petaling Jaya, tailoring evidence-based practices for burnout, stress, anxiety, and depression. Known for personalized individual therapy and psychological assessments.",
  },
  {
    id: "safe-space-psychology-centre",
    name: "Safe Space Psychology Centre",
    type: "Medical clinic",
    address:
      "B-07-21, Sunway GEO Avenue, Sunway South Quay, Jalan Lagoon Selatan, Bandar Sunway, 47500 Subang Jaya, Selangor",
    phone: "+60 18-959 9018",
    rating: 4.6,
    hours: "Closed · Opens 10:00 AM Tue",
    blurb:
      "A structured environment in Bandar Sunway equipped to address anxiety and stress through dedicated therapy sessions, conveniently located within the Sunway GEO complex.",
  },
  {
    id: "telos-mental-wellness",
    name: "Telos Mental Wellness",
    type: "Medical clinic",
    address: "6D-1, Level 3, Jalan USJ 10/1j, Taipan Business Centre, 47620 Subang Jaya, Selangor",
    rating: 4.9,
    hours: "Open · Closes 10:00 PM",
    blurb:
      "Operates out of the Taipan Business Centre in Subang Jaya with extensive hours, providing a secure environment for clients navigating high-stress situations or ongoing anxiety management, open late seven days a week.",
  },
  {
    id: "mentem-psychological-services",
    name: "Mentem Psychological Services",
    type: "Medical clinic",
    address: "5-2, Jln USJ 21/1, Usj 21, 47630 Subang Jaya, Selangor",
    phone: "+60 3-8025 1009",
    rating: 4.7,
    hours: "Closed · Opens 10:00 AM Tue",
    blurb:
      "A client-centered facility in USJ 21 experienced in working with adults facing emotional distress, burnout, and acute anxiety, helping clients develop better coping mechanisms.",
  },
  {
    id: "bravuramind",
    name: "BravuraMind",
    type: "Medical clinic",
    address: "11a, Jalan Putra Mahkota 7/6c, Putra Heights, 47650 Subang Jaya, Selangor",
    phone: "+60 19-479 7600",
    rating: 4.8,
    hours: "Open · Closes 9:00 PM",
    blurb:
      "A mental health practice in Putra Heights offering comprehensive support for psychological well-being, helping clients process stressors and build resilience through structured techniques.",
  },
  {
    id: "relationary",
    name: "Relationary",
    type: "Medical clinic",
    address: "Tower 14 Level 7, 14-7, Jalan USJ 9/5t, Subang Business Centre, 47620 Subang Jaya, Selangor",
    phone: "+60 3-8011 8213",
    rating: 4.5,
    hours: "Open · Closes 10:00 PM, seven days a week",
    blurb:
      "A counseling center in Subang Business Centre supporting individuals through life transitions, stress, and anxiety, with extended evening hours for busy daytime schedules.",
  },
];

export function getMockTherapyPlaces(): TherapyPlace[] {
  return THERAPY_PLACES;
}
