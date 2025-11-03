const fs = require('fs');
const path = require('path');

// Provider names from provider_location_relationship.csv (excluding inactive providers)
const providers = [
  "Smith, John A",
  "Johnson, Mary K", 
  "Williams, Robert T",
  "Brown, Jennifer L",
  "Jones, Michael B",
  "Garcia, Sarah M",
  "Miller, David R",
  "Davis, Lisa A",
  "Rodriguez, Carlos J",
  "Martinez, Patricia S",
  "Hernandez, Luis M",
  "Lopez, Maria T",
  "Gonzalez, Francisco R",
  "Wilson, Amanda K",
  "Anderson, Thomas J",
  "Thomas, Nancy L",
  "Taylor, Steven M",
  "Moore, Barbara A",
  "Jackson, Kevin D",
  "Martin, Susan R",
  "Lee, Brian K",
  "Perez, Diego M"
];

// Provider-Location mapping from CSV
const providerLocations = {
  "Smith, John A": "Prince George",
  "Johnson, Mary K": "Ashlake",
  "Williams, Robert T": "Discovery",
  "Brown, Jennifer L": "Discovery",
  "Jones, Michael B": "Ashlake",
  "Garcia, Sarah M": "Ashlake",
  "Miller, David R": "Ashlake",
  "Davis, Lisa A": "Discovery",
  "Rodriguez, Carlos J": "Discovery",
  "Martinez, Patricia S": "Ashlake",
  "Hernandez, Luis M": "Discovery",
  "Lopez, Maria T": "Ashlake",
  "Gonzalez, Francisco R": "Ashlake",
  "Wilson, Amanda K": "Discovery",
  "Anderson, Thomas J": "Discovery",
  "Thomas, Nancy L": "Ashlake",
  "Taylor, Steven M": "Discovery",
  "Moore, Barbara A": "Discovery",
  "Jackson, Kevin D": "Prince George",
  "Martin, Susan R": "Discovery",
  "Lee, Brian K": "Discovery",
  "Perez, Diego M": "Ashlake"
};

