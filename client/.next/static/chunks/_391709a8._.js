(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/data/fakeTableData.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// Table data matching the screenshot layout, color groupings, and structure
__turbopack_context__.s({
    "tableData": ()=>tableData,
    "tableMonths": ()=>tableMonths
});
const tableData = [
    // Initial Visits Section (Yellow)
    {
        section: "Initial Visits",
        type: "data",
        code: "99374",
        values: [
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7
        ],
        total: 7,
        coding: "7%",
        colorGroup: "yellow"
    },
    {
        section: "Initial Visits",
        type: "data",
        code: "99375",
        values: [
            1,
            2,
            1,
            1,
            2,
            3,
            2,
            1,
            2,
            1,
            3,
            2
        ],
        total: 21,
        coding: "5%",
        colorGroup: "yellow"
    },
    {
        section: "Initial Visits",
        type: "data",
        code: "99376",
        values: [
            11,
            16,
            17,
            9,
            12,
            15,
            18,
            17,
            14,
            16,
            13,
            17
        ],
        total: 159,
        coding: "92%",
        colorGroup: "yellow"
    },
    {
        section: "Initial Visits",
        type: "total",
        label: "Total",
        values: [
            14,
            19,
            21,
            12,
            15,
            27,
            23,
            12,
            18,
            27,
            18,
            27
        ],
        total: 273,
        coding: "",
        colorGroup: "yellow"
    },
    // Subsequent Visits Section (Orange)
    {
        section: "Subsequent Visits",
        type: "data",
        code: "99377",
        values: [
            5,
            3,
            2,
            4,
            6,
            5,
            4,
            3,
            5,
            4,
            6,
            5
        ],
        total: 52,
        coding: "2%",
        colorGroup: "orange"
    },
    {
        section: "Subsequent Visits",
        type: "data",
        code: "99378",
        values: [
            96,
            19,
            47,
            45,
            51,
            38,
            42,
            36,
            44,
            49,
            47,
            52
        ],
        total: 559,
        coding: "35%",
        colorGroup: "orange"
    },
    {
        section: "Subsequent Visits",
        type: "data",
        code: "99379",
        values: [
            174,
            123,
            34,
            65,
            89,
            111,
            97,
            127,
            175,
            98,
            112,
            137
        ],
        total: 1158,
        coding: "56%",
        colorGroup: "orange"
    },
    {
        section: "Subsequent Visits",
        type: "data",
        code: "99317",
        values: [
            42,
            39,
            2,
            66,
            53,
            47,
            51,
            48,
            57,
            54,
            49,
            52
        ],
        total: 553,
        coding: "9%",
        colorGroup: "orange"
    },
    {
        section: "Subsequent Visits",
        type: "total",
        label: "Total",
        values: [
            312,
            181,
            83,
            111,
            273,
            278,
            196,
            279,
            277,
            275,
            199,
            211
        ],
        total: 2325,
        coding: "",
        colorGroup: "orange"
    },
    // Discharge Section (Grey)
    {
        section: "Discharge",
        type: "data",
        code: "99315",
        values: [
            2,
            1,
            3,
            2,
            1,
            2,
            3,
            1,
            2,
            3,
            2,
            1
        ],
        total: 23,
        coding: "31%",
        colorGroup: "grey"
    },
    {
        section: "Discharge",
        type: "data",
        code: "99316",
        values: [
            1,
            1,
            1,
            1,
            2,
            1,
            1,
            1,
            1,
            2,
            1,
            1
        ],
        total: 14,
        coding: "69%",
        colorGroup: "grey"
    },
    {
        section: "Discharge",
        type: "total",
        label: "Total",
        values: [
            7,
            7,
            1,
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7
        ],
        total: 13,
        coding: "",
        colorGroup: "grey"
    },
    // Overall Totals (Blue)
    {
        section: "Totals",
        type: "total",
        label: "Total Visits",
        values: [
            332,
            197,
            97,
            96,
            122,
            145,
            217,
            188,
            199,
            221,
            187,
            275
        ],
        total: 2792,
        coding: "177%",
        colorGroup: "blue"
    },
    // RVUs (Blue)
    {
        section: "RVUs",
        type: "data",
        label: "Work RVUs",
        values: [
            624.1,
            525.96,
            168.82,
            219.76,
            312.45,
            489.22,
            517.33,
            455.12,
            388.76,
            412.88,
            397.23,
            579.67
        ],
        total: 4997.1,
        coding: "98%",
        colorGroup: "blue",
        isSectionHeader: true
    },
    {
        section: "RVUs",
        type: "data",
        label: "Work RVUs per patient",
        values: [
            1.88,
            2.13,
            1.76,
            1.8,
            2.71,
            2.78,
            1.95,
            2.12,
            2.74,
            1.99,
            2.11,
            2.15
        ],
        total: 2.71,
        coding: "97%",
        colorGroup: "blue"
    },
    // Charges (Yellow/Green)
    {
        section: "Charges",
        type: "data",
        label: "Charges",
        values: [
            57445,
            44479.5,
            41179,
            27677,
            25477,
            33217,
            29177,
            31757,
            35887,
            29977,
            26577,
            35577
        ],
        total: 397313,
        coding: "177%",
        colorGroup: "yellow",
        isCurrency: true,
        isSectionHeader: true
    },
    {
        section: "Charges",
        type: "data",
        label: "Average charges per patient",
        values: [
            173.73,
            181.36,
            122.81,
            169.43,
            155.22,
            167.12,
            148.99,
            177.34,
            162.45,
            158.77,
            166.11,
            174.97
        ],
        total: 171.33,
        coding: "98%",
        colorGroup: "yellow",
        isCurrency: true
    },
    // Payments (Green)
    {
        section: "Payments",
        type: "data",
        label: "Payments",
        values: [
            38689,
            19638,
            16153,
            15777,
            17277,
            27177,
            18977,
            21757,
            27577,
            19877,
            18477,
            22777
        ],
        total: 239437,
        coding: "63%",
        colorGroup: "green",
        isCurrency: true,
        isSectionHeader: true
    },
    {
        section: "Payments",
        type: "data",
        label: "Average receipts per patient",
        values: [
            116.55,
            99.5,
            93.75,
            133.79,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7
        ],
        total: 176.71,
        coding: "",
        colorGroup: "green",
        isCurrency: true
    },
    // Adjustments (Pink)
    {
        section: "Adjustments",
        type: "data",
        label: "Adjustments",
        values: [
            42685,
            18277,
            12933,
            17323,
            11577,
            13477,
            12977,
            12757,
            11877,
            12177,
            11977,
            12777
        ],
        total: 189561,
        coding: "65%",
        colorGroup: "pink",
        isCurrency: true
    },
    // Provider Income (Orange)
    {
        section: "Provider Income",
        type: "data",
        label: "Provider Income",
        values: [
            "$12,577",
            "$13,277",
            "$14,777",
            "$12,977",
            "$13,877",
            "$14,577",
            "$13,677",
            "$14,277",
            "$13,977",
            "$14,377",
            "$13,777",
            "$14,177"
        ],
        total: "$164,677",
        coding: "",
        colorGroup: "orange",
        isCurrency: true,
        isSectionHeader: true
    },
    {
        section: "Provider Income",
        type: "data",
        label: "% of Payments",
        values: [
            "48%",
            "52%",
            "57%",
            "53%",
            "49%",
            "51%",
            "52%",
            "57%",
            "48%",
            "53%",
            "49%",
            "51%"
        ],
        total: "51%",
        coding: "",
        colorGroup: "orange"
    },
    {
        section: "Provider Income",
        type: "data",
        label: "Average income per patient",
        values: [
            "$",
            "8",
            "8",
            "8",
            "8",
            "8",
            "8",
            "8",
            "8",
            "8",
            "8",
            "8"
        ],
        total: "$",
        coding: "",
        colorGroup: "orange",
        isCurrency: true
    },
    {
        section: "Provider Income",
        type: "data",
        label: "Average income per RVU",
        values: [
            "$",
            "8",
            "8",
            "8",
            "8",
            "8",
            "8",
            "8",
            "8",
            "8",
            "8",
            "8"
        ],
        total: "$",
        coding: "",
        colorGroup: "orange",
        isCurrency: true
    }
];
const tableMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Totals",
    "Coding %"
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/component/Table.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>FinancialKpiTable
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Table$2f$Table$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Table/Table.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableBody$2f$TableBody$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/TableBody/TableBody.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/TableCell/TableCell.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableContainer$2f$TableContainer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/TableContainer/TableContainer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableHead$2f$TableHead$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/TableHead/TableHead.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableRow$2f$TableRow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/TableRow/TableRow.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Paper$2f$Paper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Paper/Paper.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$data$2f$fakeTableData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/data/fakeTableData.ts [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
// Map colorGroup to background color
const colorMap = {
    yellow: "#FFF9C4",
    orange: "#FFE0B2",
    grey: "#E0E0E0",
    blue: "#B3E5FC",
    green: "#C8E6C9",
    pink: "#F8BBD0"
};
function formatCurrency(value) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    });
}
function FinancialKpiTable() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableContainer$2f$TableContainer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        component: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Paper$2f$Paper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"],
        sx: {
            boxShadow: 2,
            borderRadius: 2
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Table$2f$Table$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            "aria-label": "financial performance table",
            size: "small",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableHead$2f$TableHead$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableRow$2f$TableRow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                sx: {
                                    fontWeight: 700,
                                    fontSize: 15,
                                    width: 80
                                },
                                children: " "
                            }, void 0, false, {
                                fileName: "[project]/component/Table.tsx",
                                lineNumber: 35,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                sx: {
                                    fontWeight: 700,
                                    fontSize: 15,
                                    width: 80
                                },
                                children: "Code/Description"
                            }, void 0, false, {
                                fileName: "[project]/component/Table.tsx",
                                lineNumber: 38,
                                columnNumber: 13
                            }, this),
                            __TURBOPACK__imported__module__$5b$project$5d2f$data$2f$fakeTableData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tableMonths"].map((month)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    align: "center",
                                    sx: {
                                        fontWeight: 700,
                                        fontSize: 15,
                                        background: month === "Totals" ? "#D3D3D3" : month === "Coding %" ? "#E1A9E2" : undefined
                                    },
                                    children: month
                                }, month, false, {
                                    fileName: "[project]/component/Table.tsx",
                                    lineNumber: 42,
                                    columnNumber: 15
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/component/Table.tsx",
                        lineNumber: 34,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/component/Table.tsx",
                    lineNumber: 33,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableBody$2f$TableBody$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    children: (()=>{
                        const grouped = {};
                        __TURBOPACK__imported__module__$5b$project$5d2f$data$2f$fakeTableData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tableData"].forEach((row)=>{
                            if (!grouped[row.section]) grouped[row.section] = [];
                            grouped[row.section].push(row);
                        });
                        const verticalSections = [
                            "Initial Visits",
                            "Subsequent Visits",
                            "Discharge"
                        ];
                        return Object.entries(grouped).flatMap((param)=>{
                            let [section, rows] = param;
                            if (verticalSections.includes(section)) {
                                // Render with vertical section label
                                return rows.map((row, rowIdx)=>{
                                    const showSection = rowIdx === 0;
                                    const sectionColor = colorMap[row.colorGroup] || colorMap[rows[0].colorGroup] || "#fff";
                                    const isTotal = row.type === "total";
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableRow$2f$TableRow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        children: [
                                            showSection && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                rowSpan: rows.length,
                                                sx: {
                                                    writingMode: "vertical-rl",
                                                    textAlign: "center",
                                                    background: isTotal ? sectionColor : sectionColor,
                                                    fontWeight: 700,
                                                    fontSize: 15,
                                                    color: "#222",
                                                    minWidth: 32,
                                                    maxWidth: 32,
                                                    borderRight: "2px solid #fff"
                                                },
                                                children: section
                                            }, void 0, false, {
                                                fileName: "[project]/component/Table.tsx",
                                                lineNumber: 89,
                                                columnNumber: 25
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                sx: {
                                                    fontWeight: isTotal ? 700 : 500,
                                                    fontSize: 14,
                                                    background: isTotal ? sectionColor : undefined
                                                },
                                                children: row.code ? row.code : row.label
                                            }, void 0, false, {
                                                fileName: "[project]/component/Table.tsx",
                                                lineNumber: 106,
                                                columnNumber: 23
                                            }, this),
                                            row.values.map((val, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    align: "center",
                                                    sx: {
                                                        fontWeight: isTotal ? 700 : 400,
                                                        background: isTotal ? sectionColor : undefined
                                                    },
                                                    children: row.isCurrency && val ? formatCurrency(val) : val
                                                }, i, false, {
                                                    fileName: "[project]/component/Table.tsx",
                                                    lineNumber: 116,
                                                    columnNumber: 25
                                                }, this)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                align: "center",
                                                sx: {
                                                    fontWeight: isTotal ? 700 : 400,
                                                    background: "#D3D3D3"
                                                },
                                                children: row.isCurrency && row.total ? formatCurrency(row.total) : row.total
                                            }, void 0, false, {
                                                fileName: "[project]/component/Table.tsx",
                                                lineNumber: 128,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                align: "center",
                                                sx: {
                                                    fontWeight: isTotal ? 700 : 400,
                                                    background: "#E1A9E2"
                                                },
                                                children: row.coding
                                            }, void 0, false, {
                                                fileName: "[project]/component/Table.tsx",
                                                lineNumber: 140,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, (row.code || row.label || "row") + section + rowIdx, true, {
                                        fileName: "[project]/component/Table.tsx",
                                        lineNumber: 85,
                                        columnNumber: 21
                                    }, this);
                                });
                            } else {
                                // Render with empty first cell and restore section color across the row
                                return rows.map((row, rowIdx)=>{
                                    const sectionColor = colorMap[row.colorGroup] || colorMap[rows[0].colorGroup] || undefined;
                                    const isTotal = row.type === "total";
                                    // Only use section color for isSectionHeader rows, otherwise white
                                    const rowBg = row.isSectionHeader ? sectionColor : "#fff";
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableRow$2f$TableRow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                sx: {
                                                    background: rowBg,
                                                    minWidth: 32,
                                                    maxWidth: 32
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/component/Table.tsx",
                                                lineNumber: 167,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                sx: {
                                                    fontWeight: isTotal ? 700 : 500,
                                                    fontSize: 14,
                                                    background: rowBg
                                                },
                                                children: row.code ? row.code : row.label
                                            }, void 0, false, {
                                                fileName: "[project]/component/Table.tsx",
                                                lineNumber: 170,
                                                columnNumber: 23
                                            }, this),
                                            row.values.map((val, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    align: "center",
                                                    sx: {
                                                        fontWeight: isTotal ? 700 : 400,
                                                        background: rowBg
                                                    },
                                                    children: row.isCurrency && val ? formatCurrency(val) : val
                                                }, i, false, {
                                                    fileName: "[project]/component/Table.tsx",
                                                    lineNumber: 180,
                                                    columnNumber: 25
                                                }, this)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                align: "center",
                                                sx: {
                                                    fontWeight: isTotal ? 700 : 400,
                                                    background: "#D3D3D3"
                                                },
                                                children: row.isCurrency && row.total ? formatCurrency(row.total) : row.total
                                            }, void 0, false, {
                                                fileName: "[project]/component/Table.tsx",
                                                lineNumber: 192,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                align: "center",
                                                sx: {
                                                    fontWeight: isTotal ? 700 : 400,
                                                    background: "#E1A9E2"
                                                },
                                                children: row.coding
                                            }, void 0, false, {
                                                fileName: "[project]/component/Table.tsx",
                                                lineNumber: 204,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, (row.code || row.label || "row") + section + rowIdx, true, {
                                        fileName: "[project]/component/Table.tsx",
                                        lineNumber: 163,
                                        columnNumber: 21
                                    }, this);
                                });
                            }
                        });
                    })()
                }, void 0, false, {
                    fileName: "[project]/component/Table.tsx",
                    lineNumber: 61,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/component/Table.tsx",
            lineNumber: 32,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/component/Table.tsx",
        lineNumber: 31,
        columnNumber: 5
    }, this);
}
_c = FinancialKpiTable;
var _c;
__turbopack_context__.k.register(_c, "FinancialKpiTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>DashboardLayoutBasic
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Box$2f$Box$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Box/Box.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Typography/Typography.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$createTheme$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__createTheme$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/styles/createTheme.js [app-client] (ecmascript) <export default as createTheme>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$icons$2d$material$2f$esm$2f$Apartment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mui/icons-material/esm/Apartment.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$icons$2d$material$2f$esm$2f$Person$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mui/icons-material/esm/Person.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$toolpad$2f$core$2f$esm$2f$AppProvider$2f$AppProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@toolpad/core/esm/AppProvider/AppProvider.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$toolpad$2f$core$2f$esm$2f$DashboardLayout$2f$DashboardLayout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@toolpad/core/esm/DashboardLayout/DashboardLayout.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$toolpad$2f$core$2f$esm$2f$internal$2f$demo$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@toolpad/core/esm/internal/demo.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$component$2f$Table$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/component/Table.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
const NAVIGATION = [
    {
        segment: "reports",
        title: "Reports",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$icons$2d$material$2f$esm$2f$Apartment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 18,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0)),
        children: [
            {
                segment: "sales",
                title: "Sales",
                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$icons$2d$material$2f$esm$2f$Person$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 23,
                    columnNumber: 15
                }, ("TURBOPACK compile-time value", void 0))
            },
            {
                segment: "traffic",
                title: "Traffic",
                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$icons$2d$material$2f$esm$2f$Person$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 28,
                    columnNumber: 15
                }, ("TURBOPACK compile-time value", void 0))
            }
        ]
    },
    {
        segment: "integrations",
        title: "Integrations",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$icons$2d$material$2f$esm$2f$Apartment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 35,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0))
    }
];
const demoTheme = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$createTheme$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__createTheme$3e$__["createTheme"])({
    cssVariables: {
        colorSchemeSelector: "data-toolpad-color-scheme"
    },
    colorSchemes: {
        light: true,
        dark: true
    }
});
function DemoPageContent(param) {
    let { pathname } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Box$2f$Box$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            children: [
                "Dashboard content for ",
                pathname
            ]
        }, void 0, true, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 49,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 48,
        columnNumber: 5
    }, this);
}
_c = DemoPageContent;
function DashboardLayoutBasic() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$toolpad$2f$core$2f$esm$2f$internal$2f$demo$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDemoRouter"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$toolpad$2f$core$2f$esm$2f$AppProvider$2f$AppProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AppProvider"], {
        navigation: NAVIGATION,
        router: router,
        theme: demoTheme,
        branding: {
            title: "MedLaunch Admin",
            logo: ""
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$toolpad$2f$core$2f$esm$2f$DashboardLayout$2f$DashboardLayout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DashboardLayout"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    padding: 20
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$component$2f$Table$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 66,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 65,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 64,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
_s(DashboardLayoutBasic, "2mvhRnPsv09P3Z4tZIYv2Av8e0E=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$toolpad$2f$core$2f$esm$2f$internal$2f$demo$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDemoRouter"]
    ];
});
_c1 = DashboardLayoutBasic;
var _c, _c1;
__turbopack_context__.k.register(_c, "DemoPageContent");
__turbopack_context__.k.register(_c1, "DashboardLayoutBasic");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=_391709a8._.js.map