"use client"
// @ts-ignore


import { calculateNetSalary } from "@/app/action"
import { Button } from "@/components/ui/button"
import { Card, CardContent, Cardheader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import axios from "axios"
import { ThemeToggle } from "@/components/heme-toggle"
import { Line } from 'react-chartjs-2'  // Import the Line chart from react-chartjs-2
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import PositiveAndNegativeBarChart from "@/components/chart"
import { useTheme } from 'next-themes'


ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement, // Add PointElement here
  LineElement    // Add LineElement here if using line charts
);


export default function Home() {

  const { theme } = useTheme()
  const [chartData, setChartData] = useState(null)
  const [isExcelExporting, setIsExcelExporting] = useState(false)
  const [excelExportError, setExcelExportError] = useState<string | null>(null)
  const [grossSalary, setGrossSalary] = useState(3000)
  const [transportBonus, setTransportBonus] = useState(0)
  const [performanceBonus, setPerformanceBonus] = useState(0)
  const [housingHelp, setHousingHelp] = useState(0)
  const [extraHours, setExtraHours] = useState(0)
  const [salaryAdvance, setSalaryAdvance] = useState(0)
  const [missedDays, setMissedDays] = useState(0)
  const [healthDeduction, setHealthDeduction] = useState(0)
  const [retirementDeduction, setRetirementDeduction] = useState(0)
  const [taxDeduction, setTaxDeduction] = useState(0)
  const [paymentPeriod, setPaymentPeriod] = useState("monthly")
  const [results, setResults] = useState<{
    netSalary: number
    totalAdditions: number
    totalDeductions: number
    breakdown: {
      grossSalary: number
      transportBonus: number
      performanceBonus: number
      housingHelp: number
      extraHours: number
      salaryAdvance: number
      missedDaysDeduction: number
      healthDeduction: number
      retirementDeduction: number
      taxDeduction: number
    }
  } | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  async function handleCalculate() {
    setIsCalculating(true)
    try {
      const multiplier = paymentPeriod === "annual" ? 1 / 12 : 1
  
      const calculationData = {
        gross_salary: grossSalary * multiplier,
        transport_bonus: transportBonus * multiplier,
        performance_bonus: performanceBonus * multiplier,
        housing_help: housingHelp * multiplier,
        extra_hours: extraHours * multiplier,
        salary_advance: salaryAdvance * multiplier,
        missed_days: missedDays,
        health_deduction: healthDeduction * multiplier,
        retirement_deduction: retirementDeduction * multiplier,
        tax_deduction: taxDeduction * multiplier,
      }
  
      const response = await axios.post("http://127.0.0.1:8000/calculate", calculationData)
      setResults(response.data)
  
      const breakdown = response.data.breakdown
  
      const isDark = theme === 'dark'
  
      const bonusColor = isDark ? 'rgba(0, 200, 255, 0.7)' : 'rgba(0, 123, 255, 0.6)'
      const deductionColor = isDark ? 'rgba(255, 99, 132, 0.8)' : 'rgba(255, 99, 132, 0.6)'
  
      setChartData({
        labels: [
          'Gross Salary',
          'Transport Bonus',
          'Performance Bonus',
          'Housing Help',
          'Extra Hours',
          'Salary Advance',
          'Missed Days Deduction',
          'Health Deduction',
          'Retirement Deduction',
          'Tax Deduction'
        ],
        datasets: [
          {
            label: "Salary Breakdown",
            data: [
              breakdown.grossSalary,
              breakdown.transportBonus,
              breakdown.performanceBonus,
              breakdown.housingHelp,
              breakdown.extraHours,
              -breakdown.salaryAdvance,
              -breakdown.missedDaysDeduction,
              -breakdown.healthDeduction,
              -breakdown.retirementDeduction,
              -breakdown.taxDeduction
            ],
            backgroundColor: [
              bonusColor,
              bonusColor,
              bonusColor,
              bonusColor,
              bonusColor,
              deductionColor,
              deductionColor,
              deductionColor,
              deductionColor,
              deductionColor
            ]
          }
        ]
      })
  
    } catch (error) {
      console.error("Calculation error:", error)
    } finally {
      setIsCalculating(false)
    }
  }

// Then use this improved handleExportExcel function:
async function handleExportExcel() {
  try {
    // Reset any previous errors
    setExcelExportError(null);
    
    // Use the same calculation logic as in handleCalculate
    const multiplier = paymentPeriod === "annual" ? 1 / 12 : 1;
    
    const calculationData = {
      gross_salary: grossSalary * multiplier,
      transport_bonus: transportBonus * multiplier,
      performance_bonus: performanceBonus * multiplier,
      housing_help: housingHelp * multiplier,
      extra_hours: extraHours * multiplier,
      salary_advance: salaryAdvance * multiplier,
      missed_days: missedDays,
      health_deduction: healthDeduction * multiplier,
      retirement_deduction: retirementDeduction * multiplier,
      tax_deduction: taxDeduction * multiplier,
    };
    
    // Set dedicated loading state for Excel export
    setIsExcelExporting(true);
    
    // Make API request to the export_excel endpoint
    const response = await axios({
      url: "http://127.0.0.1:8000/export_excel",
      method: "POST",
      data: calculationData,
      responseType: "blob", // Important: tells axios to handle response as binary data
    });
    
    // Check if the response is valid
    if (response.status !== 200) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    // Create a blob from the response data
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    
    // Check if blob is valid and has content
    if (blob.size === 0) {
      throw new Error("Received empty file from server");
    }
    
    // Create a download URL for the blob
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary link element and trigger download
    const link = document.createElement("a");
    link.href = downloadUrl;
    
    // Set the filename - can include the payment period
    const filename = `salary_breakdown_${paymentPeriod}.xlsx`;
    link.setAttribute("download", filename);
    
    // Append to body, click to download, then clean up
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    
    // Revoke the blob URL to free up memory
    window.URL.revokeObjectURL(downloadUrl);
    
  } catch (error) {
    console.error("Excel export error:", error);
    
    // Set specific error message based on the error type
    if (error instanceof Error) {
      setExcelExportError(`Failed to export Excel file: ${error.message}`);
    } else {
      setExcelExportError("Failed to export Excel file. Please try again.");
    }
  } finally {
    // Reset loading state
    setIsExcelExporting(false);
  }
}



  return (
    <Card className="shadow-lg ">
      <Cardheader className="bg-muted/50 flex justify-between items-center p-4">
      
        <div>

        <img src='/logo.png'  className="h-16 "/>
        </div>

<ThemeToggle />
      </Cardheader>
      <CardContent className="pt-6">
        <Tabs defaultValue="monthly" onValueChange={setPaymentPeriod} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">Annual</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <h3 className="font-medium text-lg">Base Salary</h3>
            <div className="space-y-2">
              <Label htmlFor="grossSalary">Gross {paymentPeriod === "annual" ? "Annual" : "Monthly"} Salary</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="grossSalary"
                  type="number"
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium">dh</span>
              </div>
            </div>

            <h3 className="font-medium text-lg pt-2">Additions</h3>

            <div className="space-y-2">
              <Label htmlFor="transportBonus">Transport Bonus</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="transportBonus"
                  type="number"
                  value={transportBonus}
                  onChange={(e) => setTransportBonus(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium">dh</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="performanceBonus">Performance Bonus</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="performanceBonus"
                  type="number"
                  value={performanceBonus}
                  onChange={(e) => setPerformanceBonus(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium">dh</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="housingHelp">Housing Help</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="housingHelp"
                  type="number"
                  value={housingHelp}
                  onChange={(e) => setHousingHelp(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium">dh</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="extraHours">Extra Hours</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="extraHours"
                  type="number"
                  value={extraHours}
                  onChange={(e) => setExtraHours(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium">dh</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-medium text-lg">Deductions</h3>

            <div className="space-y-2">
              <Label htmlFor="salaryAdvance">Salary Advance</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="salaryAdvance"
                  type="number"
                  value={salaryAdvance}
                  onChange={(e) => setSalaryAdvance(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium">dh</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="missedDays">Missed Days</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="missedDays"
                  type="number"
                  value={missedDays}
                  onChange={(e) => setMissedDays(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium">days</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="healthDeduction">Health Insurance</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="healthDeduction"
                  type="number"
                  value={healthDeduction}
                  onChange={(e) => setHealthDeduction(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium">dh</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retirementDeduction">Retirement Contribution</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="retirementDeduction"
                  type="number"
                  value={retirementDeduction}
                  onChange={(e) => setRetirementDeduction(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium">dh</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxDeduction">Tax Deduction</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="taxDeduction"
                  type="number"
                  value={taxDeduction}
                  onChange={(e) => setTaxDeduction(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium">dh</span>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleCalculate} className="w-full mt-8 bg-[#FFCC33] dark:bg-[#FFBF00]" disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate Net Salary"}
        </Button>
      </CardContent>
      {results      && (
  
    <PositiveAndNegativeBarChart data={chartData} />

)}
   {results      && (
  
  <Button 
  onClick={handleExportExcel}
  disabled={isExcelExporting}
  className="bg-green-600 hover:bg-green-700"
>
  {isExcelExporting ? "Exporting..." : (
    <>
      Export to Excel
    </>
  )}
</Button>

)}

      {results && (
        <CardContent className="border-t pt-6 bg-primary/5">
          <h3 className="text-xl font-semibold mb-4">Calculation Results</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-background rounded-lg shadow-sm">
                <p className="text-sm text-muted-foreground">Gross Salary</p>
                <p className="text-lg font-medium">{results.breakdown.grossSalary.toLocaleString()}dh</p>
              </div>
              <div className="p-4 bg-background rounded-lg shadow-sm">
                <p className="text-sm text-muted-foreground">Total Additions</p>
                <p className="text-lg font-medium text-green-600">{results.totalAdditions.toLocaleString()}dh</p>
              </div>
              <div className="p-4 bg-background rounded-lg shadow-sm">
                <p className="text-sm text-muted-foreground">Total Deductions</p>
                <p className="text-lg font-medium text-red-600">{results.totalDeductions.toLocaleString()}dh</p>
              </div>
            </div>

            <div className="p-6 bg-background rounded-lg shadow-sm border-2 border-primary/20">
              <p className="text-sm text-muted-foreground">Net Salary</p>
              <p className="text-2xl font-bold text-primary">{results.netSalary.toLocaleString()}dh</p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Detailed Breakdown</h4>

              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium mb-2">Additions</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Transport Bonus</span>
                      <span className="text-green-600">{results.breakdown.transportBonus.toLocaleString()}dh</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Performance Bonus</span>
                      <span className="text-green-600">{results.breakdown.performanceBonus.toLocaleString()}dh</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Housing Help</span>
                      <span className="text-green-600">{results.breakdown.housingHelp.toLocaleString()}dh</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Extra Hours</span>
                      <span className="text-green-600">{results.breakdown.extraHours.toLocaleString()}dh</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium mb-2">Deductions</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Salary Advance</span>
                      <span className="text-red-600">{results.breakdown.salaryAdvance.toLocaleString()}dh</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Missed Days ({results.breakdown.missedDaysDeduction > 0 ? missedDays : 0} days)</span>
                      <span className="text-red-600">{results.breakdown.missedDaysDeduction.toLocaleString()}dh</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Health Insurance</span>
                      <span className="text-red-600">{results.breakdown.healthDeduction.toLocaleString()}dh</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Retirement Contribution</span>
                      <span className="text-red-600">{results.breakdown.retirementDeduction.toLocaleString()}dh</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax Deduction</span>
                      <span className="text-red-600">{results.breakdown.taxDeduction.toLocaleString()}dh</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {paymentPeriod === "monthly" && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Annual Projection</h4>
                <div className="flex justify-between">
                  <span className="text-sm">Annual Net Salary (12 months)</span>
                  <span className="font-medium">{(results.netSalary * 12).toLocaleString()}dh</span>
                </div>
              </div>
            )}

            {paymentPeriod === "annual" && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Monthly Breakdown</h4>
                <div className="flex justify-between">
                  <span className="text-sm">Monthly Net Salary</span>
                  <span className="font-medium">
                    {(results.netSalary / 12).toLocaleString(undefined, { maximumFractionDigits: 2 })}dh
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )

}
