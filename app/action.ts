"use server"

interface SalaryCalculationData {
  grossSalary: number
  transportBonus: number
  performanceBonus: number
  housingHelp: number
  extraHours: number
  salaryAdvance: number
  missedDays: number
  healthDeduction: number

  retirementDeduction: number
  taxDeduction: number
}

export async function calculateNetSalary(data: SalaryCalculationData) {
  // Simulate server processing delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  const {
    grossSalary,
    transportBonus,
    performanceBonus,
    housingHelp,
    extraHours,
    salaryAdvance,
    missedDays,
    healthDeduction,
    retirementDeduction,
    taxDeduction,
  } = data

  // Calculate missed days deduction (assuming 22 working days per month)
  const dailyRate = grossSalary / 22
  const missedDaysDeduction = missedDays > 0 ? dailyRate * missedDays : 0

  // Calculate total additions
  const totalAdditions = transportBonus + performanceBonus + housingHelp + extraHours

  // Calculate total deductions
  const totalDeductions = salaryAdvance + missedDaysDeduction + healthDeduction + retirementDeduction + taxDeduction

  // Calculate net salary
  const netSalary = grossSalary + totalAdditions - totalDeductions

  return {
    netSalary: Math.max(0, Math.round(netSalary * 100) / 100),
    totalAdditions: Math.round(totalAdditions * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    breakdown: {
      grossSalary: Math.round(grossSalary * 100) / 100,
      transportBonus: Math.round(transportBonus * 100) / 100,
      performanceBonus: Math.round(performanceBonus * 100) / 100,
      housingHelp: Math.round(housingHelp * 100) / 100,
      extraHours: Math.round(extraHours * 100) / 100,
      salaryAdvance: Math.round(salaryAdvance * 100) / 100,
      missedDaysDeduction: Math.round(missedDaysDeduction * 100) / 100,
      healthDeduction: Math.round(healthDeduction * 100) / 100,
      retirementDeduction: Math.round(retirementDeduction * 100) / 100,
      taxDeduction: Math.round(taxDeduction * 100) / 100,
    },
  }
}

export async function submitContactForm(formData: FormData) {
  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const message = formData.get("message") as string

  if (!name || !email || !message) {
    return { message: "Please fill in all fields." }
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { message: "Please enter a valid email address." }
  }

  // Simulate sending the email
  console.log("Form Data:", { name, email, message })

  return { message: "Message sent successfully!" }
}
