# CSV Export Structure

## Overview
The Firebase data export has been restructured to handle the nested JSON hierarchy by splitting data into **4 separate CSV files**, each with one row per provider per month (similar to your existing data format).

## API Endpoint

**GET** `/download-csv/:customerId`

Returns JSON with CSV strings for available data sources:
```json
{
  "success": true,
  "athelas": {
    "cptCodes": "...",
    "financial": "...",
    "payroll": "...",
    "rvu": "..."
  },
  "allscripts": {
    "cptCodes": "...",
    "financial": "...",
    "payroll": "...",
    "rvu": "..."
  },
  "ecw": {
    "cptCodes": "...",
    "financial": "...",
    "payroll": "...",
    "rvu": "..."
  }
}
```

**Data Sources by Customer:** 
- **VitalCare**: `ecw` only (ECW data)
- **UHealth**: `athelas` + `allscripts` (dual data sources)
- **Other customers**: `athelas` only

## CSV File Structures

### 1. CPT Codes CSV (`cptCodes`)
**Format:** One row per provider per CPT code per month

| Column | Description |
|--------|-------------|
| Provider | Provider name |
| Month | Format: `August_2025`, `July_2024` |
| CPT Code | CPT code (e.g., `99308`, `99309`) |
| Label | CPT label (e.g., `Subsequent Visits`) |
| Units | Number of units for this CPT code |
| Coding % | Percentage coding (e.g., `9.84%`) |
| Location | Parent location ID |
| Type | Node type (`provider`) |

**Example:**
```csv
Provider,Month,CPT Code,Label,Units,Coding %,Location,Type
Allison Young Smith,April_2025,99308,Subsequent Visits,22,9.84%,consulate_health_care_of_woodstock,provider
Allison Young Smith,April_2025,99309,Subsequent Visits,263,90.16%,consulate_health_care_of_woodstock,provider
```

### 2. Financial Metrics CSV (`financial`)
**Format:** One row per provider per month

| Column | Description |
|--------|-------------|
| Provider | Provider name |
| Month | Format: `August_2025`, `July_2024` |
| Charges | Total charges |
| Payments | Total payments |
| Payer Payment | Payer payment amount |
| Patient Payment | Patient payment amount |
| Adjustments | Adjustments amount |
| Payment % of Charges | Payment percentage |
| Adjustment % of Charges | Adjustment percentage |
| Average Receipts per Patient | Avg receipts per patient |
| Charge per Patient | Charge per patient |
| Location | Parent location ID |
| Type | Node type (`provider`) |

**Example:**
```csv
Provider,Month,Charges,Payments,Payer Payment,Patient Payment,Adjustments,Payment % of Charges,Adjustment % of Charges,Average Receipts per Patient,Charge per Patient,Location,Type
Allison Young Smith,April_2025,71535,20106.83,18000,2106.83,0,28.11,0,70.55,251,consulate_health_care_of_woodstock,provider
```

### 3. Payroll CSV (`payroll`)
**Format:** One row per provider per month

| Column | Description |
|--------|-------------|
| Provider | Provider name |
| Month | Format: `August_2025`, `July_2024` |
| Payroll | Payroll amount |
| Operating Profit | Operating profit (payments - payroll) |
| Location | Parent location ID |
| Type | Node type (`provider`) |

**Example:**
```csv
Provider,Month,Payroll,Operating Profit,Location,Type
Allison Young Smith,April_2025,8000,12106.83,consulate_health_care_of_woodstock,provider
```

### 4. RVU CSV (`rvu`)
**Format:** One row per provider per month

| Column | Description |
|--------|-------------|
| Provider | Provider name |
| Month | Format: `August_2025`, `July_2024` |
| Work RVU | Work RVU value |
| Total Visits | Total visits count |
| RVU per Patient | RVU per patient ratio |
| Location | Parent location ID |
| Type | Node type (`provider`) |

**Example:**
```csv
Provider,Month,Work RVU,Total Visits,RVU per Patient,Location,Type
Allison Young Smith,April_2025,550,285,1.93,consulate_health_care_of_woodstock,provider
```

## Key Features

1. **Denormalized Structure**: Each CSV is flat with one row per provider per month (or per CPT code per month for CPT codes)
2. **Month Format**: Matches your existing format (`January_2022`, `August_2025`, etc.)
3. **Only Non-Zero Data**: Rows are only included when there's actual data (non-zero values)
4. **Provider-Level Only**: Only exports provider nodes (not locations or aggregations)
5. **Hierarchy Preserved**: Location information is included in each row via the `Location` column
6. **Local File Saving**: CSV files are automatically saved locally to the server

## Usage Example

```bash
# Make request
curl http://localhost:3000/download-csv/vitalcare

# Response will contain 4 CSV strings in JSON format
# Files are also automatically saved locally to the server
```

## Local File Saving

**Location:** `/Users/vehbikaraagac/Desktop/MedLaunch/server/exported_csvs/`

**Files Created:**
- `{customerId}_{dataSource}_cpt_codes.csv`
- `{customerId}_{dataSource}_financial.csv`
- `{customerId}_{dataSource}_payroll.csv`
- `{customerId}_{dataSource}_rvu.csv`

**Example for customer "vitalcare" (ECW only):**
- `vitalcare_ecw_cpt_codes.csv`
- `vitalcare_ecw_financial.csv`
- `vitalcare_ecw_payroll.csv`
- `vitalcare_ecw_rvu.csv`

**Example for customer "uhealth" (Athelas + AllScripts):**
- `uhealth_athelas_cpt_codes.csv`
- `uhealth_athelas_financial.csv`
- `uhealth_athelas_payroll.csv`
- `uhealth_athelas_rvu.csv`
- `uhealth_allscripts_cpt_codes.csv`
- `uhealth_allscripts_financial.csv`
- `uhealth_allscripts_payroll.csv`
- `uhealth_allscripts_rvu.csv`

Files are saved automatically when the API endpoint is called, regardless of whether the API call succeeds or fails.

## Implementation Details

### CSV Export Service
- **Location**: `/Users/vehbikaraagac/Desktop/MedLaunch/server/src/services/csvExport.ts`
- **Functions**:
  - `exportCPTCodesCSV()` - Lines 47-89
  - `exportFinancialMetricsCSV()` - Lines 94-140
  - `exportPayrollCSV()` - Lines 145-179
  - `exportRVUCSV()` - Lines 184-218
  - `saveCSVFilesLocally()` - Lines 223-247
  - `exportCustomerDataAsCSV()` - Lines 252-266 (main export function)

### Firebase Service (Wrapper)
- **Location**: `/Users/vehbikaraagac/Desktop/MedLaunch/server/src/services/firebase.ts`
- **Function**: `exportCustomerDataAsCSV()` - Lines 1217-1245 (wrapper that gets Firebase data and calls CSV service)

### API Endpoint
- **Location**: `/Users/vehbikaraagac/Desktop/MedLaunch/server/src/index.ts` - Lines 144-173
