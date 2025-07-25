import ApartmentIcon from "@mui/icons-material/Apartment";
import PersonIcon from "@mui/icons-material/Person";
import { useTreeItemModel } from "@mui/x-tree-view/hooks";

const baseData = [
  {
    section: "Initial Visits",
    type: "data",
    code: "99374",
    values: [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
    total: 7,
    coding: "7%",
    colorGroup: "yellow",
  },
  {
    section: "Initial Visits",
    type: "data",
    code: "99375",
    values: [1, 2, 1, 1, 2, 3, 2, 1, 2, 1, 3, 2],
    total: 21,
    coding: "5%",
    colorGroup: "yellow",
  },
  {
    section: "Initial Visits",
    type: "data",
    code: "99376",
    values: [11, 16, 17, 9, 12, 15, 18, 17, 14, 16, 13, 17],
    total: 159,
    coding: "92%",
    colorGroup: "yellow",
  },
  {
    section: "Initial Visits",
    type: "total",
    label: "Total",
    values: [14, 19, 21, 12, 15, 27, 23, 12, 18, 27, 18, 27],
    total: 273,
    coding: "",
    colorGroup: "yellow",
  },

  // Subsequent Visits Section (Orange)
  {
    section: "Subsequent Visits",
    type: "data",
    code: "99377",
    values: [5, 3, 2, 4, 6, 5, 4, 3, 5, 4, 6, 5],
    total: 52,
    coding: "2%",
    colorGroup: "orange",
  },
  {
    section: "Subsequent Visits",
    type: "data",
    code: "99378",
    values: [96, 19, 47, 45, 51, 38, 42, 36, 44, 49, 47, 52],
    total: 559,
    coding: "35%",
    colorGroup: "orange",
  },
  {
    section: "Subsequent Visits",
    type: "data",
    code: "99379",
    values: [174, 123, 34, 65, 89, 111, 97, 127, 175, 98, 112, 137],
    total: 1158,
    coding: "56%",
    colorGroup: "orange",
  },
  {
    section: "Subsequent Visits",
    type: "data",
    code: "99317",
    values: [42, 39, 2, 66, 53, 47, 51, 48, 57, 54, 49, 52],
    total: 553,
    coding: "9%",
    colorGroup: "orange",
  },
  {
    section: "Subsequent Visits",
    type: "total",
    label: "Total",
    values: [312, 181, 83, 111, 273, 278, 196, 279, 277, 275, 199, 211],
    total: 2325,
    coding: "",
    colorGroup: "orange",
  },

  // Discharge Section (Grey)
  {
    section: "Discharge",
    type: "data",
    code: "99315",
    values: [2, 1, 3, 2, 1, 2, 3, 1, 2, 3, 2, 1],
    total: 23,
    coding: "31%",
    colorGroup: "grey",
  },
  {
    section: "Discharge",
    type: "data",
    code: "99316",
    values: [1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1],
    total: 14,
    coding: "69%",
    colorGroup: "grey",
  },
  {
    section: "Discharge",
    type: "total",
    label: "Total",
    values: [7, 7, 1, 1, 7, 7, 7, 7, 7, 7, 7, 7],
    total: 13,
    coding: "",
    colorGroup: "grey",
  },

  // Overall Totals (Blue)
  {
    section: "Totals",
    type: "total",
    label: "Total Visits",
    values: [332, 197, 97, 96, 122, 145, 217, 188, 199, 221, 187, 275],
    total: 2792,
    coding: "177%",
    colorGroup: "blue",
  },

  // RVUs (Blue)
  {
    section: "RVUs",
    type: "data",
    label: "Work RVUs",
    values: [
      624.1, 525.96, 168.82, 219.76, 312.45, 489.22, 517.33, 455.12, 388.76,
      412.88, 397.23, 579.67,
    ],
    total: 4997.1,
    coding: "98%",
    colorGroup: "blue",
    isSectionHeader: true,
  },
  {
    section: "RVUs",
    type: "data",
    label: "Work RVUs per patient",
    values: [
      1.88, 2.13, 1.76, 1.8, 2.71, 2.78, 1.95, 2.12, 2.74, 1.99, 2.11, 2.15,
    ],
    total: 2.71,
    coding: "97%",
    colorGroup: "blue",
  },

  // Charges (Yellow/Green)
  {
    section: "Charges",
    type: "data",
    label: "Charges",
    values: [
      57445, 44479.5, 41179, 27677, 25477, 33217, 29177, 31757, 35887, 29977,
      26577, 35577,
    ],
    total: 397313,
    coding: "177%",
    colorGroup: "yellow",
    isCurrency: true,
    isSectionHeader: true,
  },
  {
    section: "Charges",
    type: "data",
    label: "Average charges per patient",
    values: [
      173.73, 181.36, 122.81, 169.43, 155.22, 167.12, 148.99, 177.34, 162.45,
      158.77, 166.11, 174.97,
    ],
    total: 171.33,
    coding: "98%",
    colorGroup: "yellow",
    isCurrency: true,
  },

  // Payments (Green)
  {
    section: "Payments",
    type: "data",
    label: "Payments",
    values: [
      38689, 19638, 16153, 15777, 17277, 27177, 18977, 21757, 27577, 19877,
      18477, 22777,
    ],
    total: 239437,
    coding: "63%",
    colorGroup: "green",
    isCurrency: true,
    isSectionHeader: true,
  },
  {
    section: "Payments",
    type: "data",
    label: "Average receipts per patient",
    values: [116.55, 99.5, 93.75, 133.79, 7, 7, 7, 7, 7, 7, 7, 7],
    total: 176.71,
    coding: "",
    colorGroup: "green",
    isCurrency: true,
  },

  // Adjustments (Pink)
  {
    section: "Adjustments",
    type: "data",
    label: "Adjustments",
    values: [
      42685, 18277, 12933, 17323, 11577, 13477, 12977, 12757, 11877, 12177,
      11977, 12777,
    ],
    total: 189561,
    coding: "65%",
    colorGroup: "pink",
    isCurrency: true,
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
      "$14,177",
    ],
    total: "$164,677",
    coding: "",
    colorGroup: "orange",
    isCurrency: true,
    isSectionHeader: true,
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
      "51%",
    ],
    total: "51%",
    coding: "",
    colorGroup: "orange",
  },
  {
    section: "Provider Income",
    type: "data",
    label: "Average income per patient",
    values: ["$", "8", "8", "8", "8", "8", "8", "8", "8", "8", "8", "8"],
    total: "$",
    coding: "",
    colorGroup: "orange",
    isCurrency: true,
  },
  {
    section: "Provider Income",
    type: "data",
    label: "Average income per RVU",
    values: ["$", "8", "8", "8", "8", "8", "8", "8", "8", "8", "8", "8"],
    total: "$",
    coding: "",
    colorGroup: "orange",
    isCurrency: true,
  },
];