// Common CPT codes for medical services - including vitalcare codes and additional random ones
const cptCodes = [
  // VitalCare specific codes
  "99202", "99203", "99204", "99205",
  "99211", "99212", "99213", "99214", "99215",
  "99394", "99395", "99396", "99397",
  "G0439", "G0438", "G0402",
  "99495", "99496",
  "95004",
  "G2211",
  "96127",
  // Additional random medical codes
  "1036F", "1100F", "1101F", "1123F", "1124F", "2022F", "2026F", "20520",
  "20525", "20526", "20600", "20605", "20610", "20612", "20615",
  "21070", "21071", "21073", "21074", "21075", "21076", "21077", "21078",
  "21079", "21081", "21082", "21083", "21084", "21085", "21086", "21087",
  "21088", "21089", "21090", "21091", "21092", "21093", "21094", "21095",
  "21096", "21097", "21098", "21099", "21100", "21101", "21102", "21103",
  "21104", "21105", "21106", "21107", "21108", "21109", "21110", "21111",
  "21112", "21113", "21114", "21115", "21116", "21117", "21118", "21119",
  "21120", "21121", "21122", "21123", "21124", "21125", "21126", "21127",
  "36415", "80053", "80061", "81002", "83036", "84443", "85025", "85610",
  "87404", "90471", "90472", "90686", "90715", "93000", "93005", "93306",
  "93880", "93970", "93971", "93978", "93979", "93981", "94760", "94761",
  "94762", "96110", "96116", "95806", "95807", "95808", "95809", "95810",
  "95811", "95920", "95921", "95922", "95923", "95924", "95925", "95926",
  "95927", "95928", "95929", "95930", "95931", "95932", "95933", "95934",
  "95935", "95936", "95937", "97001", "97002", "97003", "97004", "97010",
  "97012", "97014", "97016", "97018", "97022", "97024", "97026", "97028",
  "97032", "97033", "97034", "97035", "97110", "97112", "97113", "97116",
  "97124", "97140", "97150", "97161", "97162", "97163", "97164", "97165",
  "97166", "97167", "97168", "97169", "97250", "97530", "97532", "97533",
  "97534", "97535", "97537", "97542", "97545", "97597", "97598", "97402",
  "97410", "97412", "97416", "97424", "97450", "97461", "97462", "97499",
  "97504", "97520", "97525", "97526", "97530", "97532", "97533", "97534",
  "97535", "97537", "97542", "97545", "97546", "97597", "97598", "97750",
  "97751", "97752", "97753", "97755", "97760", "97761", "97762", "97763",
  "98940", "98941", "98942", "98943", "99201", "99202", "99203", "99204",
  "99205", "99211", "99212", "99213", "99214", "99215", "99281", "99282",
  "99283", "99284", "99285", "99286", "99287", "99288", "99291", "99292",
  "99304", "99305", "99306", "99307", "99308", "99309", "99310", "99315",
  "99316", "99318", "99324", "99325", "99326", "99327", "99328", "99334",
  "99335", "99336", "99337", "99339", "99340", "99341", "99342", "99343",
  "99344", "99345", "99347", "99348", "99349", "99350", "99381", "99382",
  "99383", "99384", "99385", "99386", "99387", "99389", "99390", "99391",
  "99392", "99393", "99394", "99395", "99396", "99397", "99401", "99402",
  "99403", "99404", "99406", "99407", "99408", "99409", "99410", "99411",
  "99412", "99415", "99416", "99417", "99418", "99420", "99421", "99422",
  "99423", "99424", "99425", "99426", "99427", "99429", "99430", "99431",
  "99432", "99433", "99434", "99435", "99436", "99437", "99438", "99439",
  "99440", "99441", "99442", "99443", "99444", "99445", "99446", "99447",
  "99448", "99449", "99450", "99451", "99452", "99453", "99454", "99455",
  "99456", "99457", "99458", "99460", "99461", "99462", "99463", "99464",
  "99465", "99466", "99468", "99469", "99470", "99471", "99472", "99473",
  "99474", "99475", "99476", "99477", "99478", "99479", "99480", "99481",
  "99482", "99483", "99484", "99485", "99486", "99487", "99488", "99489",
  "99490", "99491", "99492", "99493", "99494", "99495", "99496", "99499",
  "99500", "99501", "99502", "99503", "99504", "99505", "99506", "99507",
  "99508", "99509", "99510", "99511", "99512", "99513", "99514", "99515",
  "99516", "99517", "99518", "99519", "99520", "99521", "99522", "99523",
  "99524", "99525", "99526", "99527", "99528", "99529", "99530", "99531",
  "99532", "99533", "99534", "99535", "99536", "99537", "99538", "99539",
  "99540", "99541", "99542", "99543", "99544", "99545", "99546", "99547",
  "99548", "99549", "99550", "99551", "99552", "99553", "99554", "99555",
  "99556", "99557", "99558", "99559", "99560", "99561", "99562", "99563",
  "99564", "99565", "99566", "99567", "99568", "99569", "99570", "99571",
  "99572", "99573", "99574", "99575", "99576", "99577", "99578", "99579",
  "99580", "99581", "99582", "99583", "99584", "99585", "99586", "99587",
  "99588", "99589", "99590", "99591", "99592", "99593", "99594", "99595",
  "99596", "99597", "99598", "99599"
];

