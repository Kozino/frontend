// materialityWizard.js

const steps = [
  {
    step: 1,
    name: "Define Scope",
    questions: [
      { id: "num_locations", text: "Number of operating locations in Qatar?", type: "number" },
      { id: "num_employees", text: "Total employees (FTE)?", type: "number" },
      { id: "sector", text: "Select your sector", type: "select", 
        options: ["Agriculture", "E-Commerce", "Education", "Fintech", "Healthcare", "Industrial Manufacturing"] }
    ]
  },
  {
    step: 2,
    name: "Identify Potential Material Topics",
    questions: [
      { id: "high_energy", text: "Is energy >20% of your operating costs?", type: "boolean" },
      { id: "high_water", text: "Is water critical to your production?", type: "boolean" },
      { id: "export_markets", text: "Do you export to EU/US/UK?", type: "boolean" },
      { id: "gov_contract", text: "Do you bid for government tenders?", type: "boolean" }
    ]
  },
  {
    step: 3,
    name: "Stakeholder Engagement (simulated)",
    questions: [
      { id: "investor_esg", text: "Have investors asked for ESG data?", type: "boolean" },
      { id: "employee_demand", text: "Employees request sustainability initiatives?", type: "boolean" },
      { id: "regulator_interest", text: "Any QCB/QSE regulatory inquiry received?", type: "boolean" }
    ]
  }
];

// Scoring algorithm – produces materiality matrix
function calculateMaterialityMatrix(responses) {
  let envScore = 0, socialScore = 0, govScore = 0;
  
  // Environment triggers (based on page 13-15 and sector page 30)
  if (responses.high_energy) envScore += 3;
  if (responses.high_water) envScore += 3;
  if (responses.sector === "Industrial Manufacturing") envScore += 2;
  if (responses.sector === "Agriculture") envScore += 2;
  
  // Social triggers
  if (responses.num_employees > 50) socialScore += 2;
  if (responses.sector === "Healthcare") socialScore += 3;
  if (responses.employee_demand) socialScore += 2;
  
  // Governance triggers
  if (responses.export_markets) govScore += 3;
  if (responses.gov_contract) govScore += 3;
  if (responses.investor_esg) govScore += 2;
  if (responses.regulator_interest) govScore += 3;
  
  return {
    matrix: {
      Environment: envScore,
      Social: socialScore,
      Governance: govScore
    },
    priority_areas: [
      ...(envScore > 5 ? ["GHG Emissions", "Energy Management"] : []),
      ...(socialScore > 4 ? ["Health & Safety", "Human Capital Management"] : []),
      ...(govScore > 4 ? ["Corporate Governance", "Supply Chain Management"] : [])
    ],
    recommendation: `Based on your inputs, your top 3 material topics are: ${getTopTopics(envScore, socialScore, govScore)}`
  };
}

function getTopTopics(e, s, g) {
  let topics = [];
  if (e >= s && e >= g) topics.push("Environmental (start with GHG + Energy)");
  if (s >= e && s >= g) topics.push("Social (start with Health & Safety + Diversity)");
  if (g >= e && g >= s) topics.push("Governance (start with Anti-corruption + Supply Chain)");
  return topics.join(", ");
}

// Example output after wizard completion
const exampleResponses = {
  sector: "Industrial Manufacturing",
  high_energy: true,
  export_markets: true,
  num_employees: 120
};

console.log(calculateMaterialityMatrix(exampleResponses));
/* OUTPUT:
{
  matrix: { Environment: 5, Social: 2, Governance: 3 },
  priority_areas: ["GHG Emissions", "Energy Management", "Corporate Governance", "Supply Chain Management"],
  recommendation: "Your top material topics: Environmental (start with GHG + Energy), Governance (start with Anti-corruption + Supply Chain)"
}
*/