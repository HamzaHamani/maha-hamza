import io
import pandas as pd
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI()  # start the app

# allow connection from frontend (on localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# input form for salary info
class SalaryInput(BaseModel):
    gross_salary: float  # base salary
    transport_bonus: float = 0  # money for transport
    performance_bonus: float = 0  # reward for good work
    housing_help: float = 0  # help with rent
    extra_hours: float = 0  # overtime money
    salary_advance: float = 0  # money taken before salary day
    missed_days: int = 0  # days missed
    health_deduction: float = 0  # health money cut
    retirement_deduction: float = 0  # retirement money cut
    tax_deduction: float = 0  # tax money cut


# this runs when user sends salary data
@app.post("/calculate")
def calcute_salary(data: SalaryInput):
    # daily salary = monthly salary / 22 working days
    daily_salary = data.gross_salary / 22
    missed_days_deduction = data.missed_days * daily_salary  # cut for missed days

    # add up all bonuses
    additions = [
        data.transport_bonus,
        data.performance_bonus,
        data.housing_help,
        data.extra_hours
    ]
    total_additions = 0
    # forloop
    for n in additions:
        total_additions += n

    # add up all deductions
    deductions = [
        data.salary_advance,
        missed_days_deduction,
        data.health_deduction,
        data.retirement_deduction,
        data.tax_deduction
    ]
    total_deductions = 0
    for n in deductions:
        total_deductions += n

    # check missed days
    if data.missed_days > 5:
        missed_note = "Too many missed days!"
    else:
        missed_note = "Missed days are okay."

    # check if bonuses were added
    if total_additions == 0:
        bonus_note = "No bonus this month."
    else:
        bonus_note = "You got some bonuses!"

    # calculate final salary
    net_salary = data.gross_salary + total_additions - total_deductions

    # send back the results
    return {
        "netSalary": round(net_salary, 2),
        "totalAdditions": round(total_additions, 2),
        "totalDeductions": round(total_deductions, 2),
        "notes": {
            "missedDaysStatus": missed_note,
            "bonusStatus": bonus_note
        },
        "breakdown": {
            "grossSalary": data.gross_salary,
            "transportBonus": data.transport_bonus,
            "performanceBonus": data.performance_bonus,
            "housingHelp": data.housing_help,
            "extraHours": data.extra_hours,
            "salaryAdvance": data.salary_advance,
            "missedDaysDeduction": round(missed_days_deduction, 2),
            "healthDeduction": data.health_deduction,
            "retirementDeduction": data.retirement_deduction,
            "taxDeduction": data.tax_deduction,
        }
    }


  

# New endpoint for Excel file generation
@app.post("/export_excel")
def export_excel(data: SalaryInput):
    
    # Calculate all values as in the calcute_salary function
    daily_salary = data.gross_salary / 22
    missed_days_deduction = data.missed_days * daily_salary

    # Create lists for the Excel table
    categories = [
        "Gross Salary", 
        "Transport Bonus", 
        "Performance Bonus", 
        "Housing Help", 
        "Extra Hours", 
        "Salary Advance",
        f"Missed Days Deduction ({data.missed_days} days)",
        "Health Deduction",
        "Retirement Deduction",
        "Tax Deduction"
    ]
    
    values = [
        data.gross_salary,
        data.transport_bonus,
        data.performance_bonus,
        data.housing_help,
        data.extra_hours,
        -data.salary_advance,  # Negative as it's a deduction
        -missed_days_deduction,  # Negative as it's a deduction
        -data.health_deduction,  # Negative as it's a deduction
        -data.retirement_deduction,  # Negative as it's a deduction
        -data.tax_deduction  # Negative as it's a deduction
    ]
    
    # Calculate net salary for the total
    net_salary = data.gross_salary + sum([
        data.transport_bonus,
        data.performance_bonus,
        data.housing_help,
        data.extra_hours
    ]) - sum([
        data.salary_advance,
        missed_days_deduction,
        data.health_deduction,
        data.retirement_deduction,
        data.tax_deduction
    ])
    
    # Add total row
    categories.append("NET SALARY")
    values.append(net_salary)
    
    # Create DataFrame
    df = pd.DataFrame({
        'Category': categories,
        'Amount': values
    })
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Salary Breakdown', index=False)
        
        # Get the xlsxwriter workbook and worksheet objects
        workbook = writer.book
        worksheet = writer.sheets['Salary Breakdown']
        
        # Add a format for the header
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#FFBF00',  # Using your MAIN color
            'border': 1
        })
        
        # Add a format for the total row
        total_format = workbook.add_format({
            'bold': True,
            'bg_color': '#E6E6E6',
            'border': 1
        })
        
        # Apply formats
        for col_num, value in enumerate(df.columns.values):
            worksheet.write(0, col_num, value, header_format)
        
        # Format the total row (last row)
        for col_num in range(len(df.columns)):
            worksheet.write(len(df), col_num, df.iloc[-1, col_num], total_format)
        
        # Set column widths
        worksheet.set_column('A:A', 30)
        worksheet.set_column('B:B', 15)
        
        # Add number format to amount column
        money_fmt = workbook.add_format({'num_format': '#,##0.00'})
        worksheet.set_column('B:B', 15, money_fmt)
    
    # Reset file pointer
    output.seek(0)
    
    # Return the Excel file
    headers = {
        'Content-Disposition': 'attachment; filename="salary_breakdown.xlsx"'
    }
    return Response(output.getvalue(), headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')