// Generate random number between min and max
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random decimal between min and max
function randomDecimal(min, max, decimals = 2) {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

// Generate a single row of data
function generateRow(provider, location, month, cptCode) {
  // Skip inactive providers
  if (location === "Inactive") {
    return null;
  }
  
  const billedCharge = randomDecimal(50, 500);
  const payerCharge = randomDecimal(40, parseFloat(billedCharge));
  const selfCharge = randomDecimal(0, 50);
  const payment = randomDecimal(30, parseFloat(billedCharge));
  const payerPayment = randomDecimal(25, parseFloat(payment));
  const patientPayment = randomDecimal(0, parseFloat(payment) - parseFloat(payerPayment));
  const contractualAdjustment = randomDecimal(0, parseFloat(billedCharge) - parseFloat(payment));
  const payerWithheld = randomDecimal(0, 20);
  const writeoffAdjustment = randomDecimal(0, 50);
  const refund = randomDecimal(0, 10);
  const patientCount = randomBetween(1, 50);
  const claimCount = randomBetween(1, patientCount);
  const units = randomBetween(1, claimCount);
  const changeInAR = randomDecimal(-100, 100);
  const collectionRate = randomDecimal(60, 95);
  
  return `"${provider}",${location},${month},${cptCode},None,${billedCharge},${payerCharge},${selfCharge},${payment},${collectionRate}%,${payerPayment},${patientPayment},${contractualAdjustment},${payerWithheld},${writeoffAdjustment},${refund},${patientCount},${claimCount},${units},${changeInAR},${collectionRate}%`;
}

// Generate the CSV data
function generateFinancialCSV(year = 2022) {
  const months = [
    `January_${year}`, `February_${year}`, `March_${year}`, `April_${year}`, `May_${year}`, `June_${year}`,
    `July_${year}`, `August_${year}`, `September_${year}`, `October_${year}`, `November_${year}`, `December_${year}`
  ];

  const header = "Appointment / Servicing Provider,Location,Month,CPT Code,None,Billed Charge,Payer Charge,Self Charge,Payment,Payments %,Payer Payment,Patient Payment,Contractual Adjustment,Payer Withheld,Writeoff Adjustment,Refund,Patient Count,Claim Count,Units,Change in A/R,Collection %\n";
  
  let rows = [];
  
  // Generate data for each provider, month, and random CPT codes
  for (const provider of providers) {
    const location = providerLocations[provider];
    
    // Skip inactive providers
    if (location === "Inactive") {
      continue;
    }
    
    for (const month of months) {
      // Each provider has 5-15 CPT codes per month
      const numCptCodes = randomBetween(5, 15);
      const selectedCptCodes = [];
      
      for (let i = 0; i < numCptCodes; i++) {
        const randomIndex = randomBetween(0, cptCodes.length - 1);
        const cptCode = cptCodes[randomIndex];
        
        // Avoid duplicate CPT codes for the same provider in the same month
        if (!selectedCptCodes.includes(cptCode)) {
          selectedCptCodes.push(cptCode);
          const row = generateRow(provider, location, month, cptCode);
          if (row) {
            rows.push(row);
          }
        }
      }
    }
  }
  
  // Sort by provider name, then location, then month, then CPT code
  rows.sort((a, b) => {
    const aParts = a.split(',');
    const bParts = b.split(',');
    
    const providerCompare = aParts[0].localeCompare(bParts[0]);
    if (providerCompare !== 0) return providerCompare;
    
    const locationCompare = aParts[1].localeCompare(bParts[1]);
    if (locationCompare !== 0) return locationCompare;
    
    const monthCompare = aParts[2].localeCompare(bParts[2]);
    if (monthCompare !== 0) return monthCompare;
    
    return aParts[3].localeCompare(bParts[3]);
  });
  
  return header + rows.join('\n');
}

// Generate financial data for all years (2022-2025)
const years = [2022, 2023, 2024, 2025];

// Generate data for each year
years.forEach(year => {
  console.log(`Generating financial data for ${year}...`);
  const csvData = generateFinancialCSV(year);
  const outputPath = path.join(__dirname, 'data', year.toString(), 'financial_analysis.csv');
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, csvData, 'utf8');
  console.log(`✅ Generated ${year} financial CSV with ${csvData.split('\n').length - 1} data rows`);
});

console.log('🎉 All financial data generation complete!');