const navData = [
  {
    title: "Broadmoor Clinic",
    segment: "broadmoor_clinic",
    icon: <ApartmentIcon />,
    data: baseData,
    children: [
      {
        title: "Daniel Oukolov",
        segment: "daniel_oukolov",
        icon: <PersonIcon />,
        data: baseData,
        children: [
          {
            title: "Daniel Oukolov",
            segment: "daniel_oukolov",
            icon: <PersonIcon />,
            data: baseData,
          },
          {
            title: "Vehbi Karaagac",
            segment: "vehbi_karaagac",
            icon: <PersonIcon />,
            data: baseData,
          },
        ],
      },
      {
        title: "Vehbi Karaagac",
        segment: "vehbi_karaagac",
        icon: <PersonIcon />,
        data: baseData,
      },
    ],
  },
  {
    title: "Mason Clinic",
    segment: "mason_clinic",
    icon: <ApartmentIcon />,
    data: baseData,
  },
];

const ITEMS = [
  {
    id: "emma_watson",
    label: "Emma Watson",
    data: baseData,
    iconType: "clinic",
    children: [
      {
        id: "division_alcatraz",
        label: "Division Alcatraz",
        data: baseData,
        iconType: "clinic",
        children: [
          { id: "daniel_craig", label: "Daniel Craig", iconType: "person" },
          {
            id: "scarlett_johansson",
            label: "Scarlett Johansson",
            iconType: "person",
          },
          { id: "chris_evans", label: "Chris Evans", iconType: "person" },
          { id: "tom_hanks", label: "Tom Hanks", iconType: "person" },
          {
            id: "zendaya_coleman",
            label: "Zendaya Coleman",
            iconType: "person",
          },
        ],
      },
      {
        id: "robert_downey_jr",
        label: "Robert Downey Jr.",
        iconType: "person",
        data: baseData,
      },
      {
        id: "natalie_portman",
        label: "Natalie Portman",
        iconType: "person",
        data: baseData,
      },
    ],
  },
  {
    id: "bookmarked",
    label: "Bookmarked",
    iconType: "clinic",
    data: baseData,
    children: [
      {
        id: "leonardo_dicaprio",
        label: "Leonardo DiCaprio",
        iconType: "clinic",
        data: baseData,
      },
      {
        id: "jennifer_lawrence",
        label: "Jennifer Lawrence",
        iconType: "person",
        data: baseData,
      },
      {
        id: "morgan_freeman",
        label: "Morgan Freeman",
        iconType: "person",
        data: baseData,
      },
      {
        id: "emma_stone",
        label: "Emma Stone",
        iconType: "person",
        data: baseData,
      },
    ],
  },
  { id: "history", label: "History", iconType: "clinic", data: baseData },
  { id: "trash", label: "Trash", iconType: "clinic", data: baseData },
];

export default ITEMS;
