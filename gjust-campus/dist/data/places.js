(() => {
  const base = "https://gjust.ac.in/Page/";
  const hostels = base + "Index_4/Hostels/3331";
  const network = base + "Index_4/C-W-N-Cell/395";
  const audit = "https://gjust.ac.in/portal/upload/Energy%20Audit%20Report%20-%20GJUST%20-%20Hisar_120422_03September2024_11-06-53-83.pdf";
  const cse = "https://gjust.ac.in/portal/upload/f8dd117c-b038-49b2-823e-e92664ae31f3.pdf";
  const pharmacy = "https://gjust.ac.in/portal/upload/Standard%20Inspection%20Form%20Jan%202025_15January2025_13-28-19-80.pdf";
  const library = base + "Index_Department/University_Library/633";
  const cafeteria = base + "Index_4s/Cafeteria/640";
  const shopping = base + "Index_4s/Shopping_Complex/639";
  const health = base + "Index_4/University_Health_Centre/399";

  function place(name, category, description, source, aliases = [], details = {}) {
    return {name, category, description, source, aliases, ...details};
  }
  function hostel(name, block, aliases, extra = {}) {
    return place(name, "Hostel", block + ". Find the current allocation list, hostel prospectus and warden contacts on the university hostel page.", hostels, [block, ...aliases], extra);
  }

  window.CAMPUS_PLACES = [
    place("Dr. Bhim Rao Ambedkar Library", "Academic", "Look for the circular, three-storey building. The night reading hall opens from 8 am to midnight, with round-the-clock access during examinations according to the library.", library, ["University Library", "Central Library", "GJU Library", "reading hall", "Ambedkar Library"], {coords:[75.735266,29.170837],image:"images/library.webp",phone:"01662-263301",coordinateSource:"https://ph.trip.com/travel-guide/attraction/hisar/gju-library-141284833/"}),
    place("Ch. Ranbir Singh Auditorium", "Landmark", "Enter from the Central Library side. The main auditorium hosts convocations and performances. Three smaller seminar halls are on the ground floor.", base+"Index_Department/Ch_Ranbir_Singh_Auditorium/402", ["CRSA", "auditorium", "Chaudhary Ranbir Singh Auditorium"], {coords:[75.735186,29.170027],image:"images/auditorium.webp"}),
    place("University Cafeteria", "Amenity", "Lunch and refreshments are served in the ground-floor dining hall. The upstairs hall is used for student activities. The university lists food prices on its cafeteria page.", cafeteria, ["canteen", "food", "cafe", "lunch"], {image:"images/cafeteria.webp"}),
    place("Shopping Complex", "Amenity", "Find stationery, photocopying, everyday groceries, a Vita booth, banking and postal services at the campus market.", shopping, ["market", "photostat", "xerox", "photocopy", "stationery", "Vita booth"], {image:"images/market.webp"}),
    place("Administrative Block", "Landmark", "University administrative offices. Check the university branch directory for the office handling your enquiry before visiting.", base+"Index_Officers/University_Branches/856", ["Administration Block", "Admin Block", "administration"], {coords:[75.7333732,29.1703933]}),
    place("Department of Pharmaceutical Sciences", "Academic", "The university's Pharmacy Council inspection lists the department in Teaching Block 2. Contact the departmental office for a particular lab or faculty room.", pharmacy, ["Pharmacy", "Teaching Block 2", "Teaching Block II", "TB2", "BPharm", "B.Pharm"], {coords:[75.736109,29.1729976],phone:"01662-263580"}),
    place("Teaching Block VI", "Academic", "The Computer Science and Engineering departmental conference hall is in Teaching Block 6. Faculty offices can also be in other buildings.", cse, ["Department of Computer Science and Engineering", "Computer Science & Engineering", "CSE", "Teaching Block 6", "TB6"], {phone:"01662-263173"}),
    place("Teaching Block IV", "Academic", "Teaching Block 4 includes a seminar hall used for university counselling sessions. Check your current notice for the room and time.", "https://gjust.ac.in/portal/upload/B.%20Tech.%20First%20year%2C%202025-26_23July2025_15-38-39-92_24July2025_16-47-07-91.pdf", ["TB4", "Teaching Block 4", "seminar hall"], {coords:[75.7349396,29.1720702]}),
    place("Teaching Block VII", "Academic", "Academic block with teaching rooms and faculty offices. Use your timetable or the faculty directory to identify the room.", network, ["TB7", "TB 7 GJU", "Teaching Block 7"], {coords:[75.7404864,29.1698921]}),
    ...[[1,"I"],[3,"III"],[5,"V"]].map(([n,roman])=>place("Teaching Block "+roman,"Academic","University teaching block. Check the room number and building on your class timetable.",network,["TB"+n,"Teaching Block "+n])),
    place("Haryana School of Business", "Academic", "The business school has a separate campus building. Contact the school office for management classrooms and faculty enquiries.", base+"Index_Faculty/Haryana_School_of_Business/66", ["HSB", "management", "MBA", "business school"], {phone:"01662-263111"}),
    place("Central Instrumentation Laboratory", "Academic", "The Dr. APJ Abdul Kalam facility provides shared instruments including NMR, XRD and electron microscopy. Its university page lists equipment and sample charges.", base+"Index_4s/C_I_L/396", ["CIL", "Central Instrumentation Room", "Dr APJ Abdul Kalam", "DSC", "Raman", "NMR", "XRD", "FESEM"], {coords:[75.736179,29.172138],phone:"01662-263352",coordinateSource:"https://gjust.ac.in/portal/upload/DIFFERENTIAL%20SCANNING%20CALORIMETER_21May2025_16-08-12-03.pdf"}),
    place("Mechanical Engineering Workshop", "Academic", "The campus networking inventory identifies a dedicated Mechanical Engineering workshop. Contact the department for lab schedules.", network, ["mechanical workshop","ME workshop"], {phone:"01662-263184"}),
    place("Bio and Nano Technology Centre", "Academic", "A separate building houses biotechnology and nanotechnology research facilities.", network, ["Bio-Nano Technology", "Department of Biotechnology", "Biotechnology Centre"], {phone:"01662-263165"}),
    place("University Computer and Informatics Centre", "Academic", "The university's central computing and informatics facility.", base+"Index_Department/PDUCIC/634", ["PDUCIC", "computer centre", "informatics centre"]),
    place("Innovation and Incubation Centre", "Academic", "A university centre for entrepreneurship and incubation, with a seminar hall and a Centre of Excellence.", base+"Index_Department/PDUIIC/635", ["PDUIIC", "innovation centre", "incubation centre"]),
    hostel("J. C. Bose Sadan", "Boys Hostel I", ["Boys Hostel 1","BH1","BH I","JC Bose Sadan"]),
    hostel("Aryabhatt Sadan", "Boys Hostel II", ["Boys Hostel 2","BH2","BH II","Arya Bhatt Sadan"]),
    hostel("Madan Lal Dhingra Sadan", "Boys Hostel III", ["Boys Hostel 3","BH3","BH III"]),
    hostel("Vivekanand Bhawan", "Boys Hostel IV", ["Boys Hostel 4","BH4","BH IV","Vivekananda Bhawan"]),
    hostel("Kasturba Bhawan", "Girls Hostel I", ["Girls’ Hostel No. 1","Girls Hostel 1","GH1","GH I"], {coords:[75.731957,29.1731616]}),
    hostel("Saraswati Bhawan", "Girls Hostel II", ["Girls Hostel 2","GH2","GH II"]),
    hostel("Manikarnika Bhawan", "Girls Hostel III", ["Girls Hostel 3","GH3","GH III"]),
    hostel("Amrita Devi Bhawan", "Girls Hostel IV", ["Girls Hostel 4","GH4","GH IV"]),
    hostel("Kalpana Chawla Bhawan", "Working Women Hostel", ["Working Women's Hostel","WWH"]),
    place("University Health Centre", "Amenity", "Campus primary care for students and staff, including outpatient and dental services. The university publishes medical officers’ contacts and its list of empanelled hospitals.", health, ["medical centre","health care centre","clinic","doctor","UHC","dispensary"], {phone:"01662-263121"}),
    place("Punjab National Bank & ATM", "Amenity", "The university identifies Punjab National Bank as the campus branch. The ATM and bank are in the shopping complex.", base+"Index_4s/Bank/641", ["PNB","cash","ATM","banking"], {coords:[75.7314259,29.171124]}),
    place("Post Office", "Amenity", "The campus post office is in the shopping complex, beside other everyday services.", shopping, ["post","mail","postal services","India Post"]),
    place("University Sports Stadium", "Sports", "Campus stadium and sports grounds. The university sports page lists the facilities available to students.", base+"Index_4s/Sports_Facilities/407", ["sports complex", "sports ground", "stadium", "athletics"]),
    place("Open Air Theatre", "Landmark", "An outdoor campus venue listed in the GJUST energy audit.", audit, ["OAT","open air theater","amphitheatre"]),
    place("University Faculty House", "Amenity", "Guest accommodation with a dining hall and parking. The university publishes meal charges for the Faculty House and VIP Guest House.", base+"Index_4s/Faculty_House/403", ["faculty guest house","guest rooms"]),
    place("VIP Guest House", "Amenity", "University guest accommodation. Refer to the university page for guest house information.", base+"Index_4/VIP_guest_house/398", ["VIP guesthouse"]),
    place("Examination Wing", "Landmark", "University examination offices. For an exam date, check the published date sheet for your course and semester.", network, ["examination block","exam branch","exam office"]),
    place("Guru Jambheshwar Bhawan", "Landmark", "University building listed in the campus facilities inventory.", network, ["GJ Bhawan"])
  ];

  function resource(name, description, url) { return {name, title:name, description, url, source:url}; }
  window.CAMPUS_RESOURCES = [
    resource("Exam date sheets","Look up the timetable for your programme and semester.",base+"Index_3s/Datesheet/614"),
    resource("Academic calendar","Check teaching periods, breaks and examination windows.",base+"Index_2/Academic_Calendar/59"),
    resource("Hostels and wardens","Find course-wise allocations, the hostel prospectus and current warden contacts.",hostels),
    resource("Fees and dues","Open the university's student fee and dues notices.",base+"Index_2_cat/Fees_Dues/626"),
    resource("Examination forms","Find the form for your examination request.",base+"Index_2/Examination_Forms/852"),
    resource("Library services","Check the reading hall, library services and the librarian's contact details.",library),
    resource("Cafeteria price list","View the university's published rate list for food items.","https://gjust.ac.in/portal/upload/f1e033d7-47d6-442e-8fa1-045c7622a4da.pdf"),
    resource("Scholarships","Check the university's listed scholarship opportunities.",base+"Index_4s/Scholarship/611"),
    resource("Health centre","Find campus medical contacts and the empanelled hospital list.",health),
    resource("Student grievance","Find the university channel for registering a grievance.",base+"Index_4/Regsiter_Grievance/630"),
    resource("University contact directory","Look up office numbers for university services, departments and hostels.","https://gjust.ac.in/Page/Index_contact/Contact-Us-Page-Index-1s-University/15")
  ];
})();
